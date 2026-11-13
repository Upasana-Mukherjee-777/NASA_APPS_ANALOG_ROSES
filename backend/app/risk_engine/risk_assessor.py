from typing import Dict, List, Any, Optional
import math
from datetime import datetime


class RiskAssessor:
    """Intelligent Martian Risk Evaluation and Anomaly Detection Engine.
    Uses multi-criteria risk synthesis, statistical anomaly bounds, and uncertainty modeling.
    """

    # Validated physical baselines for Jezero Crater (-2500m elevation)
    BASELINES = {
        "TEMPERATURE_C": {"min": -95.0, "max": 15.0, "nominal_mean": -45.0, "std": 12.0},
        "PRESSURE_PA": {"min": 650.0, "max": 850.0, "nominal_mean": 730.0, "std": 30.0},
        "RADIATION_USV_HR": {"min": 15.0, "max": 45.0, "nominal_mean": 26.5, "std": 4.5},
        "DUST_TAU": {"min": 0.2, "max": 1.2, "nominal_mean": 0.5, "std": 0.2},
        "WIND_SPEED_MS": {"min": 0.0, "max": 25.0, "nominal_mean": 7.0, "std": 4.0},
    }

    @classmethod
    def detect_telemetry_anomaly(
        cls,
        category: str,
        value: float,
        unit: Optional[str] = None
    ) -> Dict[str, Any]:
        """Detects whether an incoming sensor observation represents a statistical anomaly
        or hazard threshold violation.
        """
        cat_key = category.upper()
        if "TEMP" in cat_key:
            baseline = cls.BASELINES["TEMPERATURE_C"]
            metric = "Temperature"
        elif "PRESS" in cat_key:
            baseline = cls.BASELINES["PRESSURE_PA"]
            metric = "Atmospheric Pressure"
        elif "RAD" in cat_key:
            baseline = cls.BASELINES["RADIATION_USV_HR"]
            metric = "Ionizing Radiation"
        elif "DUST" in cat_key:
            baseline = cls.BASELINES["DUST_TAU"]
            metric = "Dust Optical Depth"
        elif "WIND" in cat_key:
            baseline = cls.BASELINES["WIND_SPEED_MS"]
            metric = "Wind Speed"
        else:
            return {
                "is_anomaly": False,
                "anomaly_score": 0.0,
                "severity": "LOW",
                "explanation": f"Standard telemetry recorded within acceptable operating window for {category}."
            }

        # Calculate Z-score
        z_score = abs(value - baseline["nominal_mean"]) / baseline["std"]
        is_outside_hard_limits = (value < baseline["min"]) or (value > baseline["max"])
        is_anomaly = (z_score > 2.5) or is_outside_hard_limits

        # Determine severity
        if z_score > 4.0 or (value > baseline["max"] * 1.4):
            severity = "CRITICAL"
        elif z_score > 3.0 or is_outside_hard_limits:
            severity = "HIGH"
        elif z_score > 2.0:
            severity = "MEDIUM"
        else:
            severity = "LOW"

        anomaly_score = min(100.0, round(z_score * 20.0, 1))

        explanation_parts = []
        if is_anomaly:
            if value > baseline["nominal_mean"]:
                explanation_parts.append(
                    f"Observation {value} exceeds expected nominal mean {baseline['nominal_mean']} (Z-score: {round(z_score, 2)})."
                )
            else:
                explanation_parts.append(
                    f"Observation {value} significantly below nominal mean {baseline['nominal_mean']} (Z-score: {round(z_score, 2)})."
                )
            if "RAD" in cat_key:
                explanation_parts.append("Elevated radiation flux suggests possible Solar Particle Event (SPE) precursor.")
            elif "DUST" in cat_key:
                explanation_parts.append("Atmospheric dust loading indicates localized dust devil or regional dust storm front.")
            elif "PRESS" in cat_key and value < baseline["min"]:
                explanation_parts.append("Rapid pressure drop indicates barometric front or suit sensor cavity pressure leakage.")
        else:
            explanation_parts.append(f"Value {value} is within normal Martian variance bounds (Z-score: {round(z_score, 2)}).")

        return {
            "is_anomaly": is_anomaly,
            "anomaly_score": anomaly_score,
            "z_score": round(z_score, 2),
            "severity": severity,
            "expected_range": f"{baseline['min']} to {baseline['max']}",
            "explanation": " ".join(explanation_parts)
        }

    @classmethod
    def evaluate_mission_risk(
        cls,
        terrain_slope: float,
        recent_hazards: List[Dict[str, Any]],
        current_radiation_usv_hr: Optional[float] = None,
        current_temp_c: Optional[float] = None,
        dust_tau: Optional[float] = None,
        crew_fatigue_score: float = 20.0
    ) -> Dict[str, Any]:
        """Synthesizes comprehensive multi-domain risk rating with uncertainty tracking."""
        uncertainties = []

        # Terrain Risk (0-30)
        slope_risk = min(30.0, (terrain_slope / 20.0) * 30.0)

        # Hazard Proximity Risk (0-35)
        active_high = [h for h in recent_hazards if h.get("severity") in ("HIGH", "CRITICAL")]
        hazard_risk = min(35.0, len(active_high) * 15.0 + len(recent_hazards) * 5.0)

        # Radiation Risk (0-20)
        if current_radiation_usv_hr is not None:
            rad_risk = min(20.0, (current_radiation_usv_hr / 50.0) * 20.0)
        else:
            rad_risk = 10.0  # conservative midpoint
            uncertainties.append("Radiation sensor telemetry unavailable: using conservative default 26.5 uSv/h.")

        # Environmental/Dust Risk (0-15)
        if dust_tau is not None:
            env_risk = min(15.0, (dust_tau / 1.5) * 15.0)
        else:
            env_risk = 5.0
            uncertainties.append("Atmospheric dust tau unconfirmed by local LIDAR.")

        total_risk_score = round(slope_risk + hazard_risk + rad_risk + env_risk + (crew_fatigue_score * 0.1), 1)
        total_risk_score = min(100.0, total_risk_score)

        if total_risk_score >= 70.0:
            level = "CRITICAL"
        elif total_risk_score >= 50.0:
            level = "HIGH"
        elif total_risk_score >= 30.0:
            level = "MEDIUM"
        else:
            level = "LOW"

        contributing_factors = [
            {"factor": "Terrain Steepness", "weight": "High", "score": round(slope_risk, 1)},
            {"factor": "Active Environmental Hazards", "weight": "Critical", "score": round(hazard_risk, 1)},
            {"factor": "Ionizing Radiation Flux", "weight": "Medium", "score": round(rad_risk, 1)},
            {"factor": "Atmospheric Opacity & Dust", "weight": "Medium", "score": round(env_risk, 1)},
        ]

        recommended_precautions = []
        if level in ("HIGH", "CRITICAL"):
            recommended_precautions.append("Mandate Mission Commander concurrence prior to egress past checkpoint 2.")
            recommended_precautions.append("Shorten EVA dwell duration by 25% to retain life-support margin.")
        if terrain_slope > 12.0:
            recommended_precautions.append("Deploy trekking stabilization poles; maintain 10-meter team spacing.")
        if current_radiation_usv_hr and current_radiation_usv_hr > 35.0:
            recommended_precautions.append("Monitor dosimeter cumulative readout; prepare for rover habitat ingress.")

        return {
            "overall_risk_score": total_risk_score,
            "overall_severity": level,
            "contributing_factors": contributing_factors,
            "recommended_precautions": recommended_precautions,
            "uncertainties": uncertainties,
            "timestamp": datetime.utcnow().isoformat()
        }

