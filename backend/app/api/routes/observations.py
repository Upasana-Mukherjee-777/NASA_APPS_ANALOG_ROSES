import uuid
from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, Field
from app.database.base import get_db
from app.models.observation import Observation, ObservationCategory, ObservationType, DataSource
from app.models.hazard import Hazard, HazardSeverity, HazardSource
from app.models.mission_event import MissionEvent
from app.risk_engine.risk_assessor import RiskAssessor
from app.digital_twin.mission_twin import digital_twin_engine
from app.geospatial.mars_gis import MarsGIS

router = APIRouter(prefix="/observations", tags=["Observations & Telemetry"])


class ObservationInputSchema(BaseModel):
    mission_id: str
    category: str  # TEMPERATURE, RADIATION, PRESSURE, DUST, TERRAIN, etc.
    value_numeric: float
    unit: str
    lat: float
    lon: float
    elevation_m: Optional[float] = None
    data_source: str = "OBSERVED"  # OBSERVED, DERIVED, SIMULATED
    confidence: float = 0.95
    notes: Optional[str] = None
    tags: List[str] = []


class BatchObservationsSchema(BaseModel):
    mission_id: str
    observations: List[ObservationInputSchema]


@router.get("")
async def get_observations(
    mission_id: Optional[str] = None,
    category: Optional[str] = None,
    limit: int = 50,
    db: AsyncSession = Depends(get_db)
):
    query = select(Observation).order_by(Observation.timestamp.desc()).limit(limit)
    if mission_id:
        try:
            m_uuid = uuid.UUID(mission_id)
            query = query.where(Observation.mission_id == m_uuid)
        except ValueError:
            pass
    if category:
        query = query.where(Observation.category == category.upper())

    result = await db.execute(query)
    observations = result.scalars().all()
    return observations


@router.post("")
async def submit_observation(
    payload: ObservationInputSchema,
    db: AsyncSession = Depends(get_db)
):
    """Adaptive Intelligence Ingestion Pipeline."""
    try:
        m_uuid = uuid.UUID(payload.mission_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid mission UUID")

    # 1. Geographic validation
    elev = payload.elevation_m or MarsGIS.get_elevation_m(payload.lat, payload.lon)

    # 2. Anomaly Detection
    anomaly_result = RiskAssessor.detect_telemetry_anomaly(
        category=payload.category,
        value=payload.value_numeric,
        unit=payload.unit
    )

    # 3. Save observation to DB
    obs = Observation(
        id=uuid.uuid4(),
        mission_id=m_uuid,
        category=payload.category.upper(),
        observation_type=ObservationType.POINT,
        data_source=payload.data_source.upper(),
        value_numeric=payload.value_numeric,
        unit=payload.unit,
        confidence=payload.confidence,
        lat=payload.lat,
        lon=payload.lon,
        elevation_m=elev,
        timestamp=datetime.utcnow(),
        is_anomaly=anomaly_result["is_anomaly"],
        anomaly_score=anomaly_result["anomaly_score"],
        notes=payload.notes,
        tags=payload.tags
    )
    db.add(obs)

    # 4. Update Digital Twin
    twin_update = digital_twin_engine.process_new_observation({
        "category": payload.category,
        "value_numeric": payload.value_numeric,
        "unit": payload.unit,
        "lat": payload.lat,
        "lon": payload.lon,
        "data_source": payload.data_source,
        "confidence": payload.confidence,
        "tags": payload.tags
    })

    # 5. If high/critical anomaly, record Hazard in DB
    new_hazard_entity = None
    if anomaly_result["severity"] in ("HIGH", "CRITICAL") or "HAZARD" in [t.upper() for t in payload.tags]:
        new_hazard_entity = Hazard(
            id=uuid.uuid4(),
            mission_id=m_uuid,
            name=f"Observed Hazard: High {payload.category}",
            description=anomaly_result["explanation"],
            severity=anomaly_result["severity"],
            category=payload.category.upper(),
            lat=payload.lat,
            lon=payload.lon,
            elevation_m=elev,
            affected_radius_m=75.0,
            confidence=payload.confidence,
            source=payload.data_source.upper(),
            mitigation_steps=["Halt advance; verify sensor readout", "Reroute team around affected coordinate"]
        )
        db.add(new_hazard_entity)

    # 6. Log Mission Event
    event = MissionEvent(
        id=uuid.uuid4(),
        mission_id=m_uuid,
        event_type="OBSERVATION_SUBMITTED",
        severity=anomaly_result["severity"],
        title=f"New Observation: {payload.category} ({payload.value_numeric} {payload.unit})",
        description=anomaly_result["explanation"],
        lat=payload.lat,
        lon=payload.lon,
        timestamp=datetime.utcnow(),
        details={
            "observation_id": str(obs.id),
            "is_anomaly": anomaly_result["is_anomaly"],
            "severity": anomaly_result["severity"]
        }
    )
    db.add(event)

    await db.commit()
    await db.refresh(obs)

    return {
        "status": "SUCCESS",
        "observation": obs,
        "anomaly_analysis": anomaly_result,
        "hazard_created": new_hazard_entity is not None,
        "digital_twin": twin_update
    }


@router.post("/batch")
async def batch_upload_observations(
    payload: BatchObservationsSchema,
    db: AsyncSession = Depends(get_db)
):
    try:
        m_uuid = uuid.UUID(payload.mission_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid mission UUID")

    created = []
    anomalies_detected = 0

    for item in payload.observations:
        elev = item.elevation_m or MarsGIS.get_elevation_m(item.lat, item.lon)
        anomaly = RiskAssessor.detect_telemetry_anomaly(item.category, item.value_numeric, item.unit)
        if anomaly["is_anomaly"]:
            anomalies_detected += 1

        obs = Observation(
            id=uuid.uuid4(),
            mission_id=m_uuid,
            category=item.category.upper(),
            observation_type=ObservationType.POINT,
            data_source=item.data_source.upper(),
            value_numeric=item.value_numeric,
            unit=item.unit,
            confidence=item.confidence,
            lat=item.lat,
            lon=item.lon,
            elevation_m=elev,
            timestamp=datetime.utcnow(),
            is_anomaly=anomaly["is_anomaly"],
            anomaly_score=anomaly["anomaly_score"],
            notes=item.notes
        )
        db.add(obs)
        created.append(obs)

    await db.commit()
    return {
        "status": "SUCCESS",
        "records_imported": len(created),
        "anomalies_detected": anomalies_detected
    }


@router.get("/stream")
async def get_simulated_stream():
    """Provides simulated Mars real-time telemetry stream for demonstration."""
    import random
    cur_state = digital_twin_engine.get_current_state()
    base_env = cur_state["environmental_telemetry"]

    stream_packet = {
        "timestamp": datetime.utcnow().isoformat(),
        "temperature_c": round(base_env["temperature_c"] + random.uniform(-0.8, 0.8), 2),
        "radiation_usv_hr": round(base_env["radiation_usv_hr"] + random.uniform(-0.4, 0.4), 2),
        "pressure_pa": round(base_env["pressure_pa"] + random.uniform(-1.5, 1.5), 1),
        "dust_tau": round(base_env["dust_tau"] + random.uniform(-0.02, 0.02), 3),
        "wind_speed_ms": round(base_env["wind_speed_ms"] + random.uniform(-0.5, 0.5), 1),
        "rover_battery_pct": 88.5,
        "suit_o2_flow_l_min": 0.42,
        "suit_cooling_lcvg_temp_c": 19.8,
        "provenance": "SIMULATED",
        "station": "Base Camp Perseverance Met Station (Jezero)"
    }
    return stream_packet
