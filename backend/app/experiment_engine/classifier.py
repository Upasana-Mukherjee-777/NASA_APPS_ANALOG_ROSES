from typing import Dict, List, Any, Optional
import math


class ExperimentClassifier:
    """Classifies Martian scientific experiments into four operational intervention classes
    using multi-parameter scoring and deterministic safety rule overrides.
    """

    CLASS_DESCRIPTIONS = {
        "CLASS_A": "AUTONOMOUS EXECUTION — Low-risk, routine automated procedure executable by rover/robotic arm without astronaut physical presence.",
        "CLASS_B": "SUPERVISED EXECUTION — Semi-autonomous procedure executable with remote telemetry monitoring by mission control or habitat crew.",
        "CLASS_C": "HUMAN APPROVAL REQUIRED — Sensitive, high-value, or potentially hazardous operation requiring explicit Mission Commander approval before initiation.",
        "CLASS_D": "STOP AND REASSESS — Critical risk threshold violated (e.g. extreme slope, toxic perchlorates, compromised spacesuit pressure). Execution prohibited until safety review."
    }

    @classmethod
    def classify(
        cls,
        experiment_class: str,
        name: str,
        slope_deg: float = 4.0,
        temp_c: float = -40.0,
        radiation_usv_hr: float = 26.5,
        involves_toxic_chemistry: bool = False,
        involves_drilling: bool = False,
        equipment_condition_score: float = 95.0,  # 0-100
        astronaut_workload_score: float = 25.0    # 0-100
    ) -> Dict[str, Any]:
        """Classifies experiment intervention requirement with explainable reasoning."""

        contributing_factors = []
        rule_overrides = []

        # 1. Base risk scoring by experiment type
        type_upper = experiment_class.upper()
        if "SAMPLING" in type_upper or involves_drilling:
            base_risk = 35.0
            contributing_factors.append("Mechanical percussion and rock chip ejection risks associated with core drilling.")
        elif "BIOLOGY" in type_upper:
            base_risk = 40.0
            contributing_factors.append("Strict planetary protection guidelines and cross-contamination prevention protocol.")
        elif "ATMOSPHERIC" in type_upper or "IMAGING" in type_upper:
            base_risk = 15.0
            contributing_factors.append("Passive non-destructive optical/atmospheric sensor acquisition.")
        elif "THERMAL" in type_upper or "SEISMIC" in type_upper:
            base_risk = 20.0
            contributing_factors.append("Subsurface probe deployment with low kinetic hazard.")
        else:
            base_risk = 25.0

        # Environmental modifiers
        env_risk = 0.0
        if slope_deg > 14.0:
            env_risk += 30.0
            contributing_factors.append(f"Steep incline ({slope_deg}°) increases astronaut footing slip and equipment tumble probability.")
        elif slope_deg > 8.0:
            env_risk += 15.0
            contributing_factors.append(f"Moderate slope ({slope_deg}°) requires tether anchoring.")

        if radiation_usv_hr > 40.0:
            env_risk += 25.0
            contributing_factors.append(f"Elevated radiation flux ({radiation_usv_hr} uSv/h) limits astronaut exterior dwell duration.")

        if involves_toxic_chemistry:
            env_risk += 35.0
            contributing_factors.append("High-concentration reactive perchlorates or caustic Martian dust exposure.")

        if equipment_condition_score < 70.0:
            env_risk += 20.0
            contributing_factors.append(f"Degraded hardware health index ({equipment_condition_score}%).")

        total_risk = min(100.0, base_risk + env_risk + (astronaut_workload_score * 0.15))

        # 2. HARD SAFETY RULE OVERRIDES (Deterministic)
        intervention_class = "CLASS_B"
        requires_approval = False

        if slope_deg > 20.0 or radiation_usv_hr > 80.0 or equipment_condition_score < 40.0:
            intervention_class = "CLASS_D"
            requires_approval = True
            rule_overrides.append("OVERRIDE TRIGGERED: Severe environmental hazard violation halts automatic or manned execution.")
        elif involves_toxic_chemistry or involves_drilling or total_risk >= 55.0 or slope_deg > 12.0:
            intervention_class = "CLASS_C"
            requires_approval = True
            rule_overrides.append("MANDATORY SAFETY RULE: Chemical sampling or mechanical coring requires explicit Commander sign-off.")
        elif total_risk >= 30.0:
            intervention_class = "CLASS_B"
            requires_approval = False
        else:
            intervention_class = "CLASS_A"
            requires_approval = False

        # Recommended precautions
        precautions = []
        if intervention_class in ("CLASS_C", "CLASS_D"):
            precautions.append("Perform two-way comms ping verification with Base Camp before tool actuation.")
            precautions.append("Deploy HEPA particle extraction vacuum on core drill shroud to mitigate airborne fines.")
        if slope_deg > 8.0:
            precautions.append("Secure tool kit to rover equipment rack with dual safety tethers.")
        if radiation_usv_hr > 30.0:
            precautions.append("Enforce strict 20-minute maximum sampling window for EVA astronaut.")

        explanation = (
            f"Classified as {intervention_class} ({cls.CLASS_DESCRIPTIONS[intervention_class]}). "
            f"Computed risk score: {round(total_risk, 1)}/100. "
            + (" " + " ".join(rule_overrides) if rule_overrides else "")
        )

        return {
            "intervention_class": intervention_class,
            "risk_score": round(total_risk, 1),
            "requires_human_approval": requires_approval,
            "description": cls.CLASS_DESCRIPTIONS[intervention_class],
            "explanation": explanation,
            "contributing_factors": contributing_factors,
            "rule_overrides": rule_overrides,
            "recommended_precautions": precautions
        }
