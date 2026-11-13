from typing import Dict, Any, List
from fastapi import APIRouter
from pydantic import BaseModel
from app.simulation.lab_engine import SimulationLabEngine

router = APIRouter(prefix="/simulation", tags=["Earth-Based Experiment Simulation Lab"])


class SimulationRunSchema(BaseModel):
    scenario_type: str  # THERMAL_CYCLE, RADIATION_BUDGET, DUST_DEGRADATION, ROVER_MOBILITY, WORKLOAD_FATIGUE
    parameters: Dict[str, Any]


class ScenarioComparisonSchema(BaseModel):
    scenario_type: str
    scenario_a: Dict[str, Any]
    scenario_b: Dict[str, Any]


@router.post("/run")
async def run_simulation_scenario(payload: SimulationRunSchema):
    """Executes physics calculations for pre-mission Earth testing of Martian scenarios."""
    result = SimulationLabEngine.run_simulation(payload.scenario_type, payload.parameters)
    return result


@router.post("/compare")
async def compare_scenarios(payload: ScenarioComparisonSchema):
    """Compares two configurable Martian operational scenarios side-by-side."""
    res_a = SimulationLabEngine.run_simulation(payload.scenario_type, payload.scenario_a)
    res_b = SimulationLabEngine.run_simulation(payload.scenario_type, payload.scenario_b)

    return {
        "scenario_type": payload.scenario_type,
        "scenario_a_results": res_a,
        "scenario_b_results": res_b,
        "comparison_summary": {
            "scenario_a_passed": res_a["summary"]["passed_safety_thresholds"],
            "scenario_b_passed": res_b["summary"]["passed_safety_thresholds"],
            "scenario_a_warnings": res_a["summary"]["warnings"],
            "scenario_b_warnings": res_b["summary"]["warnings"]
        }
    }
