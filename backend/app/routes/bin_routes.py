"""
Smart Bin Management and Simulation API Routes.
Provides listing, search/filter, detail retrieval, and Demo Mode simulation.
"""

from typing import List, Optional
from datetime import datetime, timedelta
import random
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.app.database import get_db
from backend.app.models.all_models import Bin, SensorReading, Prediction, User, Collection
from backend.app.schemas.schemas import BinResponse, BinCreate, BinAssignRequest
from backend.app.services.auth_service import require_role
from backend.app.services.prediction_service import predict_bin_telemetry

router = APIRouter(prefix="/bins", tags=["Smart Bins"])


def enrich_bin(bin_obj: Bin, db: Session) -> dict:
    latest_pred = db.query(Prediction).filter(Prediction.bin_id == bin_obj.id).order_by(Prediction.prediction_time.desc()).first()
    
    # Calculate priority score
    risk_level = latest_pred.risk_level if latest_pred else "LOW"
    pred_6h = latest_pred.predicted_6h if latest_pred else bin_obj.current_fill
    norm_risk = 100.0 if risk_level == "HIGH" else (50.0 if risk_level == "MEDIUM" else 10.0)
    
    score = round((0.45 * bin_obj.current_fill) + (0.35 * pred_6h) + (0.20 * norm_risk), 2)
    if score >= 75.0 or bin_obj.current_fill >= 85.0:
        p_lvl = "CRITICAL"
    elif score >= 55.0 or bin_obj.current_fill >= 70.0:
        p_lvl = "HIGH"
    elif score >= 35.0:
        p_lvl = "MEDIUM"
    else:
        p_lvl = "LOW"

    return {
        "id": bin_obj.id,
        "bin_code": bin_obj.bin_code,
        "location_name": bin_obj.location_name,
        "latitude": bin_obj.latitude,
        "longitude": bin_obj.longitude,
        "capacity": bin_obj.capacity,
        "waste_type": bin_obj.waste_type,
        "current_fill": bin_obj.current_fill,
        "status": bin_obj.status,
        "assigned_collector_id": getattr(bin_obj, 'assigned_collector_id', None),
        "assigned_collector_name": getattr(bin_obj, 'assigned_collector_name', None),
        "last_collection": bin_obj.last_collection,
        "latest_prediction": latest_pred,
        "priority_score": score,
        "priority_level": p_lvl
    }


@router.get("", response_model=List[BinResponse])
def get_all_bins(
    search: Optional[str] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    waste_type: Optional[str] = None,
    risk: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Bin)

    if search:
        search_fmt = f"%{search}%"
        query = query.filter((Bin.bin_code.ilike(search_fmt)) | (Bin.location_name.ilike(search_fmt)))

    if status_filter:
        query = query.filter(Bin.status.ilike(status_filter))

    if waste_type:
        query = query.filter(Bin.waste_type.ilike(f"%{waste_type}%"))

    bins = query.order_by(Bin.bin_code.asc()).all()

    enriched = [enrich_bin(b, db) for b in bins]

    if risk:
        enriched = [b for b in enriched if b["latest_prediction"] and b["latest_prediction"].risk_level.upper() == risk.upper()]

    return enriched


@router.get("/collectors")
def get_all_collectors(db: Session = Depends(get_db)):
    """Fetch all active collectors registered in the platform for bin assignment."""
    collectors = db.query(User).filter(func.lower(User.role) == "collector").all()
    return [{"id": c.id, "name": c.name, "email": c.email} for c in collectors]


@router.post("/{bin_id}/assign", response_model=BinResponse)
def assign_collector_to_bin(
    bin_id: int,
    assign_in: BinAssignRequest,
    db: Session = Depends(get_db)
):
    """Assign or re-assign a collector to a smart bin."""
    bin_obj = db.query(Bin).filter(Bin.id == bin_id).first()
    if not bin_obj:
        raise HTTPException(status_code=404, detail="Bin not found")
    
    bin_obj.assigned_collector_id = assign_in.collector_id
    bin_obj.assigned_collector_name = assign_in.collector_name
    db.commit()
    db.refresh(bin_obj)
    return enrich_bin(bin_obj, db)


@router.get("/{bin_id}", response_model=BinResponse)
def get_bin_by_id(bin_id: int, db: Session = Depends(get_db)):
    bin_obj = db.query(Bin).filter(Bin.id == bin_id).first()
    if not bin_obj:
        raise HTTPException(status_code=404, detail="Bin not found")
    return enrich_bin(bin_obj, db)


@router.post("", response_model=BinResponse, status_code=status.HTTP_201_CREATED)
def create_bin(
    bin_in: BinCreate,
    db: Session = Depends(get_db),
    admin_user=Depends(require_role(["ADMIN"]))
):
    existing = db.query(Bin).filter(Bin.bin_code == bin_in.bin_code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Bin with this code already exists")

    new_bin = Bin(**bin_in.dict(), current_fill=10.0, status="Normal", last_collection=datetime.utcnow())
    db.add(new_bin)
    db.commit()
    db.refresh(new_bin)
    return enrich_bin(new_bin, db)


@router.put("/{bin_id}", response_model=BinResponse)
def update_bin(
    bin_id: int,
    bin_in: BinCreate,
    db: Session = Depends(get_db),
    admin_user=Depends(require_role(["ADMIN"]))
):
    bin_obj = db.query(Bin).filter(Bin.id == bin_id).first()
    if not bin_obj:
        raise HTTPException(status_code=404, detail="Bin not found")

    for field, val in bin_in.dict().items():
        setattr(bin_obj, field, val)

    db.commit()
    db.refresh(bin_obj)
    return enrich_bin(bin_obj, db)


@router.delete("/{bin_id}")
def delete_bin(
    bin_id: int,
    db: Session = Depends(get_db),
    admin_user=Depends(require_role(["ADMIN"]))
):
    """Safely delete a municipal bin and cascade-remove its dependent readings, predictions, and collections."""
    bin_obj = db.query(Bin).filter(Bin.id == bin_id).first()
    if not bin_obj:
        raise HTTPException(status_code=404, detail="Bin not found")

    try:
        db.query(SensorReading).filter(SensorReading.bin_id == bin_id).delete()
        db.query(Prediction).filter(Prediction.bin_id == bin_id).delete()
        db.query(Collection).filter(Collection.bin_id == bin_id).delete()
    except Exception as e:
        print(f"[!] Bin cascade cleanup notice: {e}")

    code = bin_obj.bin_code
    db.delete(bin_obj)
    db.commit()
    return {"message": f"Bin {code} successfully removed.", "deleted_id": bin_id}


@router.post("/simulate-update")
def simulate_sensor_telemetry(
    db: Session = Depends(get_db),
    admin_user=Depends(require_role(["ADMIN", "COLLECTOR"]))
):
    """
    Demo Mode Simulation (Section 36).
    Updates virtual bin fill levels realistically, saves sensor readings,
    runs actual ML regression & classification inference, updates status & priority.
    """
    bins = db.query(Bin).all()
    if not bins:
        raise HTTPException(status_code=400, detail="No bins found to simulate.")

    now = datetime.utcnow()
    updated_records = []

    for b in bins:
        # Realistic accumulation delta between 2% and 8% with noise
        delta = round(random.uniform(2.5, 7.8), 1)
        prev_fill = b.current_fill
        new_fill = min(100.0, round(prev_fill + delta, 1))
        b.current_fill = new_fill

        # Save sensor reading
        reading = SensorReading(
            bin_id=b.id,
            timestamp=now,
            fill_level=new_fill,
            previous_fill_level=prev_fill,
            fill_change_rate=delta,
            temperature=round(random.uniform(29.0, 34.0), 1),
            waste_type=b.waste_type
        )
        db.add(reading)

        # Run real ML model inference
        pred_res = predict_bin_telemetry(
            current_fill=new_fill,
            previous_fill=prev_fill,
            fill_change_rate=delta,
            location=b.location_name,
            waste_type=b.waste_type,
            hour=now.hour,
            day_of_week=now.weekday(),
            hours_since_collection=random.randint(2, 10),
            temperature=reading.temperature
        )

        prediction = Prediction(
            bin_id=b.id,
            prediction_time=now,
            predicted_6h=pred_res["predicted_6h"],
            predicted_12h=pred_res["predicted_12h"],
            overflow_probability=pred_res["overflow_probability"],
            risk_level=pred_res["risk_level"]
        )
        db.add(prediction)

        # Update bin status
        if pred_res["risk_level"] == "HIGH" or new_fill >= 80.0:
            b.status = "Critical"
        elif pred_res["risk_level"] == "MEDIUM" or new_fill >= 60.0:
            b.status = "Warning"
        else:
            b.status = "Normal"

        updated_records.append({
            "bin_code": b.bin_code,
            "location": b.location_name,
            "current_fill": new_fill,
            "predicted_6h": pred_res["predicted_6h"],
            "risk_level": pred_res["risk_level"],
            "status": b.status
        })

    db.commit()
    return {
        "message": f"Successfully simulated telemetry update across {len(bins)} smart bins.",
        "simulated_at": now.strftime("%Y-%m-%d %H:%M:%S"),
        "updated_bins_count": len(bins),
        "sample_updates": updated_records[:5]
    }
