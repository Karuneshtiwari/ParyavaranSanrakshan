"""
Dashboard & Analytics API Routes.
Provides summary metrics, real-time analytics aggregations, and prioritized collection schedules.
"""

from typing import List, Dict, Any
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.app.database import get_db
from backend.app.models.all_models import Bin, Prediction, WasteScan, Collection
from backend.app.schemas.schemas import DashboardSummary, PriorityItem

router = APIRouter(prefix="/dashboard", tags=["Dashboard & Analytics"])


@router.get("/summary", response_model=DashboardSummary)
def get_dashboard_summary(db: Session = Depends(get_db)):
    bins = db.query(Bin).all()
    total_bins = len(bins)
    
    normal_count = sum(1 for b in bins if b.status == "Normal")
    warning_count = sum(1 for b in bins if b.status == "Warning")
    critical_count = sum(1 for b in bins if b.status == "Critical")
    
    avg_fill = round(sum(b.current_fill for b in bins) / max(1, total_bins), 1)

    # Check predictions with HIGH risk
    pred_overflow = db.query(Prediction).filter(Prediction.risk_level == "HIGH").count()
    
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    scans_today = db.query(WasteScan).filter(WasteScan.created_at >= today_start).count()
    collections_today = db.query(Collection).filter(Collection.collection_time >= today_start).count()

    return {
        "total_bins": total_bins,
        "normal_count": normal_count,
        "warning_count": warning_count,
        "critical_count": critical_count,
        "average_fill": avg_fill,
        "predicted_overflow_count": pred_overflow,
        "total_scans_today": scans_today,
        "total_collections_today": collections_today
    }


@router.get("/priority", response_model=List[PriorityItem])
def get_collection_priority(db: Session = Depends(get_db)):
    """
    Transparent Decision-Support Collection Priority (Section 9 & 24):
    Score = 0.45 * current_fill + 0.35 * predicted_6h + 0.20 * normalized_risk
    Sorted by highest score first.
    """
    bins = db.query(Bin).all()
    priority_list = []

    for b in bins:
        latest_pred = db.query(Prediction).filter(Prediction.bin_id == b.id).order_by(Prediction.prediction_time.desc()).first()
        pred_6h = latest_pred.predicted_6h if latest_pred else b.current_fill
        pred_12h = latest_pred.predicted_12h if latest_pred else b.current_fill
        risk = latest_pred.risk_level if latest_pred else "LOW"
        prob = latest_pred.overflow_probability if latest_pred else 0.15

        norm_risk = 100.0 if risk == "HIGH" else (50.0 if risk == "MEDIUM" else 10.0)
        score = round((0.45 * b.current_fill) + (0.35 * pred_6h) + (0.20 * norm_risk), 2)

        if score >= 75.0 or b.current_fill >= 85.0:
            p_lvl = "CRITICAL"
        elif score >= 55.0 or b.current_fill >= 70.0:
            p_lvl = "HIGH"
        elif score >= 35.0:
            p_lvl = "MEDIUM"
        else:
            p_lvl = "LOW"

        priority_list.append({
            "bin_id": b.id,
            "bin_code": b.bin_code,
            "location_name": b.location_name,
            "waste_type": b.waste_type,
            "current_fill": b.current_fill,
            "predicted_6h": pred_6h,
            "predicted_12h": pred_12h,
            "risk_level": risk,
            "overflow_probability": prob,
            "priority_score": score,
            "priority_level": p_lvl,
            "last_collection": b.last_collection,
            "assigned_collector_id": getattr(b, "assigned_collector_id", None),
            "assigned_collector_name": getattr(b, "assigned_collector_name", None)
        })

    # Sort descending by priority_score
    priority_list.sort(key=lambda x: x["priority_score"], reverse=True)

    # Assign 1-indexed ranks
    for idx, item in enumerate(priority_list, start=1):
        item["rank"] = idx

    return priority_list


@router.get("/analytics")
def get_analytics(db: Session = Depends(get_db)):
    bins = db.query(Bin).all()

    # 1. Waste by Category
    category_counts = {}
    for b in bins:
        w_type = b.waste_type.split("/")[0].strip()
        category_counts[w_type] = category_counts.get(w_type, 0) + 1

    waste_by_category = [{"name": k, "value": v} for k, v in category_counts.items()]

    # 2. Fill by Location
    fill_by_location = [
        {"location": b.location_name, "fill": b.current_fill, "code": b.bin_code, "status": b.status}
        for b in sorted(bins, key=lambda x: x.current_fill, reverse=True)[:10]
    ]

    # 3. Overflow Risk Breakdown
    risk_counts = {"LOW": 0, "MEDIUM": 0, "HIGH": 0}
    for b in bins:
        pred = db.query(Prediction).filter(Prediction.bin_id == b.id).order_by(Prediction.prediction_time.desc()).first()
        r = pred.risk_level if pred else "LOW"
        risk_counts[r] = risk_counts.get(r, 0) + 1

    risk_distribution = [{"name": k, "count": v} for k, v in risk_counts.items()]

    # 4. Daily Waste Trend (Simulated 7-day campus aggregation)
    daily_trends = [
        {"day": "Mon", "avg_fill": 62, "collections": 8, "overflow_alerts": 3},
        {"day": "Tue", "avg_fill": 65, "collections": 9, "overflow_alerts": 4},
        {"day": "Wed", "avg_fill": 59, "collections": 7, "overflow_alerts": 2},
        {"day": "Thu", "avg_fill": 68, "collections": 11, "overflow_alerts": 5},
        {"day": "Fri", "avg_fill": 74, "collections": 14, "overflow_alerts": 7},
        {"day": "Sat", "avg_fill": 81, "collections": 18, "overflow_alerts": 9},
        {"day": "Sun", "avg_fill": 77, "collections": 15, "overflow_alerts": 6}
    ]

    return {
        "waste_by_category": waste_by_category,
        "fill_by_location": fill_by_location,
        "risk_distribution": risk_distribution,
        "daily_trends": daily_trends
    }
