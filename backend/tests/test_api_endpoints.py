import sys
import os
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from app.main import app


class TestMarsGuardEndpoints(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_01_health(self):
        res = self.client.get("/api/health")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "HEALTHY")
        self.assertEqual(len(data["modules_active"]), 8)
        print("✓ Health check endpoint operational (all 8 modules active)")

    def test_02_nasa_layers(self):
        res = self.client.get("/api/geospatial/layers")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["count"], 8)
        categories = ["OPTICAL", "THERMAL", "SPECTRAL", "TOPOGRAPHIC", "GEOPHYSICAL", "ATMOSPHERIC", "RADIATION", "CHEMICAL"]
        for cat in categories:
            self.assertIn(cat, data["categories_covered"])
        print("✓ Module 4: 8-Category NASA Multimodal Planetary Data Layers verified")

    def test_03_missions(self):
        res = self.client.get("/api/missions")
        self.assertEqual(res.status_code, 200)
        missions = res.json()
        self.assertGreater(len(missions), 0)
        jezero_mission = missions[0]
        self.assertIn("Jezero", jezero_mission["name"])
        print(f"✓ Mission Overview operational: {jezero_mission['name']}")

    def test_04_historical_safety_rag(self):
        res = self.client.post("/api/history/search", json={"query": "spacesuit helmet water leak cooling loop", "top_k": 2})
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertGreater(len(data["results"]), 0)
        first_match = data["results"][0]
        self.assertIn("WATER", first_match["category"])
        self.assertIn("source_citation", first_match)
        print(f"✓ Module 7: Historical Safety RAG verified. Retrieved: {first_match['title']} ({first_match['source_citation']})")

    def test_05_experiment_classification(self):
        # Test routine passive experiment -> Class A
        res_a = self.client.post("/api/experiments/classify", json={
            "experiment_class": "ATMOSPHERIC_ANALYSIS",
            "name": "Passive Methane Sensor",
            "slope_deg": 2.0,
            "temp_c": -40.0,
            "radiation_usv_hr": 26.5
        })
        self.assertEqual(res_a.status_code, 200)
        data_a = res_a.json()
        self.assertEqual(data_a["intervention_class"], "CLASS_A")
        self.assertFalse(data_a["requires_human_approval"])

        # Test drilling on slope -> Class C (Human Approval Required)
        res_c = self.client.post("/api/experiments/classify", json={
            "experiment_class": "GEOLOGICAL_SAMPLING",
            "name": "Delta Bedrock Core Drilling",
            "slope_deg": 13.0,
            "involves_drilling": True,
            "temp_c": -40.0,
            "radiation_usv_hr": 26.5
        })
        self.assertEqual(res_c.status_code, 200)
        data_c = res_c.json()
        self.assertEqual(data_c["intervention_class"], "CLASS_C")
        self.assertTrue(data_c["requires_human_approval"])
        print("✓ Module 5: AI Experiment Intervention Classifier and Rule Engine verified (Class A & Class C overrides)")

    def test_06_route_optimization(self):
        # Test route planning between Jezero base and delta front
        res = self.client.post("/api/routes/plan", json={
            "mission_id": "00000000-0000-0000-0000-000000000001",
            "start_lat": 18.3800,
            "start_lon": 77.5800,
            "dest_lat": 18.4200,
            "dest_lon": 77.5200,
            "alpha": 0.5, "beta": 0.3, "gamma": 0.2,
            "max_slope_deg": 18.0
        })
        self.assertEqual(res.status_code, 200)
        data = res.json()["plan"]
        self.assertEqual(len(data["candidates"]), 3)
        self.assertIn("emergency_evacuation_path", data)
        print("✓ Module 3: Constrained Route Planning verified (3 candidates + Emergency Evacuation Path)")

    def test_07_simulation_lab(self):
        res = self.client.post("/api/simulation/run", json={
            "scenario_type": "THERMAL_BALANCE",
            "parameters": {"duration_min": 120, "ambient_temp_c": -45, "metabolic_watts": 320}
        })
        self.assertEqual(res.status_code, 200)
        sim = res.json()
        self.assertIn("time_series", sim)
        self.assertIn("summary", sim)
        print("✓ Module 6: Earth-Based Simulation Lab verified (Numerical thermal-exchange equations)")

    def test_08_ml_models(self):
        # Test ML Model A
        res_t = self.client.post("/api/ml/terrain-classify", json={
            "mean_reflectance": 0.35, "roughness_std": 0.55, "edge_density": 0.82, "slope_deg": 22.0
        })
        self.assertEqual(res_t.status_code, 200)
        self.assertEqual(res_t.json()["predicted_class"], "STEEP_ESCARPMENT")

        # Test ML Metrics
        res_m = self.client.get("/api/ml/metrics")
        self.assertEqual(res_m.status_code, 200)
        metrics = res_m.json()
        self.assertIn("terrain_classification", metrics)
        self.assertIn("risk_prediction", metrics)
        print("✓ Section 6: Trained ML models verified with evaluation metrics")

    def test_09_digital_twin(self):
        res = self.client.get("/api/digital-twin/state")
        self.assertEqual(res.status_code, 200)
        twin = res.json()
        self.assertIn("rover_position", twin)
        self.assertIn("environmental_telemetry", twin)
        self.assertIn("timeline", twin)
        print("✓ Module 8: Mission Digital Twin state verified")

    def test_10_hazards_management(self):
        # 1. Fetch hazards
        res = self.client.get("/api/hazards")
        self.assertEqual(res.status_code, 200)
        hazards = res.json()
        self.assertIsInstance(hazards, list)

        # 2. Create manual hazard
        h_payload = {
            "mission_id": "00000000-0000-0000-0000-000000000001",
            "name": "Test Scree Hazard",
            "category": "ROCK_FALL",
            "severity": "HIGH",
            "lat": 18.4110,
            "lon": 77.5310,
            "affected_radius_m": 85.0
        }
        res_create = self.client.post("/api/hazards", json=h_payload)
        self.assertEqual(res_create.status_code, 200)
        h_created = res_create.json()["hazard"]
        self.assertEqual(h_created["name"], "Test Scree Hazard")

        # 3. Delete/deactivate hazard
        h_id = h_created["id"]
        res_del = self.client.delete(f"/api/hazards/{h_id}")
        self.assertEqual(res_del.status_code, 200)
        print("✓ Section 2 & 3: Hazards Management & Dynamic Placement verified")

    def test_11_telemetry_simulator(self):
        # 1. Get telemetry state
        res_state = self.client.get("/api/telemetry/state")
        self.assertEqual(res_state.status_code, 200)

        # 2. Control simulation (START)
        res_start = self.client.post("/api/telemetry/control", json={"action": "START", "frequency_hz": 2.0})
        self.assertEqual(res_start.status_code, 200)
        self.assertEqual(res_start.json()["status"], "RUNNING")

        # 3. Generate tick packet
        res_tick = self.client.get("/api/telemetry/tick")
        self.assertEqual(res_tick.status_code, 200)
        packet = res_tick.json()
        self.assertIn("environmental", packet)
        self.assertIn("subsystems", packet)
        self.assertIn("risk_assessment", packet)

        # 4. Inject Anomaly (DUST_STORM)
        res_anom = self.client.post("/api/telemetry/inject-anomaly", json={
            "anomaly_type": "DUST_STORM",
            "severity": "CRITICAL"
        })
        self.assertEqual(res_anom.status_code, 200)
        self.assertTrue(res_anom.json()["current_telemetry"]["pipeline_validation"]["is_anomaly"])

        # 5. Clear anomaly
        res_clear = self.client.post("/api/telemetry/clear-anomaly")
        self.assertEqual(res_clear.status_code, 200)
        print("✓ Section 1 & 10: Live Telemetry Engine & Anomaly Ingestion Pipeline verified")


if __name__ == "__main__":
    unittest.main()

