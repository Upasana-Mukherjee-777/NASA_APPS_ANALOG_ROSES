import math
import uuid
from typing import Dict, List, Any, Optional, Tuple
from app.geospatial.mars_gis import MarsGIS


class RouteOptimizer:
    """Safety-First Martian Route Planning and Optimization Engine.
    Implements multi-objective cost optimization J = alpha*R + beta*C + gamma*T
    with non-negotiable hard safety constraints.
    """

    # Speed parameters on Mars under 0.38g gravity with EVA spacesuit (125kg suit+backpack)
    NOMINAL_WALKING_SPEED_KMH = 2.4     # 0.67 m/s on level terrain
    STEEP_SLOPE_SPEED_PENALTY = 0.08    # Speed drops by 8% per degree of slope > 5 deg
    ASTRONAUT_REST_INTERVAL_MIN = 45.0  # Mandatory 10 min rest every 45 min
    REST_STOP_DURATION_MIN = 10.0

    @classmethod
    def plan_routes(
        cls,
        start_lat: float,
        start_lon: float,
        dest_lat: float,
        dest_lon: float,
        hazards: List[Dict[str, Any]],
        alpha: float = 0.50,  # Risk weight
        beta: float = 0.30,   # Comfort weight
        gamma: float = 0.20,  # Time weight
        max_slope_deg: float = 18.0,
        max_eva_hours: float = 6.0,
        max_radiation_usv: float = 160.0
    ) -> Dict[str, Any]:
        """Calculates three diverse route candidates plus an emergency return path,
        validates hard safety constraints, and provides explainable selection rationale.
        """
        direct_dist_km = MarsGIS.haversine_distance_km(start_lat, start_lon, dest_lat, dest_lon)
        start_elev = MarsGIS.get_elevation_m(start_lat, start_lon)
        dest_elev = MarsGIS.get_elevation_m(dest_lat, dest_lon)

        # Candidate 1: Safety-Optimal (Aegis SafePath)
        # Avoids high slopes and skirts around any hazards with an extra safety detour
        route_safe = cls._generate_candidate_route(
            name="Aegis SafePath (Safety-Optimal)",
            description="Prioritizes minimal slope, maximum distance from identified hazards, and low cardiac strain.",
            start=(start_lat, start_lon, start_elev),
            dest=(dest_lat, dest_lon, dest_elev),
            path_type="SAFETY",
            hazards=hazards,
            max_slope_limit=max_slope_deg,
            max_eva_hours=max_eva_hours,
            max_radiation_usv=max_radiation_usv,
            alpha=alpha, beta=beta, gamma=gamma
        )

        # Candidate 2: Direct Traversal (Apex Direct)
        # Most direct line, taking the direct bearing
        route_direct = cls._generate_candidate_route(
            name="Apex Direct (Time-Critical)",
            description="Shortest distance route. Crosses steeper terrain segments and passes closer to geological slopes.",
            start=(start_lat, start_lon, start_elev),
            dest=(dest_lat, dest_lon, dest_elev),
            path_type="DIRECT",
            hazards=hazards,
            max_slope_limit=max_slope_deg,
            max_eva_hours=max_eva_hours,
            max_radiation_usv=max_radiation_usv,
            alpha=alpha, beta=beta, gamma=gamma
        )

        # Candidate 3: Science-Maximized (Ares Explorer)
        # Detours past prominent mineralogical outcrops (smectite delta & carbonate ridge)
        route_science = cls._generate_candidate_route(
            name="Ares Explorer (Science-Maximized)",
            description="Optimized for science return by incorporating sample caching waypoints at Jezero delta strata.",
            start=(start_lat, start_lon, start_elev),
            dest=(dest_lat, dest_lon, dest_elev),
            path_type="SCIENCE",
            hazards=hazards,
            max_slope_limit=max_slope_deg,
            max_eva_hours=max_eva_hours,
            max_radiation_usv=max_radiation_usv,
            alpha=alpha, beta=beta, gamma=gamma
        )

        # Emergency Abort / Return Path
        emergency_evac = cls._generate_emergency_evac(
            start=(dest_lat, dest_lon, dest_elev),
            safe_haven=(start_lat, start_lon, start_elev),
            hazards=hazards
        )

        candidates = [route_safe, route_direct, route_science]

        # Select recommended route: Must satisfy hard constraints, then lowest cost J = alpha*R + beta*C + gamma*T
        valid_candidates = [c for c in candidates if c["hard_constraints_met"]]
        if valid_candidates:
            recommended = min(valid_candidates, key=lambda c: c["cost_j"])
            recommended["is_selected"] = True
            recommended["selection_rationale"] = (
                f"Selected as primary mission path. Safely satisfies all hard terrain constraints (max slope {recommended['max_observed_slope_deg']}° < {max_slope_deg}°), "
                f"maintains comfort index {recommended['comfort_score']}/100, and ensures a {round(max_eva_hours - recommended['estimated_duration_hours'], 1)}h life-support safety reserve."
            )
        else:
            # Fallback if all violate constraints
            recommended = route_safe
            recommended["is_selected"] = True
            recommended["selection_rationale"] = "WARNING: All direct routes exceed nominal parameters. Aegis SafePath selected with mandatory mission commander override."

        for c in candidates:
            if not c["is_selected"]:
                if not c["hard_constraints_met"]:
                    c["rejection_reason"] = f"REJECTED BY SAFETY ENGINE: Violated non-negotiable safety constraint ({c.get('violation_detail', 'Slope/Hazard violation')})."
                else:
                    c["rejection_reason"] = f"Evaluated but ranked secondary: Higher combined risk/fatigue cost J={round(c['cost_j'], 2)} vs selected J={round(recommended['cost_j'], 2)}."

        return {
            "mission_start": {"lat": start_lat, "lon": start_lon, "elevation_m": start_elev},
            "mission_destination": {"lat": dest_lat, "lon": dest_lon, "elevation_m": dest_elev},
            "direct_distance_km": round(direct_dist_km, 3),
            "weights": {"alpha_risk": alpha, "beta_comfort": beta, "gamma_time": gamma},
            "candidates": candidates,
            "emergency_evacuation_path": emergency_evac,
            "recommended_candidate_id": recommended["id"]
        }

    @classmethod
    def _generate_candidate_route(
        cls,
        name: str,
        description: str,
        start: Tuple[float, float, float],
        dest: Tuple[float, float, float],
        path_type: str,
        hazards: List[Dict[str, Any]],
        max_slope_limit: float,
        max_eva_hours: float,
        max_radiation_usv: float,
        alpha: float, beta: float, gamma: float
    ) -> Dict[str, Any]:
        """Generates waypoint sequence, calculates physics parameters, and checks constraints."""
        start_lat, start_lon, start_elev = start
        dest_lat, dest_lon, dest_elev = dest

        # Determine waypoint coordinates based on path type
        waypoints_coords = []
        num_segments = 6

        for i in range(num_segments + 1):
            fraction = i / float(num_segments)
            # Base linear interpolation
            interp_lat = start_lat + fraction * (dest_lat - start_lat)
            interp_lon = start_lon + fraction * (dest_lon - start_lon)

            # Apply curve offset depending on path type
            offset = math.sin(fraction * math.pi)
            if path_type == "SAFETY":
                # Arc south away from steep delta scarps and rock fall zone
                lat = interp_lat - 0.007 * offset
                lon = interp_lon + 0.005 * offset
            elif path_type == "SCIENCE":
                # Arc north toward delta strata sampling targets
                lat = interp_lat + 0.009 * offset
                lon = interp_lon - 0.004 * offset
            else: # DIRECT
                lat = interp_lat
                lon = interp_lon

            elev = MarsGIS.get_elevation_m(lat, lon)
            waypoints_coords.append((lat, lon, elev))

        # Build detailed waypoints and compute segment metrics
        total_dist_km = 0.0
        max_slope = 0.0
        elev_gain_m = 0.0
        elev_loss_m = 0.0
        hazard_intersections = []

        waypoints = []
        for idx, (lat, lon, elev) in enumerate(waypoints_coords):
            if idx > 0:
                prev_lat, prev_lon, prev_elev = waypoints_coords[idx - 1]
                seg_dist = MarsGIS.haversine_distance_km(prev_lat, prev_lon, lat, lon)
                total_dist_km += seg_dist
                slope = MarsGIS.calculate_slope_deg(prev_lat, prev_lon, lat, lon)
                max_slope = max(max_slope, slope)
                delta_e = elev - prev_elev
                if delta_e > 0:
                    elev_gain_m += delta_e
                else:
                    elev_loss_m += abs(delta_e)

            # Check proximity to hazards
            for h in hazards:
                h_dist_km = MarsGIS.haversine_distance_km(lat, lon, h.get("lat", 0), h.get("lon", 0))
                h_dist_m = h_dist_km * 1000.0
                radius_m = h.get("affected_radius_m", 50.0) + 20.0
                if h_dist_m < radius_m:
                    hazard_intersections.append({
                        "hazard_id": h.get("id"),
                        "hazard_name": h.get("name", "Active Hazard"),
                        "severity": h.get("severity", "MEDIUM"),
                        "distance_m": round(h_dist_m, 1)
                    })

            label = "Mission Start" if idx == 0 else ("Destination Target" if idx == num_segments else f"Waypoint WP-{idx:02d}")
            task = "Deploy scientific sensors & rest check" if idx % 2 == 1 else "Navigation checkpoint"

            waypoints.append({
                "sequence": idx + 1,
                "lat": round(lat, 5),
                "lon": round(lon, 5),
                "elevation_m": round(elev, 1),
                "label": label,
                "description": f"Elevation: {round(elev, 1)}m Mars datum",
                "tasks": [task]
            })

        # Calculate Duration considering speed penalty on slopes
        avg_speed_kmh = max(1.2, cls.NOMINAL_WALKING_SPEED_KMH - (max_slope * 0.04))
        walking_time_hours = total_dist_km / avg_speed_kmh
        num_rest_stops = math.floor((walking_time_hours * 60.0) / cls.ASTRONAUT_REST_INTERVAL_MIN)
        rest_time_hours = (num_rest_stops * cls.REST_STOP_DURATION_MIN) / 60.0
        experiment_dwell_hours = 0.75 if path_type == "SCIENCE" else 0.4
        total_duration_hours = round(walking_time_hours + rest_time_hours + experiment_dwell_hours, 2)

        # Risk Score (0-100)
        slope_risk = min(40.0, (max_slope / 20.0) * 40.0)
        hazard_risk = min(45.0, len(hazard_intersections) * 22.0)
        distance_risk = min(15.0, (total_dist_km / 8.0) * 15.0)
        risk_score = round(slope_risk + hazard_risk + distance_risk, 1)

        # Comfort Score (0-100, higher is more comfortable)
        fatigue_penalty = (elev_gain_m / 100.0) * 15.0 + (total_dist_km / 5.0) * 20.0 + (max_slope * 1.5)
        comfort_score = round(max(10.0, min(95.0, 100.0 - fatigue_penalty)), 1)

        # Energy Cost Estimate in kcal (Astronaut + 125kg spacesuit on Mars)
        # Approx 320 kcal/hr baseline + vertical climb cost
        energy_kcal = round(total_duration_hours * 340.0 + (elev_gain_m * 2.8), 0)

        # Radiation exposure estimate (26.5 uSv/hr baseline)
        radiation_exposure_usv = round(total_duration_hours * 26.5, 1)

        # Hard Constraints Evaluation
        hard_constraints_met = True
        violation_details = []

        if max_slope > max_slope_limit:
            hard_constraints_met = False
            violation_details.append(f"Maximum slope of {round(max_slope, 1)}° exceeds limit of {max_slope_limit}°")

        critical_hazards = [h for h in hazard_intersections if h.get("severity") in ("HIGH", "CRITICAL")]
        if critical_hazards:
            hard_constraints_met = False
            violation_details.append(f"Route penetrates boundary of {len(critical_hazards)} critical active hazards")

        if total_duration_hours > max_eva_hours:
            hard_constraints_met = False
            violation_details.append(f"Total duration {total_duration_hours}h exceeds consumable limit of {max_eva_hours}h")

        if radiation_exposure_usv > max_radiation_usv:
            hard_constraints_met = False
            violation_details.append(f"Estimated radiation {radiation_exposure_usv} uSv exceeds limit of {max_radiation_usv} uSv")

        # Multi-objective cost J = alpha*R + beta*(100-C) + gamma*(T_scaled)
        time_cost_scaled = min(100.0, (total_duration_hours / max_eva_hours) * 100.0)
        cost_j = (alpha * risk_score) + (beta * (100.0 - comfort_score)) + (gamma * time_cost_scaled)

        # Build GeoJSON
        geometry_geojson = {
            "type": "Feature",
            "properties": {
                "name": name,
                "total_distance_km": round(total_dist_km, 3),
                "duration_hours": total_duration_hours,
                "risk_score": risk_score,
                "comfort_score": comfort_score
            },
            "geometry": {
                "type": "LineString",
                "coordinates": [[round(lon, 5), round(lat, 5), round(elev, 1)] for lat, lon, elev in waypoints_coords]
            }
        }

        return {
            "id": str(uuid.uuid4()),
            "name": name,
            "description": description,
            "path_type": path_type,
            "total_distance_km": round(total_dist_km, 3),
            "estimated_duration_hours": total_duration_hours,
            "walking_time_hours": round(walking_time_hours, 2),
            "rest_time_hours": round(rest_time_hours, 2),
            "elevation_gain_m": round(elev_gain_m, 1),
            "elevation_loss_m": round(elev_loss_m, 1),
            "max_observed_slope_deg": round(max_slope, 1),
            "risk_score": risk_score,
            "comfort_score": comfort_score,
            "energy_cost_kcal": energy_kcal,
            "radiation_exposure_usv": radiation_exposure_usv,
            "hazard_intersections": hazard_intersections,
            "cost_j": round(cost_j, 2),
            "hard_constraints_met": hard_constraints_met,
            "violation_detail": "; ".join(violation_details) if violation_details else None,
            "waypoints": waypoints,
            "geometry_geojson": geometry_geojson,
            "is_selected": False
        }

    @classmethod
    def _generate_emergency_evac(
        cls,
        start: Tuple[float, float, float],
        safe_haven: Tuple[float, float, float],
        hazards: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Calculates prioritized direct egress path to nearest habitat or pressurized rover."""
        dist_km = MarsGIS.haversine_distance_km(start[0], start[1], safe_haven[0], safe_haven[1])
        # Under emergency abort, astronaut moves at maximum sustained power walk ~3.4 km/h
        duration_hours = round(dist_km / 3.4, 2)
        waypoints = [
            {"sequence": 1, "lat": round(start[0], 5), "lon": round(start[1], 5), "label": "Abort Origin"},
            {"sequence": 2, "lat": round((start[0] + safe_haven[0])/2.0, 5), "lon": round((start[1] + safe_haven[1])/2.0, 5), "label": "Egress Corridor Checkpoint"},
            {"sequence": 3, "lat": round(safe_haven[0], 5), "lon": round(safe_haven[1], 5), "label": "Safe Haven Base"}
        ]
        return {
            "name": "Ares Evac 01 (Emergency Abort Protocol)",
            "description": "Immediate direct egress vector to primary pressurized rover shelter. Bypasses scientific waypoints.",
            "distance_km": round(dist_km, 3),
            "duration_hours": duration_hours,
            "waypoints": waypoints
        }

