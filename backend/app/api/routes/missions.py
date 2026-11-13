import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database.base import get_db
from app.models.mission import Mission, MissionStatus, RiskLevel
from app.models.hazard import Hazard
from app.models.experiment import Experiment
from app.models.route import Route, RouteCandidate
from pydantic import BaseModel

router = APIRouter(prefix="/missions", tags=["Missions"])


class MissionCreateSchema(BaseModel):
    name: str
    description: Optional[str] = None
    start_lat: float
    start_lon: float
    dest_lat: float
    dest_lon: float
    planned_duration_hours: float = 4.0
    tags: List[str] = []


class MissionStatusUpdateSchema(BaseModel):
    status: str
    notes: Optional[str] = None


@router.get("")
async def get_missions(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Mission).order_by(Mission.created_at.desc()))
    missions = result.scalars().all()
    return missions


@router.get("/{mission_id}")
async def get_mission_detail(mission_id: str, db: AsyncSession = Depends(get_db)):
    try:
        m_uuid = uuid.UUID(mission_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid mission UUID")

    result = await db.execute(select(Mission).where(Mission.id == m_uuid))
    mission = result.scalar_one_or_none()
    if not mission:
        raise HTTPException(status_code=404, detail="Mission not found")

    # Fetch associated hazards
    hazards_res = await db.execute(select(Hazard).where(Hazard.mission_id == m_uuid))
    hazards = hazards_res.scalars().all()

    # Fetch associated experiments
    exps_res = await db.execute(select(Experiment).where(Experiment.mission_id == m_uuid))
    experiments = exps_res.scalars().all()

    # Fetch active route candidates
    route_res = await db.execute(select(Route).where(Route.mission_id == m_uuid))
    route = route_res.scalar_one_or_none()
    candidates = []
    if route:
        cand_res = await db.execute(select(RouteCandidate).where(RouteCandidate.route_id == route.id))
        candidates = cand_res.scalars().all()

    return {
        "mission": mission,
        "hazards": hazards,
        "experiments": experiments,
        "route": route,
        "route_candidates": candidates
    }


@router.patch("/{mission_id}/status")
async def update_mission_status(
    mission_id: str,
    payload: MissionStatusUpdateSchema,
    db: AsyncSession = Depends(get_db)
):
    try:
        m_uuid = uuid.UUID(mission_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid mission UUID")

    result = await db.execute(select(Mission).where(Mission.id == m_uuid))
    mission = result.scalar_one_or_none()
    if not mission:
        raise HTTPException(status_code=404, detail="Mission not found")

    mission.status = payload.status
    if payload.notes:
        mission.notes = (mission.notes or "") + f"\n[{payload.status}]: {payload.notes}"
    await db.commit()
    await db.refresh(mission)
    return {"message": "Mission status updated successfully", "mission": mission}
