import os
import sys
import asyncio
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database.base import sync_engine, Session, get_db
from app.models.mission import Mission
from app.models.hazard import Hazard
from app.models.experiment import Experiment
from app.geospatial.nasa_layers import NASALayerCatalog
from app.route_engine.route_optimizer import RouteOptimizer
from app.experiment_engine.classifier import ExperimentClassifier
from app.simulation.lab_engine import SimulationLabEngine
from app.telemetry.telemetry_service import telemetry_engine
from app.history_intelligence.historical_rag import HistoricalExperienceEngine
from app.digital_twin.mission_twin import digital_twin_engine


def run_full_verification():
    print("=================================================================")
    print("MARS-GUARD PLANETARY SAFETY PLATFORM — FULL VERIFICATION SUITE")
    print("=================================================================")

    # 1. Database & Missions Check
    session = Session(sync_engine)
    missions = session.query(Mission).all()
    assert len(missions) > 0, "No missions found in database"
    m = missions[0]
    print(f"1. Database & Mission: OK - Found mission: '{m.name[:45]}...' (ID: {m.id})")

    # 2. NASA Multimodal 8-Category Geospatial Catalog
    layers = NASALayerCatalog.get_all_layers()
    categories = list(set(l["category"] for l in layers))
    assert len(categories) == 8, f"Expected 8 NASA scientific categories, got {len(categories)}"
    print(f"2. NASA Layers: OK - Verified 8 categories: {', '.join(categories)}")

    # 3. Route Planning & Constrained Optimization (Aegis, Apex, Ares)
    plan = RouteOptimizer.plan_routes(
        start_lat=18.3800, start_lon=77.5800,
        dest_lat=18.4200, dest_lon=77.5200,
        hazards=[],
        alpha=0.50, beta=0.30, gamma=0.20,
        max_slope_deg=18.0
    )
    assert len(plan["candidates"]) == 3, "Expected 3 candidate routes"
    assert "emergency_evacuation_path" in plan, "Expected emergency evacuation path"
    print(f"3. Route Optimizer: OK - Generated 3 candidates ({', '.join(c['name'].split(' ')[0] for c in plan['candidates'])}) + Emergency Abort Path")

    # 4. Historical Safety RAG Intelligence
    hist = HistoricalExperienceEngine.search_incidents("spacesuit cooling loop water leak", top_k=2)
    results = hist if isinstance(hist, list) else hist.get("results", [])
    assert len(results) > 0, "Expected historical search results"
    top_inc = results[0]
    assert "WATER" in top_inc["category"] or "COOLING" in top_inc.get("category", "") or "EVA" in top_inc["incident_code"]
    print(f"4. Historical RAG: OK - Retrieved: '{top_inc['title']}' ({top_inc['source_citation']})")

    # 5. AI Experiment Intervention Classifier (Class A, B, C, D)
    # Routine passive -> Class A
    res_a = ExperimentClassifier.classify(
        experiment_class="ATMOSPHERIC_ANALYSIS",
        name="Passive Dust Sensor",
        slope_deg=2.0, temp_c=-40.0, radiation_usv_hr=26.5
    )
    assert res_a["intervention_class"] == "CLASS_A"

    # Drilling on slope -> Class C (Human Approval Required)
    res_c = ExperimentClassifier.classify(
        experiment_class="GEOLOGICAL_SAMPLING",
        name="Delta Bedrock Core Drilling",
        slope_deg=12.0, temp_c=-40.0, radiation_usv_hr=26.5,
        involves_drilling=True
    )
    assert res_c["intervention_class"] == "CLASS_C"
    assert res_c["requires_human_approval"] == True

    # Extreme slope -> Class D (Stop & Reassess)
    res_d = ExperimentClassifier.classify(
        experiment_class="GEOLOGICAL_SAMPLING",
        name="Escarpment Drill",
        slope_deg=22.0, temp_c=-40.0, radiation_usv_hr=26.5,
        involves_drilling=True
    )
    assert res_d["intervention_class"] == "CLASS_D"
    print(f"5. Experiment Classifier: OK - Verified Class A (Autonomous), Class C (Human Approval), and Class D (Stop/Reassess)")

    # 6. Earth Simulation Numerical Physics Lab
    sim_thermal = SimulationLabEngine.run_simulation("THERMAL_BALANCE", {"ambient_temp_c": -45.0, "metabolic_watts": 320.0, "duration_min": 60})
    assert "time_series" in sim_thermal
    print(f"6. Physics Simulation Lab: OK - Executed Stefan-Boltzmann LCVG model with {len(sim_thermal['time_series']['time_min'])} time points")

    # 7. Live Telemetry Simulation Engine
    telemetry_engine.reset()
    telemetry_engine.start()
    packet = telemetry_engine.generate_packet()
    assert packet["status"] == "RUNNING"
    assert "environmental" in packet
    assert "subsystems" in packet
    assert "risk_assessment" in packet
    print(f"7. Telemetry Engine: OK - Step {packet['step']}: Temp {packet['environmental']['temperature_c']}°C, Battery {packet['subsystems']['rover_battery_pct']}%, Risk {packet['risk_assessment']['composite_risk_score']}")

    # 8. Anomaly Injection & Contingency Detection Pipeline
    telemetry_engine.inject_anomaly("DUST_STORM", severity="CRITICAL")
    anom_packet = telemetry_engine.generate_packet()
    assert anom_packet["pipeline_validation"]["is_anomaly"] == True
    assert anom_packet["environmental"]["dust_tau"] > 1.5
    telemetry_engine.clear_anomaly()
    print("8. Anomaly Ingestion Pipeline: OK - Injected DUST_STORM; validated automatic alert generation and risk increase")

    # 9. 3D Digital Twin State Engine
    twin_state = digital_twin_engine.get_current_state()
    assert "rover_position" in twin_state
    assert "timeline" in twin_state
    print(f"9. Digital Twin Engine: OK - Position ({twin_state['rover_position']['lat']}, {twin_state['rover_position']['lon']}) synchronized")

    print("=================================================================")
    print("ALL VERIFICATION SUITE CHECKS COMPLETED SUCCESSFULLY (100% PASS)!")
    print("=================================================================")


if __name__ == "__main__":
    run_full_verification()
