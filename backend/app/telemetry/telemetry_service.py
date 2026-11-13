from datetime import datetime, timezone
import random
import math
from typing import Dict, Any, List, Optional
from collections import deque


class TelemetrySimulator:
    """Deterministic & Live Simulated Telemetry Engine for Martian Mission EVA-07.
    Produces high-fidelity environmental, physiological, and rover subsystem telemetry
    with real-time anomaly detection, risk recalculation, and event notification.
    """

    def __init__(self, seed: Optional[int] = 42):
        self.seed = seed
        self.rng = random.Random(seed) if seed is not None else random.Random()
        self.status = "IDLE"  # IDLE, RUNNING, PAUSED
        self.frequency_hz = 1.0
        self.step_counter = 0
        self.mission_id = "00000000-0000-0000-0000-000000000001"
        self.sol = 1084

        # Mission trajectory: Jezero Base to Delta Front (approx 3.85 km)
        self.start_lat = 18.3800
        self.start_lon = 77.5800
        self.dest_lat = 18.4200
        self.dest_lon = 77.5200
        self.total_mission_distance_km = 3.85

        # Subsystem & resource states
        self.battery_pct = 98.5
        self.suit_o2_pct = 99.0
        self.water_coolant_pct = 96.5
        self.suit_pressure_kpa = 29.6  # Standard 4.3 psi EMU / Martian EVA pressure
        self.cooling_loop_eff = 0.96

        # Active injected anomaly
        self.active_anomaly: Optional[Dict[str, Any]] = None
        self.anomaly_steps_remaining = 0

        # Ingestion pipeline buffers
        self.history: deque = deque(maxlen=200)
        self.event_log: List[Dict[str, Any]] = []

    def set_seed(self, seed: Optional[int]):
        self.seed = seed
        self.rng = random.Random(seed) if seed is not None else random.Random()

    def set_frequency(self, frequency_hz: float):
        self.frequency_hz = max(0.2, min(10.0, frequency_hz))

    def start(self):
        self.status = "RUNNING"
        self._log_event("MISSION_TELEMETRY_STARTED", "INFO", "Telemetry ingestion pipeline online. Sensor polling active at Jezero Crater.")

    def pause(self):
        self.status = "PAUSED"
        self._log_event("MISSION_TELEMETRY_PAUSED", "WARNING", "Telemetry pipeline paused by flight controller.")

    def resume(self):
        self.status = "RUNNING"
        self._log_event("MISSION_TELEMETRY_RESUMED", "INFO", "Telemetry pipeline resumed.")

    def reset(self):
        self.status = "IDLE"
        self.step_counter = 0
        self.battery_pct = 98.5
        self.suit_o2_pct = 99.0
        self.water_coolant_pct = 96.5
        self.cooling_loop_eff = 0.96
        self.active_anomaly = None
        self.anomaly_steps_remaining = 0
        self.history.clear()
        self.event_log.clear()
        if self.seed is not None:
            self.rng = random.Random(self.seed)
        self._log_event("TELEMETRY_RESET", "INFO", "Telemetry session reset to initial datum state at Jezero Base Camp.")

    def inject_anomaly(self, anomaly_type: str, severity: str = "HIGH", details: Optional[str] = None):
        """Injects a dynamic mission contingency event."""
        anomaly_type_upper = anomaly_type.upper()
        self.active_anomaly = {
            "type": anomaly_type_upper,
            "severity": severity.upper(),
            "details": details or f"Injected contingency: {anomaly_type_upper}",
            "injected_at_step": self.step_counter,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        self.anomaly_steps_remaining = 60  # lasts for 60 ticks unless cleared
        self._log_event(
            f"ANOMALY_INJECTED_{anomaly_type_upper}",
            severity.upper(),
            f"Contingency event triggered: {anomaly_type_upper}. {details or ''}"
        )
        return self.active_anomaly

    def clear_anomaly(self):
        if self.active_anomaly:
            anom_type = self.active_anomaly["type"]
            self.active_anomaly = None
            self.anomaly_steps_remaining = 0
            self._log_event(f"ANOMALY_CLEARED_{anom_type}", "INFO", f"Contingency condition cleared. Systems returning to nominal.")

    def _log_event(self, event_type: str, severity: str, message: str, meta: Optional[Dict[str, Any]] = None):
        evt = {
            "id": len(self.event_log) + 1,
            "event_type": event_type,
            "severity": severity,
            "message": message,
            "step": self.step_counter,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "metadata": meta or {}
        }
        self.event_log.append(evt)
        if len(self.event_log) > 200:
            self.event_log.pop(0)

    def generate_packet(self) -> Dict[str, Any]:
        """Generates the next telemetry reading through the ingestion and anomaly detection pipeline."""
        if self.status == "RUNNING":
            self.step_counter += 1
            if self.anomaly_steps_remaining > 0:
                self.anomaly_steps_remaining -= 1
                if self.anomaly_steps_remaining == 0:
                    self.clear_anomaly()

        step = self.step_counter
        # Normalized mission progress from 0.0 to 1.0 (assuming 200 steps for demo mission)
        progress = min(1.0, step / 180.0)
        dist_travelled_km = round(progress * self.total_mission_distance_km, 3)
        dist_remaining_km = round(max(0.0, self.total_mission_distance_km - dist_travelled_km), 3)

        # Astronaut position interpolation along path
        cur_lat = round(self.start_lat + (self.dest_lat - self.start_lat) * progress, 5)
        cur_lon = round(self.start_lon + (self.dest_lon - self.start_lon) * progress, 5)

        # Baseline diurnal environmental calculations
        base_temp = -45.0 + 8.0 * math.sin(step * 0.03) + self.rng.uniform(-0.5, 0.5)
        base_rad = 26.5 + self.rng.uniform(-0.8, 0.8)
        base_pressure = 718.0 + 3.0 * math.cos(step * 0.02) + self.rng.uniform(-0.4, 0.4)
        base_dust = 0.48 + self.rng.uniform(-0.015, 0.015)
        base_wind = 7.2 + self.rng.uniform(-0.8, 0.8)

        # Terrain slope varies along Jezero floor, rising near delta scarp
        if progress < 0.4:
            base_slope = 4.2 + self.rng.uniform(-0.5, 0.5)
        elif progress < 0.75:
            base_slope = 8.5 + (progress - 0.4) * 15.0 + self.rng.uniform(-0.8, 0.8)
        else:
            base_slope = 14.5 + self.rng.uniform(-1.0, 1.0)

        # Subsystems consumption
        drain_rate = 0.05
        self.battery_pct = max(5.0, round(self.battery_pct - drain_rate * (1.0 + base_slope * 0.04), 2))
        self.suit_o2_pct = max(10.0, round(self.suit_o2_pct - 0.03, 2))
        self.water_coolant_pct = max(10.0, round(self.water_coolant_pct - 0.025, 2))

        # Physiological response
        astronaut_workload_watts = round(280.0 + base_slope * 12.0 + self.rng.uniform(-10.0, 10.0), 1)
        astronaut_heart_rate_bpm = round(75 + base_slope * 2.8 + self.rng.uniform(-3, 3), 0)
        suit_o2_flow_l_min = 0.42

        # Anomaly effects
        alerts: List[Dict[str, str]] = []
        is_anomaly = False
        anomaly_severity = "NOMINAL"
        recommendations: List[str] = []

        if self.active_anomaly:
            is_anomaly = True
            anom_type = self.active_anomaly["type"]
            anomaly_severity = self.active_anomaly["severity"]

            if anom_type == "DUST_STORM":
                base_dust = round(base_dust + 1.85, 3)
                base_wind = round(base_wind + 18.5, 1)
                base_temp = round(base_temp - 8.2, 1)
                alerts.append({
                    "code": "ENV_DUST_STORM",
                    "severity": "CRITICAL",
                    "message": "Sudden local atmospheric dust storm. Optical tau elevated to 2.3+; visibility reduced to <15%."
                })
                recommendations.append("Halt traversal; engage rover autonomous LiDAR navigation and reduce speed to 0.8 km/h.")

            elif anom_type == "RADIATION_INCREASE":
                base_rad = round(base_rad + 125.0, 1)  # Spike to 150+ uSv/hr
                alerts.append({
                    "code": "ENV_RAD_SPE",
                    "severity": "CRITICAL",
                    "message": "Solar Particle Event (SPE) detected by RAD sensor. Dosimeter reading exceeding 150 uSv/hr."
                })
                recommendations.append("Immediate abort recommended: Seek topographical shadow beneath delta overhang or return to rover vault.")

            elif anom_type == "OXYGEN_LEAK":
                suit_o2_flow_l_min = 1.95
                self.suit_o2_pct = max(5.0, round(self.suit_o2_pct - 0.45, 2))
                alerts.append({
                    "code": "LIFE_O2_RAPID_DEPLETION",
                    "severity": "CRITICAL",
                    "message": "Primary spacesuit oxygen loop leak detected. Flow rate abnormal (1.95 L/min)."
                })
                recommendations.append("EMERGENCY ABORT: Switch to secondary PLSS O2 bottle. Execute Emergency Return Route immediately.")

            elif anom_type == "EQUIPMENT_MALFUNCTION":
                self.cooling_loop_eff = 0.58
                self.battery_pct = max(5.0, round(self.battery_pct - 0.2, 2))
                alerts.append({
                    "code": "SYS_COOLING_DEGRADED",
                    "severity": "HIGH",
                    "message": "Sublimator cooling loop efficiency degraded to 58%. Metabolic heat accumulation warning."
                })
                recommendations.append("Reduce crew pace to <1.5 km/h; inspect umbilical connector for dust contamination.")

            elif anom_type == "TERRAIN_OBSTRUCTION":
                base_slope = round(base_slope + 16.5, 1)
                alerts.append({
                    "code": "NAV_UNSAFE_TERRAIN",
                    "severity": "HIGH",
                    "message": "Steep escarpment and boulder scree field detected directly on current azimuth. Slope exceeds 25°."
                })
                recommendations.append("Current route unsafe. Recalculate candidate route via Aegis SafePath southern detour.")

            elif anom_type == "FATIGUE_INCREASE":
                astronaut_workload_watts = round(astronaut_workload_watts + 180.0, 1)
                astronaut_heart_rate_bpm = round(astronaut_heart_rate_bpm + 45.0, 0)
                alerts.append({
                    "code": "MED_CREW_FATIGUE",
                    "severity": "HIGH",
                    "message": "Astronaut Mark Thorne exhibiting elevated cardiac strain (>145 bpm) and prolonged metabolic load."
                })
                recommendations.append("Mandatory 15-minute rest stop at current waypoint; monitor core temperature.")

        # Hard threshold validation
        if base_slope > 18.0 and not any(a["code"] == "NAV_UNSAFE_TERRAIN" for a in alerts):
            is_anomaly = True
            anomaly_severity = "HIGH"
            alerts.append({
                "code": "TERRAIN_SLOPE_LIMIT",
                "severity": "HIGH",
                "message": f"Terrain slope ({base_slope:.1f}°) exceeds hard safety constraint threshold (18.0°)."
            })

        if self.battery_pct < 20.0:
            is_anomaly = True
            anomaly_severity = "HIGH" if anomaly_severity != "CRITICAL" else anomaly_severity
            alerts.append({
                "code": "PWR_BATTERY_LOW",
                "severity": "HIGH",
                "message": f"Rover battery reserves critical ({self.battery_pct:.1f}%)."
            })

        # Calculate composite mission risk score (0.0 to 1.0)
        risk_terrain = min(1.0, base_slope / 22.0)
        risk_rad = min(1.0, base_rad / 150.0)
        risk_dust = min(1.0, base_dust / 2.0)
        risk_o2 = min(1.0, (100.0 - self.suit_o2_pct) / 75.0)
        risk_workload = min(1.0, (astronaut_workload_watts - 200.0) / 350.0)

        composite_risk = round(
            0.25 * risk_terrain +
            0.25 * risk_rad +
            0.20 * risk_dust +
            0.15 * risk_o2 +
            0.15 * risk_workload,
            3
        )

        packet = {
            "step": step,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "status": self.status,
            "sol": self.sol,
            "mission_id": self.mission_id,
            "mission_phase": "SURFACE_TRAVERSAL" if progress < 0.95 else "OBJECTIVE_AREA_REACHED",
            "progress_pct": round(progress * 100.0, 1),
            "distance_travelled_km": dist_travelled_km,
            "distance_remaining_km": dist_remaining_km,
            "estimated_return_time_min": round(dist_remaining_km / (2.4 / 60.0), 0),
            "astronaut_position": {
                "lat": cur_lat,
                "lon": cur_lon,
                "elevation_m": round(-2580.0 + progress * 75.0, 1)
            },
            "environmental": {
                "temperature_c": round(base_temp, 2),
                "radiation_usv_hr": round(base_rad, 2),
                "pressure_pa": round(base_pressure, 1),
                "dust_tau": round(base_dust, 3),
                "wind_speed_ms": round(base_wind, 1),
                "terrain_slope_deg": round(base_slope, 1)
            },
            "subsystems": {
                "rover_battery_pct": self.battery_pct,
                "suit_o2_pct": self.suit_o2_pct,
                "suit_o2_flow_l_min": suit_o2_flow_l_min,
                "water_coolant_pct": self.water_coolant_pct,
                "cooling_loop_efficiency": self.cooling_loop_eff,
                "suit_pressure_kpa": self.suit_pressure_kpa,
                "equipment_health_pct": round(min(self.battery_pct, self.cooling_loop_eff * 100.0), 1)
            },
            "astronaut_physiology": {
                "heart_rate_bpm": astronaut_heart_rate_bpm,
                "workload_watts": astronaut_workload_watts,
                "fatigue_index": round(min(100.0, progress * 40.0 + (astronaut_workload_watts / 6.0)), 1)
            },
            "risk_assessment": {
                "composite_risk_score": composite_risk,
                "risk_level": "CRITICAL" if composite_risk > 0.70 else "HIGH" if composite_risk > 0.45 else "MEDIUM" if composite_risk > 0.25 else "LOW",
                "terrain_risk": round(risk_terrain, 2),
                "radiation_risk": round(risk_rad, 2),
                "dust_risk": round(risk_dust, 2),
                "resource_risk": round(risk_o2, 2),
                "workload_risk": round(risk_workload, 2)
            },
            "pipeline_validation": {
                "is_anomaly": is_anomaly,
                "severity": anomaly_severity,
                "alerts": alerts,
                "recommendations": recommendations,
                "provenance": "SIMULATED_DETERMINISTIC" if self.seed is not None else "SIMULATED_LIVE"
            }
        }

        self.history.append(packet)
        return packet

    def get_state(self) -> Dict[str, Any]:
        """Returns the current state and latest telemetry packets."""
        latest = self.history[-1] if self.history else self.generate_packet()
        return {
            "status": self.status,
            "step": self.step_counter,
            "frequency_hz": self.frequency_hz,
            "seed": self.seed,
            "active_anomaly": self.active_anomaly,
            "latest_packet": latest,
            "history_count": len(self.history),
            "recent_history": list(self.history)[-40:],
            "recent_events": self.event_log[-20:]
        }


# Global singleton instance for the session
telemetry_engine = TelemetrySimulator(seed=42)
