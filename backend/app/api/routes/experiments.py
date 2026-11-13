import uuid
from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from app.database.base import get_db
from app.models.experiment import Experiment, ExperimentClass, ExperimentStatus, ExperimentPriority, InterventionClass
from app.experiment_engine.classifier import ExperimentClassifier
from app.geospatial.mars_gis import MarsGIS

router = APIRouter(prefix="/experiments", tags=["AI Experiment Intelligence"])


class ExperimentCreateSchema(BaseModel):
    mission_id: str
    name: str
    description: Optional[str] = None
    experiment_class: str
    lat: float
    lon: float
    planned_duration_minutes: int = 30
    priority: str = "MEDIUM"
    equipment_required: List[str] = []
    slope_deg: float = 4.0
    radiation_usv_hr: float = 26.5
    temp_c: float = -40.0
    involves_toxic_chemistry: bool = False
    involves_drilling: bool = False


class ExperimentClassifyRequestSchema(BaseModel):
    experiment_class: str
    name: str
    slope_deg: float = 4.0
    temp_c: float = -40.0
    radiation_usv_hr: float = 26.5
    involves_toxic_chemistry: bool = False
    involves_drilling: bool = False
    equipment_condition_score: float = 95.0
    astronaut_workload_score: float = 25.0


class ExperimentApprovalSchema(BaseModel):
    approver_name: str
    approval_notes: Optional[str] = None


@router.get("")
async def get_experiments(mission_id: Optional[str] = None, db: AsyncSession = Depends(get_db)):
    query = select(Experiment).order_by(Experiment.created_at.desc())
    if mission_id:
        try:
            m_uuid = uuid.UUID(mission_id)
            query = query.where(Experiment.mission_id == m_uuid)
        except ValueError:
            pass

    result = await db.execute(query)
    experiments = result.scalars().all()
    return experiments


@router.post("/classify")
async def classify_experiment_intervention(payload: ExperimentClassifyRequestSchema):
    """AI Experiment Intervention Classifier (Model D & Safety Rule Engine)."""
    classification = ExperimentClassifier.classify(
        experiment_class=payload.experiment_class,
        name=payload.name,
        slope_deg=payload.slope_deg,
        temp_c=payload.temp_c,
        radiation_usv_hr=payload.radiation_usv_hr,
        involves_toxic_chemistry=payload.involves_toxic_chemistry,
        involves_drilling=payload.involves_drilling,
        equipment_condition_score=payload.equipment_condition_score,
        astronaut_workload_score=payload.astronaut_workload_score
    )
    return classification


@router.post("")
async def create_experiment(
    payload: ExperimentCreateSchema,
    db: AsyncSession = Depends(get_db)
):
    try:
        m_uuid = uuid.UUID(payload.mission_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid mission UUID")

    # Run AI intervention classifier
    classification = ExperimentClassifier.classify(
        experiment_class=payload.experiment_class,
        name=payload.name,
        slope_deg=payload.slope_deg,
        temp_c=payload.temp_c,
        radiation_usv_hr=payload.radiation_usv_hr,
        involves_toxic_chemistry=payload.involves_toxic_chemistry,
        involves_drilling=payload.involves_drilling
    )

    elev = MarsGIS.get_elevation_m(payload.lat, payload.lon)

    exp = Experiment(
        id=uuid.uuid4(),
        mission_id=m_uuid,
        name=payload.name,
        description=payload.description,
        experiment_class=payload.experiment_class.upper(),
        lat=payload.lat,
        lon=payload.lon,
        elevation_m=elev,
        planned_start_time=datetime.utcnow(),
        planned_duration_minutes=payload.planned_duration_minutes,
        status=ExperimentStatus.PLANNED,
        priority=payload.priority.upper(),
        intervention_class=classification["intervention_class"],
        risk_score=classification["risk_score"],
        classification_explanation=classification["explanation"],
        contributing_factors=classification["contributing_factors"],
        recommended_precautions=classification["recommended_precautions"],
        requires_human_approval=classification["requires_human_approval"],
        is_approved=(not classification["requires_human_approval"]), # Auto-approved if Class A/B
        equipment_required=payload.equipment_required
    )
    db.add(exp)
    await db.commit()
    await db.refresh(exp)

    return {"experiment": exp, "classification": classification}


@router.post("/{experiment_id}/approve")
async def approve_experiment(
    experiment_id: str,
    payload: ExperimentApprovalSchema,
    db: AsyncSession = Depends(get_db)
):
    try:
        e_uuid = uuid.UUID(experiment_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid experiment UUID")

    res = await db.execute(select(Experiment).where(Experiment.id == e_uuid))
    exp = res.scalar_one_or_none()
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found")

    if exp.intervention_class == "CLASS_D":
        raise HTTPException(
            status_code=403,
            detail="CLASS_D experiments violate critical safety parameters. Action prohibited until environmental reassessment."
        )

    exp.is_approved = True
    exp.approved_by = payload.approver_name
    exp.approved_at = datetime.utcnow()
    exp.approval_notes = payload.approval_notes
    await db.commit()
    await db.refresh(exp)

    return {"message": "Human approval confirmed and recorded", "experiment": exp}


@router.patch("/{experiment_id}/status")
async def update_experiment_status(
    experiment_id: str,
    status: str,
    db: AsyncSession = Depends(get_db)
):
    try:
        e_uuid = uuid.UUID(experiment_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid experiment UUID")

    res = await db.execute(select(Experiment).where(Experiment.id == e_uuid))
    exp = res.scalar_one_or_none()
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found")

    if status.upper() == "IN_PROGRESS" and exp.requires_human_approval and not exp.is_approved:
        raise HTTPException(
            status_code=403,
            detail="Cannot initiate experiment: Mandatory human approval has not been granted."
        )

    exp.status = status.upper()
    if status.upper() == "IN_PROGRESS" and not exp.actual_start_time:
        exp.actual_start_time = datetime.utcnow()
    elif status.upper() in ("COMPLETED", "FAILED") and not exp.actual_end_time:
        exp.actual_end_time = datetime.utcnow()

    await db.commit()
    await db.refresh(exp)
    return {"message": "Experiment status updated", "experiment": exp}

