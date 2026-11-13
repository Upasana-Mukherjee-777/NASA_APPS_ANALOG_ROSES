import uuid
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, Field
from app.database.base import get_db
from app.models.route import Route, RouteCandidate
from app.models.mission import Mission
from app.models.hazard import Hazard
from app.route_engine.route_optimizer import RouteOptimizer

router = APIRouter(prefix="/routes", tags=["Route Optimization & Guidance"])


class RoutePlanRequestSchema(BaseModel):
    mission_id: str
    start_lat: float
    start_lon: float
    dest_lat: float
    dest_lon: float
    alpha: float = Field(0.50, description="Risk weight")
    beta: float = Field(0.30, description="Comfort weight")
    gamma: float = Field(0.20, description="Time weight")
    max_slope_deg: float = 18.0
    max_eva_hours: float = 6.0
    max_radiation_usv: float = 160.0


@router.post("/plan")
async def plan_route_candidates(
    payload: RoutePlanRequestSchema,
    db: AsyncSession = Depends(get_db)
):
    try:
        m_uuid = uuid.UUID(payload.mission_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid mission UUID")

    # Fetch active hazards for mission
    haz_result = await db.execute(select(Hazard).where(Hazard.mission_id == m_uuid))
    hazards_db = haz_result.scalars().all()
    hazards = [
        {
            "id": str(h.id),
            "name": h.name,
            "lat": h.lat,
            "lon": h.lon,
            "affected_radius_m": h.affected_radius_m,
            "severity": h.severity
        }
        for h in hazards_db
    ]

    # Run Route Optimizer
    plan_result = RouteOptimizer.plan_routes(
        start_lat=payload.start_lat,
        start_lon=payload.start_lon,
        dest_lat=payload.dest_lat,
        dest_lon=payload.dest_lon,
        hazards=hazards,
        alpha=payload.alpha,
        beta=payload.beta,
        gamma=payload.gamma,
        max_slope_deg=payload.max_slope_deg,
        max_eva_hours=payload.max_eva_hours,
        max_radiation_usv=payload.max_radiation_usv
    )

    # Save to database
    route_entity = Route(
        id=uuid.uuid4(),
        mission_id=m_uuid,
        constraints={
            "alpha": payload.alpha,
            "beta": payload.beta,
            "gamma": payload.gamma,
            "max_slope_deg": payload.max_slope_deg,
            "max_eva_hours": payload.max_eva_hours,
            "max_radiation_usv": payload.max_radiation_usv
        }
    )
    db.add(route_entity)
    await db.flush()

    saved_candidates = []
    selected_candidate_id = None
    for cand in plan_result["candidates"]:
        cand_id = uuid.uuid4()
        rc = RouteCandidate(
            id=cand_id,
            route_id=route_entity.id,
            name=cand["name"],
            description=cand["description"],
            waypoints=cand["waypoints"],
            geometry_geojson=cand["geometry_geojson"],
            total_distance_km=cand["total_distance_km"],
            estimated_duration_hours=cand["estimated_duration_hours"],
            risk_score=cand["risk_score"],
            comfort_score=cand["comfort_score"],
            energy_cost_estimate=cand["energy_cost_kcal"],
            hazard_count=len(cand["hazard_intersections"]),
            is_selected=cand["is_selected"],
            hard_constraints_met=cand["hard_constraints_met"],
            rejection_reason=cand.get("rejection_reason"),
            selection_rationale=cand.get("selection_rationale")
        )
        db.add(rc)
        saved_candidates.append(rc)
        if cand["is_selected"]:
            selected_candidate_id = cand_id

    route_entity.selected_candidate_id = selected_candidate_id

    # Update mission active route
    m_res = await db.execute(select(Mission).where(Mission.id == m_uuid))
    mission = m_res.scalar_one_or_none()
    if mission and selected_candidate_id:
        mission.active_route_candidate_id = selected_candidate_id

    await db.commit()

    return {
        "route_id": str(route_entity.id),
        "selected_candidate_id": str(selected_candidate_id),
        "plan": plan_result
    }


@router.get("/{mission_id}")
async def get_mission_routes(mission_id: str, db: AsyncSession = Depends(get_db)):
    try:
        m_uuid = uuid.UUID(mission_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid mission UUID")

    r_res = await db.execute(select(Route).where(Route.mission_id == m_uuid).order_by(Route.created_at.desc()))
    routes = r_res.scalars().all()
    if not routes:
        return {"routes": [], "candidates": []}

    latest_route = routes[0]
    cand_res = await db.execute(select(RouteCandidate).where(RouteCandidate.route_id == latest_route.id))
    candidates = cand_res.scalars().all()

    return {
        "route": latest_route,
        "candidates": candidates
    }


@router.post("/{candidate_id}/select")
async def select_candidate(candidate_id: str, db: AsyncSession = Depends(get_db)):
    try:
        c_uuid = uuid.UUID(candidate_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid candidate UUID")

    cand_res = await db.execute(select(RouteCandidate).where(RouteCandidate.id == c_uuid))
    candidate = cand_res.scalar_one_or_none()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    # Unselect all other candidates on this route
    all_res = await db.execute(select(RouteCandidate).where(RouteCandidate.route_id == candidate.route_id))
    for c in all_res.scalars().all():
        c.is_selected = (c.id == c_uuid)

    route_res = await db.execute(select(Route).where(Route.id == candidate.route_id))
    route = route_res.scalar_one_or_none()
    if route:
        route.selected_candidate_id = c_uuid
        # Update mission
        m_res = await db.execute(select(Mission).where(Mission.id == route.mission_id))
        mission = m_res.scalar_one_or_none()
        if mission:
            mission.active_route_candidate_id = c_uuid

    await db.commit()
    return {"message": "Active route candidate updated", "candidate_id": str(c_uuid)}

