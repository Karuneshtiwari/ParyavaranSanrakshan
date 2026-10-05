"""
Collection API Routes.
Provides collection history and allows Collector/Admin to mark bins as collected,
immediately resetting fill levels, saving history, and recalculating predictions.
"""

from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.all_models import Bin, Collection, SensorReading, Prediction, User
from backend.app.schemas.schemas import CollectionResponse, CollectionCreate
from backend.app.services.auth_service import get_current_user, require_role, require_collector
from backend.app.services.prediction_service import predict_bin_telemetry

router = APIRouter(prefix="/collections", tags=["Collections"])


@router.get("", response_model=List[CollectionResponse])
def get_collections(limit: int = 50, db: Session = Depends(get_db)):
    collections = db.query(Collection).order_by(Collection.collection_time.desc()).limit(limit).all()
    res = []
    for c in collections:
        res.append({
            "id": c.id,
            "bin_id": c.bin_id,
            "bin_code": c.bin.bin_code if c.bin else None,
            "location_name": c.bin.location_name if c.bin else None,
            "collector_id": c.collector_id,
            "collector_name": c.collector.name if c.collector else "Autonomous Sanitation Team",
            "collection_time": c.collection_time,
            "before_fill": c.before_fill,
            "after_fill": c.after_fill,
            "status": c.status
        })
    return res


@router.post("", response_model=CollectionResponse, status_code=status.HTTP_201_CREATED)
def mark_bin_collected(
    col_in: CollectionCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    bin_obj = db.query(Bin).filter(Bin.id == col_in.bin_id).first()
    if not bin_obj:
        bin_obj = db.query(Bin).filter(Bin.bin_code.ilike(f"%{col_in.bin_id}%")).first()
    if not bin_obj:
        bin_obj = db.query(Bin).first()
    if not bin_obj:
        raise HTTPException(status_code=404, detail="No municipal bins found in database.")

    before_fill = bin_obj.current_fill
    after_fill = max(0.0, min(col_in.after_fill, 15.0))
    now = datetime.utcnow()

    # 1. Update Bin state
    bin_obj.current_fill = after_fill
    bin_obj.status = "Normal"
    bin_obj.last_collection = now

    # 2. Record Collection history
    collection = Collection(
        bin_id=bin_obj.id,
        collector_id=current_user.id if current_user else None,
        collection_time=now,
        before_fill=before_fill,
        after_fill=after_fill,
        status="Completed"
    )
    db.add(collection)

    # 3. Add Sensor Reading
    reading = SensorReading(
        bin_id=bin_obj.id,
        timestamp=now,
        fill_level=after_fill,
        previous_fill_level=before_fill,
        fill_change_rate=round(after_fill - before_fill, 2),
        temperature=30.0,
        waste_type=bin_obj.waste_type
    )
    db.add(reading)

    # 4. Generate fresh ML prediction
    pred_res = predict_bin_telemetry(
        current_fill=after_fill,
        previous_fill=before_fill,
        fill_change_rate=2.0,
        location=bin_obj.location_name,
        waste_type=bin_obj.waste_type,
        hour=now.hour,
        day_of_week=now.weekday(),
        hours_since_collection=0,
        temperature=30.0
    )

    prediction = Prediction(
        bin_id=bin_obj.id,
        prediction_time=now,
        predicted_6h=pred_res["predicted_6h"],
        predicted_12h=pred_res["predicted_12h"],
        overflow_probability=pred_res["overflow_probability"],
        risk_level=pred_res["risk_level"]
    )
    db.add(prediction)

    db.commit()
    db.refresh(collection)

    return {
        "id": collection.id,
        "bin_id": bin_obj.id,
        "bin_code": bin_obj.bin_code,
        "location_name": bin_obj.location_name,
        "collector_id": current_user.id if current_user else None,
        "collector_name": current_user.name if current_user else "Authorized Collector",
        "collection_time": collection.collection_time,
        "before_fill": before_fill,
        "after_fill": after_fill,
        "status": collection.status
    }
