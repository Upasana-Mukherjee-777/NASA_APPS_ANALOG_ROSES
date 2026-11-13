import numpy as np
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor, IsolationForest
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
from typing import Dict, List, Any


class MLModelSuite:
    """Trained Machine Learning models for MARS-GUARD.
    Includes real trained scikit-learn models for:
    - Terrain Classification
    - Environmental Anomaly Detection
    - Multi-Factor Mission Risk Prediction
    - Experiment Intervention Classification
    - Complete evaluation metrics and confusion matrices.
    """

    def __init__(self):
        np.random.seed(42)
        self._train_terrain_model()
        self._train_anomaly_model()
        self._train_risk_model()
        self._train_experiment_classifier()

    def _train_terrain_model(self):
        """Model A: Terrain Classification from feature vectors (reflectance, roughness, edge gradient, elevation variance).
        Classes: 0: FLAT_PLAIN, 1: ROCKY_REGOLITH, 2: CRATER_RIM, 3: STEEP_ESCARPMENT
        """
        self.terrain_classes = ["FLAT_PLAIN", "ROCKY_REGOLITH", "CRATER_RIM", "STEEP_ESCARPMENT"]

        # Synthetic feature distribution based on Jezero HiRISE/MOLA morphometry
        # Features: [mean_reflectance, roughness_std, edge_density, slope_deg]
        n_samples_per_class = 150

        # Class 0: Flat plain
        c0 = np.column_stack([
            np.random.normal(0.45, 0.04, n_samples_per_class),
            np.random.normal(0.08, 0.02, n_samples_per_class),
            np.random.normal(0.12, 0.03, n_samples_per_class),
            np.random.normal(2.5, 1.2, n_samples_per_class)
        ])
        # Class 1: Rocky regolith
        c1 = np.column_stack([
            np.random.normal(0.38, 0.05, n_samples_per_class),
            np.random.normal(0.28, 0.05, n_samples_per_class),
            np.random.normal(0.45, 0.08, n_samples_per_class),
            np.random.normal(7.0, 2.5, n_samples_per_class)
        ])
        # Class 2: Crater rim
        c2 = np.column_stack([
            np.random.normal(0.52, 0.06, n_samples_per_class),
            np.random.normal(0.42, 0.07, n_samples_per_class),
            np.random.normal(0.68, 0.09, n_samples_per_class),
            np.random.normal(14.0, 3.0, n_samples_per_class)
        ])
        # Class 3: Steep escarpment
        c3 = np.column_stack([
            np.random.normal(0.32, 0.06, n_samples_per_class),
            np.random.normal(0.58, 0.08, n_samples_per_class),
            np.random.normal(0.85, 0.07, n_samples_per_class),
            np.random.normal(23.0, 4.0, n_samples_per_class)
        ])

        X = np.vstack([c0, c1, c2, c3])
        y = np.concatenate([
            np.zeros(n_samples_per_class),
            np.ones(n_samples_per_class),
            np.full(n_samples_per_class, 2),
            np.full(n_samples_per_class, 3)
        ])

        # Train/Test split 80/20
        indices = np.random.permutation(len(X))
        split = int(0.8 * len(X))
        train_idx, test_idx = indices[:split], indices[split:]
        X_train, X_test = X[train_idx], X[test_idx]
        y_train, y_test = y[train_idx], y[test_idx]

        self.terrain_rf = RandomForestClassifier(n_estimators=50, max_depth=6, random_state=42)
        self.terrain_rf.fit(X_train, y_train)

        y_pred = self.terrain_rf.predict(X_test)
        self.terrain_metrics = {
            "model": "Random Forest Terrain Classifier (50 Trees)",
            "train_samples": len(X_train),
            "test_samples": len(X_test),
            "accuracy": round(float(accuracy_score(y_test, y_pred)), 4),
            "precision_weighted": round(float(precision_score(y_test, y_pred, average="weighted")), 4),
            "recall_weighted": round(float(recall_score(y_test, y_pred, average="weighted")), 4),
            "f1_weighted": round(float(f1_score(y_test, y_pred, average="weighted")), 4),
            "confusion_matrix": confusion_matrix(y_test, y_pred).tolist(),
            "classes": self.terrain_classes,
            "feature_names": ["Mean Reflectance (I/F)", "Surface Roughness Std", "Edge Density", "Slope Angle (deg)"],
            "feature_importances": [round(float(f), 4) for f in self.terrain_rf.feature_importances_]
        }

    def _train_anomaly_model(self):
        """Model B: Environmental Anomaly Detection using Isolation Forest."""
        # Train on 800 nominal Martian telemetry samples [temp_c, pressure_pa, rad_usv_hr, dust_tau, wind_ms]
        n_samples = 800
        nominal_data = np.column_stack([
            np.random.normal(-45.0, 10.0, n_samples),
            np.random.normal(730.0, 25.0, n_samples),
            np.random.normal(26.5, 4.0, n_samples),
            np.random.normal(0.50, 0.18, n_samples),
            np.random.normal(7.0, 3.5, n_samples)
        ])

        self.iso_forest = IsolationForest(contamination=0.04, random_state=42)
        self.iso_forest.fit(nominal_data)

        self.anomaly_metrics = {
            "model": "Isolation Forest Telemetry Anomaly Detector",
            "training_samples": n_samples,
            "contamination_parameter": 0.04,
            "features": ["Temperature (°C)", "Pressure (Pa)", "Radiation (uSv/hr)", "Dust Tau", "Wind Speed (m/s)"],
            "description": "Fitted on nominal Jezero surface meteorology envelope."
        }

    def _train_risk_model(self):
        """Model C: Mission Risk Regressor (Random Forest).
        Predicts continuous risk score 0–100 from [slope_deg, hazard_count, rad_usv, dust_tau, fatigue_idx]
        """
        n_samples = 500
        slope = np.random.uniform(0, 25, n_samples)
        hazards = np.random.poisson(1.0, n_samples)
        rad = np.random.uniform(18, 60, n_samples)
        dust = np.random.uniform(0.2, 1.4, n_samples)
        fatigue = np.random.uniform(10, 85, n_samples)

        # Ground truth risk function with non-linear penalties
        risk = (
            (slope / 25.0) * 35.0 +
            np.minimum(35.0, hazards * 15.0) +
            (rad / 60.0) * 18.0 +
            (dust / 1.4) * 12.0 +
            (fatigue / 85.0) * 10.0 +
            np.random.normal(0, 2.0, n_samples)
        )
        risk = np.clip(risk, 0.0, 100.0)

        X = np.column_stack([slope, hazards, rad, dust, fatigue])
        split = int(0.8 * n_samples)
        self.risk_rf = RandomForestRegressor(n_estimators=40, max_depth=5, random_state=42)
        self.risk_rf.fit(X[:split], risk[:split])

        y_pred = self.risk_rf.predict(X[split:])
        r2 = self.risk_rf.score(X[split:], risk[split:])

        self.risk_metrics = {
            "model": "Random Forest Risk Predictor (40 Trees)",
            "r2_score": round(float(r2), 4),
            "mae": round(float(np.mean(np.abs(risk[split:] - y_pred))), 2),
            "features": ["Terrain Slope (deg)", "Active Hazard Count", "Radiation Flux (uSv/h)", "Dust Opacity (Tau)", "Astronaut Fatigue Index"],
            "feature_importances": [round(float(f), 4) for f in self.risk_rf.feature_importances_]
        }

    def _train_experiment_classifier(self):
        """Model D: Experiment Intervention Classifier."""
        self.exp_classes = ["CLASS_A", "CLASS_B", "CLASS_C", "CLASS_D"]
        # Train on operational features: [slope, temp_abs_diff, radiation, toxic_flag, drill_flag, workload]
        n_samples = 400
        slope = np.random.uniform(0, 24, n_samples)
        temp_diff = np.random.uniform(0, 40, n_samples)
        rad = np.random.uniform(20, 85, n_samples)
        toxic = np.random.binomial(1, 0.25, n_samples)
        drill = np.random.binomial(1, 0.35, n_samples)
        workload = np.random.uniform(10, 80, n_samples)

        y = []
        for i in range(n_samples):
            if slope[i] > 18.0 or rad[i] > 70.0:
                y.append(3) # CLASS_D
            elif toxic[i] == 1 or drill[i] == 1 or slope[i] > 11.0:
                y.append(2) # CLASS_C
            elif rad[i] > 35.0 or workload[i] > 50.0:
                y.append(1) # CLASS_B
            else:
                y.append(0) # CLASS_A

        X = np.column_stack([slope, temp_diff, rad, toxic, drill, workload])
        split = int(0.8 * n_samples)
        self.exp_rf = RandomForestClassifier(n_estimators=30, max_depth=5, random_state=42)
        self.exp_rf.fit(X[:split], y[:split])

        y_pred = self.exp_rf.predict(X[split:])
        self.experiment_metrics = {
            "model": "Random Forest Experiment Intervention Classifier",
            "accuracy": round(float(accuracy_score(y[split:], y_pred)), 4),
            "precision_weighted": round(float(precision_score(y[split:], y_pred, average="weighted")), 4),
            "recall_weighted": round(float(recall_score(y[split:], y_pred, average="weighted")), 4),
            "f1_weighted": round(float(f1_score(y[split:], y_pred, average="weighted")), 4),
            "classes": self.exp_classes,
            "confusion_matrix": confusion_matrix(y[split:], y_pred).tolist()
        }

    def predict_terrain(self, reflectance: float, roughness: float, edge_density: float, slope_deg: float) -> Dict[str, Any]:
        """Inference for Model A: Terrain Classification."""
        features = np.array([[reflectance, roughness, edge_density, slope_deg]])
        pred_idx = int(self.terrain_rf.predict(features)[0])
        probs = self.terrain_rf.predict_proba(features)[0]
        predicted_class = self.terrain_classes[pred_idx]
        confidence = round(float(probs[pred_idx]), 3)

        descriptions = {
            "FLAT_PLAIN": "Smooth dust-mantled regolith plain with low obstacle count. Favorable for high-speed rover traverse.",
            "ROCKY_REGOLITH": "Scattered vesicular basalt float and cobbles. Moderate wheel grouser impact and footing friction.",
            "CRATER_RIM": "Elevated ejecta rampart with fractured bedrock blocks and undulating topography. Scientific target.",
            "STEEP_ESCARPMENT": "Severe cliff face or crater scarp with active talus slope and rock fall hazard. Non-traversable without anchoring."
        }

        return {
            "predicted_class": predicted_class,
            "confidence": confidence,
            "class_probabilities": {cls_name: round(float(prob), 3) for cls_name, prob in zip(self.terrain_classes, probs)},
            "description": descriptions.get(predicted_class, ""),
            "input_features": {
                "reflectance": reflectance,
                "roughness": roughness,
                "edge_density": edge_density,
                "slope_deg": slope_deg
            }
        }

    def predict_risk(self, slope_deg: float, hazard_count: int, rad_usv: float, dust_tau: float, fatigue_score: float) -> Dict[str, Any]:
        """Inference for Model C: Mission Risk Prediction."""
        features = np.array([[slope_deg, hazard_count, rad_usv, dust_tau, fatigue_score]])
        predicted_risk = float(self.risk_rf.predict(features)[0])
        predicted_risk = round(min(100.0, max(0.0, predicted_risk)), 1)

        feature_contributions = [
            {"feature": "Slope", "contribution": round(slope_deg * 1.4, 1)},
            {"feature": "Hazards", "contribution": round(hazard_count * 15.0, 1)},
            {"feature": "Radiation", "contribution": round(rad_usv * 0.35, 1)},
            {"feature": "Dust", "contribution": round(dust_tau * 10.0, 1)},
            {"feature": "Fatigue", "contribution": round(fatigue_score * 0.12, 1)},
        ]

        return {
            "predicted_risk_score": predicted_risk,
            "risk_level": "CRITICAL" if predicted_risk >= 70 else ("HIGH" if predicted_risk >= 50 else ("MEDIUM" if predicted_risk >= 30 else "LOW")),
            "feature_contributions": feature_contributions
        }

    def get_all_evaluation_metrics(self) -> Dict[str, Any]:
        """Returns verified evaluation metrics across all 4 ML models."""
        return {
            "terrain_classification": self.terrain_metrics,
            "anomaly_detection": self.anomaly_metrics,
            "risk_prediction": self.risk_metrics,
            "experiment_intervention": self.experiment_metrics
        }


# Singleton instance
ml_suite = MLModelSuite()

