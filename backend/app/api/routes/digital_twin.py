from fastapi import APIRouter
from pydantic import BaseModel
from app.digital_twin.mission_twin import digital_twin_engine

router = APIRouter(prefix="/digital-twin", tags=["Astronaut-Updated Digital Twin"])


class ReplayStepSchema(BaseModel):
    step_number: int


@router.get("/state")
async def get_digital_twin_state():
    """Returns the unified 3D digital twin state combining Martian terrain, rover location,
    astronaut positions, active hazards, telemetry readings, and landmarks.
    """
    return digital_twin_engine.get_current_state()


@router.get("/terrain-grid")
async def get_terrain_elevation_grid(center_lat: float = 18.38, center_lon: float = 77.58, grid_size: int = 25):
    """Returns the 3D elevation grid matrix for Three.js / Cesium surface mesh generation."""
    return digital_twin_engine.generate_3d_terrain_grid(center_lat, center_lon, grid_size)


@router.get("/timeline")
async def get_mission_timeline():
    """Returns the complete event timeline for historical replay and demonstration."""
    state = digital_twin_engine.get_current_state()
    return state["timeline"]


@router.post("/replay-step")
async def replay_timeline_step(payload: ReplayStepSchema):
    """Simulates replaying the mission state at a historical timeline step."""
    timeline = digital_twin_engine.get_current_state()["timeline"]
    selected_step = next((e for e in timeline if e["step"] == payload.step_number), None)
    if not selected_step:
        return {"error": "Step not found in mission timeline"}

    return {
        "status": "REPLAY_ACTIVE",
        "step": selected_step,
        "total_steps": len(timeline)
    }
