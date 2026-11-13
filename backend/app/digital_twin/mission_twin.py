from typing import Dict, List, Any, Optional
import math
from datetime import datetime
from app.geospatial.mars_gis import MarsGIS
from app.risk_engine.risk_assessor import RiskAssessor


class MissionDigitalTwin:
    """Manages the mission digital twin state for Jezero Crater exploration,
    orchestrates reactive multi-layer updates when astronaut observations are submitted,
    and supports 3D rendering data and historical replay.
    """

    def __init__(self):
        # Current active twin mission state
        self.mission_id = "EVA-07-JEZERO"
        self.mission_name = "EVA-07: Scientific Exploration and Safety Assessment Near Jezero Crater"
        self.state_version = 1
        self.rover_position = {"lat": 18.3840, "lon": 77.5750, "elevation_m": -2532.0, "heading_deg": 285.0}
        self.astronaut_alpha = {"lat": 18.3845, "lon": 77.5740, "elevation_m": -2531.0, "status": "NOMINAL", "name": "Sarah Chen"}
        self.astronaut_beta = {"lat": 18.3842, "lon": 77.5742, "elevation_m": -2531.5, "status": "NOMINAL", "name": "Mark Thorne"}

        # Environmental state
        self.environmental_telemetry = {
            "temperature_c": -42.5,
            "pressure_pa": 718.0,
            "radiation_usv_hr": 26.5,
            "dust_tau": 0.48,
            "wind_speed_ms": 6.2,
            "wind_direction_deg": 245.0
        }

        # Active hazards
        self.hazards: List[Dict[str, Any]] = [
            {
                "id": "HAZ-001",
                "name": "Delta Scarp Unconsolidated Scree",
                "category": "ROCK_FALL",
                "severity": "HIGH",
                "lat": 18.4120,
                "lon": 77.5280,
                "elevation_m": -2495.0,
                "affected_radius_m": 85.0,
                "source": "OBSERVED",
                "confidence": 0.92,
                "description": "Loose boulder debris prone to sliding along 19° delta front escarpment."
            },
            {
                "id": "HAZ-002",
                "name": "Séítah Fine Sand Dune Trap",
                "category": "DUST_TRAP",
                "severity": "MEDIUM",
                "lat": 18.3910,
                "lon": 77.6180,
                "elevation_m": -2560.0,
                "affected_radius_m": 120.0,
                "source": "DERIVED",
                "confidence": 0.85,
                "description": "High wheel slip corridor with low bearing strength basaltic dune ripples."
            }
        ]

        # Mission events timeline for replay
        self.event_timeline: List[Dict[str, Any]] = [
            {
                "step": 1,
                "timestamp": "08:00:00 UTC",
                "title": "EVA Egress Initiated",
                "type": "MISSION_EVENT",
                "severity": "INFO",
                "description": "Astronauts Chen and Thorne successfully exited Airlock 1; suit baseline checks nominal."
            },
            {
                "step": 2,
                "timestamp": "08:30:00 UTC",
                "title": "Perseverance Rover Rendezvous",
                "type": "TELEMETRY",
                "severity": "INFO",
                "description": "Ingressed mobile science carrier; tool rack deployed."
            },
            {
                "step": 3,
                "timestamp": "09:15:00 UTC",
                "title": "Waypoint WP-01 Reached",
                "type": "NAVIGATION",
                "severity": "INFO",
                "description": "Navigation checkpoint validated; atmospheric sensors deployed."
            }
        ]

    def get_current_state(self) -> Dict[str, Any]:
        """Returns complete state snapshot for UI and 3D visualizers."""
        return {
            "mission_id": self.mission_id,
            "mission_name": self.mission_name,
            "version": self.state_version,
            "rover_position": self.rover_position,
            "crew_positions": [self.astronaut_alpha, self.astronaut_beta],
            "environmental_telemetry": self.environmental_telemetry,
            "hazards": self.hazards,
            "timeline": self.event_timeline,
            "jezero_landmarks": MarsGIS.JEZERO_LANDMARKS,
            "updated_at": datetime.utcnow().isoformat()
        }

    def process_new_observation(self, observation: Dict[str, Any]) -> Dict[str, Any]:
        """Adaptive Intelligence Workflow:
        1. Validates observation input & coordinates
        2. Detects anomalies & evaluates risk
        3. Spawns/updates hazards if hazardous reading detected
        4. Triggers digital twin state update & timeline recording
        """
        self.state_version += 1
        category = observation.get("category", "TEMPERATURE").upper()
        val_numeric = float(observation.get("value_numeric", 0.0))
        lat = float(observation.get("lat", self.rover_position["lat"]))
        lon = float(observation.get("lon", self.rover_position["lon"]))

        # 1. Anomaly check
        anomaly_result = RiskAssessor.detect_telemetry_anomaly(
            category=category,
            value=val_numeric,
            unit=observation.get("unit")
        )

        # 2. Update environmental telemetry
        if "TEMP" in category:
            self.environmental_telemetry["temperature_c"] = val_numeric
        elif "RAD" in category:
            self.environmental_telemetry["radiation_usv_hr"] = val_numeric
        elif "PRESS" in category:
            self.environmental_telemetry["pressure_pa"] = val_numeric
        elif "DUST" in category:
            self.environmental_telemetry["dust_tau"] = val_numeric
        elif "WIND" in category:
            self.environmental_telemetry["wind_speed_ms"] = val_numeric

        new_hazard = None
        route_recalculation_needed = False

        # 3. If critical/high anomaly or reported terrain hazard, spawn active hazard
        if anomaly_result["severity"] in ("HIGH", "CRITICAL") or "HAZARD" in str(observation.get("tags", [])):
            route_recalculation_needed = True
            new_hazard = {
                "id": f"HAZ-{len(self.hazards) + 1:03d}",
                "name": f"Observation Alert: High {category}",
                "category": category,
                "severity": anomaly_result["severity"],
                "lat": lat,
                "lon": lon,
                "elevation_m": MarsGIS.get_elevation_m(lat, lon),
                "affected_radius_m": 75.0,
                "source": observation.get("data_source", "OBSERVED"),
                "confidence": observation.get("confidence", 0.9),
                "description": anomaly_result["explanation"]
            }
            self.hazards.append(new_hazard)

        # 4. Append to event timeline
        event = {
            "step": len(self.event_timeline) + 1,
            "timestamp": datetime.utcnow().strftime("%H:%M:%S UTC"),
            "title": f"New Observation: {category} ({val_numeric} {observation.get('unit', '')})",
            "type": "OBSERVATION",
            "severity": anomaly_result["severity"],
            "description": anomaly_result["explanation"],
            "lat": lat,
            "lon": lon,
            "details": {
                "category": category,
                "value": val_numeric,
                "is_anomaly": anomaly_result["is_anomaly"],
                "route_recalculated": route_recalculation_needed
            }
        }
        self.event_timeline.append(event)

        return {
            "twin_version": self.state_version,
            "anomaly_analysis": anomaly_result,
            "new_hazard_created": new_hazard,
            "route_recalculation_triggered": route_recalculation_needed,
            "event_logged": event,
            "updated_telemetry": self.environmental_telemetry
        }

    def generate_3d_terrain_grid(self, center_lat: float = 18.38, center_lon: float = 77.58, grid_size: int = 25) -> Dict[str, Any]:
        """Generates elevation grid matrix for 3D Three.js / Cesium surface rendering."""
        # 25x25 grid covering 0.1 deg lat/lon (approx 6 km x 6 km)
        lat_range = 0.08
        lon_range = 0.08
        min_lat = center_lat - (lat_range / 2.0)
        max_lat = center_lat + (lat_range / 2.0)
        min_lon = center_lon - (lon_range / 2.0)
        max_lon = center_lon + (lon_range / 2.0)

        elevations = []
        for r in range(grid_size):
            row = []
            lat = min_lat + (r / float(grid_size - 1)) * lat_range
            for c in range(grid_size):
                lon = min_lon + (c / float(grid_size - 1)) * lon_range
                elev = MarsGIS.get_elevation_m(lat, lon)
                row.append(elev)
            elevations.append(row)

        return {
            "grid_size": grid_size,
            "bounds": {
                "min_lat": min_lat,
                "max_lat": max_lat,
                "min_lon": min_lon,
                "max_lon": max_lon
            },
            "elevation_matrix": elevations,
            "datum_reference": "Mars MOLA Areoid 0m Datum"
        }


# Singleton instance
digital_twin_engine = MissionDigitalTwin()
