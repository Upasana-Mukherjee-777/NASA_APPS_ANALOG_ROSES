from typing import Optional, Dict, Any
from fastapi import APIRouter
from pydantic import BaseModel
from app.telemetry.telemetry_service import telemetry_engine

router = APIRouter(prefix="/telemetry", tags=["Live Telemetry & Event Simulator"])


class TelemetryControlSchema(BaseModel):
    action: str  # START, PAUSE, RESUME, RESET, TICK
    frequency_hz: Optional[float] = None
    seed: Optional[int] = None


class AnomalyInjectionSchema(BaseModel):
    anomaly_type: str  # DUST_STORM, RADIATION_INCREASE, OXYGEN_LEAK, EQUIPMENT_MALFUNCTION, TERRAIN_OBSTRUCTION, FATIGUE_INCREASE
    severity: str = "HIGH"
    details: Optional[str] = None


@router.get("/state")
async def get_telemetry_state():
    """Returns the current telemetry simulation engine state, latest packet, and recent history."""
    return telemetry_engine.get_state()


@router.get("/tick")
async def tick_telemetry():
    """Generates and returns the next telemetry packet through the ingestion pipeline."""
    return telemetry_engine.generate_packet()


@router.post("/control")
async def control_telemetry(payload: TelemetryControlSchema):
    """Controls the live telemetry simulation session (Start, Pause, Resume, Reset, Frequency, Seed)."""
    action = payload.action.upper()
    if payload.seed is not None:
        telemetry_engine.set_seed(payload.seed)
    if payload.frequency_hz is not None:
        telemetry_engine.set_frequency(payload.frequency_hz)

    if action == "START":
        telemetry_engine.start()
    elif action == "PAUSE":
        telemetry_engine.pause()
    elif action == "RESUME":
        telemetry_engine.resume()
    elif action == "RESET":
        telemetry_engine.reset()
    elif action == "TICK":
        telemetry_engine.generate_packet()

    return telemetry_engine.get_state()


@router.post("/inject-anomaly")
async def inject_anomaly(payload: AnomalyInjectionSchema):
    """Injects a dynamic contingency event into the live telemetry pipeline."""
    result = telemetry_engine.inject_anomaly(
        anomaly_type=payload.anomaly_type,
        severity=payload.severity,
        details=payload.details
    )
    return {
        "status": "ANOMALY_ACTIVE",
        "anomaly": result,
        "current_telemetry": telemetry_engine.generate_packet()
    }


@router.post("/clear-anomaly")
async def clear_anomaly():
    """Clears any currently active anomaly in the simulation."""
    telemetry_engine.clear_anomaly()
    return {"status": "ANOMALY_CLEARED", "current_state": telemetry_engine.get_state()}
