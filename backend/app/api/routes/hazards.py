import uuid
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from pydantic import BaseModel, Field
from app.database.base import get_db
from app.models.hazard import Hazard, HazardSeverity, HazardSource
from app.models.mission_event import MissionEvent
from app.geospatial.mars_gis import MarsGIS
from app.digital_twin.mission_twin import digital_twin_engine

router = APIRouter(prefix="/hazards", tags=["Hazards Management"])


class HazardCreateSchema(BaseModel):
    mission_id: str
    name: str
    description: Optional[str] = "Manual hazard placed by mission controller."
    severity: str = "HIGH"  # LOW, MEDIUM, HIGH, CRITICAL
    category: str = "TERRAIN"  # TERRAIN, DUST_TRAP, ROCK_FALL, RADIATION, COLD_TRAP, EQUIPMENT
    lat: float
    lon: float
    elevation_m: Optional[float] = None
    affected_radius_m: float = 75.0
    confidence: float = 0.95
    source: str = "OBSERVED"
    mitigation_steps: List[str] = ["Re-route around affected waypoint", "Enforce minimum standoff distance"]


@router.get("")
async def get_hazards(mission_id: Optional[str] = None, db: AsyncSession = Depends(get_db)):
    """Returns active hazards in the mission area."""
    query = select(Hazard).where(Hazard.is_active == True).order_by(Hazard.created_at.desc())
    if mission_id:
        try:
            m_uuid = uuid.UUID(mission_id)
            query = query.where(Hazard.mission_id == m_uuid)
        except ValueError:
            pass
    result = await db.execute(query)
    return result.scalars().all()


@router.post("")
async def create_hazard(payload: HazardCreateSchema, db: AsyncSession = Depends(get_db)):
    """Adds a new hazard marker to the map, logs a mission event, and syncs digital twin."""
    try:
        m_uuid = uuid.UUID(payload.mission_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid mission UUID")

    elev = payload.elevation_m if payload.elevation_m is not None else MarsGIS.get_elevation_m(payload.lat, payload.lon)

    hazard_id = uuid.uuid4()
    hazard = Hazard(
        id=hazard_id,
        mission_id=m_uuid,
        name=payload.name,
        description=payload.description,
        severity=payload.severity.upper(),
        category=payload.category.upper(),
        lat=payload.lat,
        lon=payload.lon,
        elevation_m=elev,
        affected_radius_m=payload.affected_radius_m,
        confidence=payload.confidence,
        source=payload.source.upper(),
        is_active=True,
        mitigation_steps=payload.mitigation_steps,
        detected_at=datetime.now(timezone.utc),
        created_at=datetime.now(timezone.utc)
    )
    db.add(hazard)

    # Log mission event
    event = MissionEvent(
        id=uuid.uuid4(),
        mission_id=m_uuid,
        event_type="HAZARD_IDENTIFIED",
        severity=payload.severity.upper(),
        title=f"Hazard Placed: {payload.name}",
        description=f"{payload.category} hazard marked at ({payload.lat:.4f}°N, {payload.lon:.4f}°E) with radius {payload.affected_radius_m:.0f}m.",
        lat=payload.lat,
        lon=payload.lon,
        timestamp=datetime.now(timezone.utc),
        details={"hazard_id": str(hazard_id), "category": payload.category}
    )
    db.add(event)

    # Update digital twin
    digital_twin_engine.process_new_observation({
        "category": payload.category,
        "value_numeric": 1.0,
        "unit": "HAZARD_INDEX",
        "lat": payload.lat,
        "lon": payload.lon,
        "data_source": payload.source,
        "confidence": payload.confidence,
        "tags": ["HAZARD", payload.category]
    })

    await db.commit()
    await db.refresh(hazard)

    return {
        "status": "SUCCESS",
        "message": f"Hazard '{payload.name}' registered. Routes and risk maps updated.",
        "hazard": hazard
    }


@router.delete("/{hazard_id}")
async def delete_hazard(hazard_id: str, db: AsyncSession = Depends(get_db)):
    """Deactivates a hazard marker."""
    try:
        h_uuid = uuid.UUID(hazard_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid hazard UUID")

    res = await db.execute(select(Hazard).where(Hazard.id == h_uuid))
    h = res.scalar_one_or_none()
    if not h:
        raise HTTPException(status_code=404, detail="Hazard not found")

    h.is_active = False
    await db.commit()
    return {"status": "SUCCESS", "message": f"Hazard '{h.name}' marked inactive."}
