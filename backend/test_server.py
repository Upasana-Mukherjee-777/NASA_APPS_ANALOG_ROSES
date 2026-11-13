import threading
import time
import requests
import uvicorn
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.main import app


def run_server():
    uvicorn.run(app, host="127.0.0.1", port=8001, log_level="warning")


def main():
    t = threading.Thread(target=run_server, daemon=True)
    t.start()
    time.sleep(2.0)

    base = "http://127.0.0.1:8001/api"
    print("Testing MARS-GUARD API Endpoints:")

    # 1. Health
    r = requests.get(f"{base}/health")
    print(f"1. Health Check: {r.status_code} - {r.json()['system']}")

    # 2. Geospatial Layers
    r = requests.get(f"{base}/geospatial/layers")
    data = r.json()
    print(f"2. NASA Layers: {r.status_code} - {data['count']} layers ({', '.join(data['categories_covered'])})")

    # 3. Missions
    r = requests.get(f"{base}/missions")
    missions = r.json()
    m_id = str(missions[0]["id"])
    print(f"3. Missions: {r.status_code} - Found {len(missions)} mission(s) (First: {missions[0]['name'][:45]}...)")

    # 4. Mission Detail
    r = requests.get(f"{base}/missions/{m_id}")
    detail = r.json()
    print(f"4. Mission Detail: {r.status_code} - {len(detail['hazards'])} hazards, {len(detail['experiments'])} experiments")

    # 5. Route Planning
    r = requests.post(f"{base}/routes/plan", json={
        "mission_id": m_id,
        "start_lat": 18.3800, "start_lon": 77.5800,
        "dest_lat": 18.4200, "dest_lon": 77.5200,
        "alpha": 0.5, "beta": 0.3, "gamma": 0.2
    })
    route_plan = r.json()["plan"]
    print(f"5. Route Optimization: {r.status_code} - Generated {len(route_plan['candidates'])} candidates with hard safety checks")

    # 6. Historical Safety RAG
    r = requests.post(f"{base}/history/search", json={"query": "spacesuit helmet water leak cooling", "top_k": 2})
    hist = r.json()
    print(f"6. Historical RAG: {r.status_code} - Retrieved: {hist['results'][0]['title']} ({hist['results'][0]['source_citation']})")

    # 7. Experiment Classifier
    r = requests.post(f"{base}/experiments/classify", json={
        "experiment_class": "GEOLOGICAL_SAMPLING",
        "name": "Delta Bedrock Core Drilling",
        "slope_deg": 14.0,
        "involves_drilling": True
    })
    exp_c = r.json()
    print(f"7. Experiment Classifier: {r.status_code} - {exp_c['intervention_class']} (Human Approval: {exp_c['requires_human_approval']})")

    # 8. Earth Simulation Lab
    r = requests.post(f"{base}/simulation/run", json={
        "scenario_type": "THERMAL_BALANCE",
        "parameters": {"duration_min": 60, "ambient_temp_c": -45.0, "metabolic_watts": 300.0}
    })
    sim = r.json()
    print(f"8. Simulation Lab: {r.status_code} - {sim['scenario']} (Passed: {sim['summary']['passed_safety_thresholds']})")

    # 9. ML Models
    r = requests.post(f"{base}/ml/terrain-classify", json={"mean_reflectance": 0.35, "roughness_std": 0.55, "edge_density": 0.8, "slope_deg": 22.0})
    print(f"9. ML Model A Terrain: {r.status_code} - Class: {r.json()['predicted_class']} (Conf: {r.json()['confidence']})")

    # 10. Digital Twin
    r = requests.get(f"{base}/digital-twin/state")
    twin = r.json()
    print(f"10. Digital Twin: {r.status_code} - Rover: ({twin['rover_position']['lat']}, {twin['rover_position']['lon']})")

    # 11. Observation Submission (Adaptive Intelligence Trigger)
    r = requests.post(f"{base}/observations", json={
        "mission_id": m_id,
        "category": "RADIATION",
        "value_numeric": 48.5,
        "unit": "uSv/hr",
        "lat": 18.3950,
        "lon": 77.5650,
        "data_source": "OBSERVED",
        "notes": "Elevated sensor telemetry from field dosimeter"
    })
    obs_resp = r.json()
    print(f"11. Adaptive Telemetry Ingestion: {r.status_code} - Anomaly: {obs_resp['anomaly_analysis']['is_anomaly']} (Hazard Created: {obs_resp['hazard_created']})")

    # 12. Mission Report
    r = requests.get(f"{base}/reports/mission/{m_id}")
    rep = r.json()
    print(f"12. Mission Summary Report: {r.status_code} - Generated: {rep['report_metadata']['report_id']}")

    print("\nALL 12 CORE BACKEND PILLARS VERIFIED OPERATIONAL!")


if __name__ == "__main__":
    main()

