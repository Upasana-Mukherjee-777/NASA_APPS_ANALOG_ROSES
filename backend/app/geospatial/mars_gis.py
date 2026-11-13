import math
from typing import Dict, List, Tuple, Any


class MarsGIS:
    """Martian Planetary GIS and coordinate calculation engine.
    Uses Martian Mean Radius R = 3389.5 km.
    """
    MARS_RADIUS_KM = 3389.5

    # Jezero Crater landmark coordinates
    JEZERO_LANDMARKS = {
        "JEZERO_BASE_CAMP": {"lat": 18.3800, "lon": 77.5800, "elevation_m": -2530, "name": "Base Camp Perseverance"},
        "DELTA_SCARP": {"lat": 18.4200, "lon": 77.5200, "elevation_m": -2480, "name": "Western Delta Front Scarp"},
        "KODIAK_BUTTE": {"lat": 18.3500, "lon": 77.5500, "elevation_m": -2490, "name": "Kodiak Butte Isolated Mesa"},
        "BELVA_CRATER": {"lat": 18.4800, "lon": 77.4600, "elevation_m": -2350, "name": "Belva Impact Crater"},
        "NERETVA_VALLIS": {"lat": 18.5200, "lon": 77.3800, "elevation_m": -2310, "name": "Neretva Vallis Inflow Channel"},
        "SEITAH_TERRAIN": {"lat": 18.3900, "lon": 77.6200, "elevation_m": -2560, "name": "Séítah Fractured Rough Terrain"},
        "OCTAVIA_BUTLER_LANDING": {"lat": 18.4447, "lon": 77.4508, "elevation_m": -2570, "name": "Octavia E. Butler Landing Site"},
    }

    @classmethod
    def haversine_distance_km(cls, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Great-circle distance between two points on Mars in kilometers."""
        phi1 = math.radians(lat1)
        phi2 = math.radians(lat2)
        delta_phi = math.radians(lat2 - lat1)
        delta_lambda = math.radians(lon2 - lon1)

        a = math.sin(delta_phi / 2.0) ** 2 + \
            math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
        c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))

        return cls.MARS_RADIUS_KM * c

    @classmethod
    def calculate_bearing(cls, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Initial compass bearing from point 1 to point 2 in degrees (0–360)."""
        phi1 = math.radians(lat1)
        phi2 = math.radians(lat2)
        delta_lambda = math.radians(lon2 - lon1)

        y = math.sin(delta_lambda) * math.cos(phi2)
        x = math.cos(phi1) * math.sin(phi2) - math.sin(phi1) * math.cos(phi2) * math.cos(delta_lambda)
        bearing = math.degrees(math.atan2(y, x))
        return (bearing + 360.0) % 360.0

    @classmethod
    def destination_point(cls, lat: float, lon: float, distance_km: float, bearing_deg: float) -> Tuple[float, float]:
        """Calculate destination point given start, distance and bearing."""
        delta = distance_km / cls.MARS_RADIUS_KM
        theta = math.radians(bearing_deg)
        phi1 = math.radians(lat)
        lambda1 = math.radians(lon)

        phi2 = math.asin(math.sin(phi1) * math.cos(delta) + math.cos(phi1) * math.sin(delta) * math.cos(theta))
        lambda2 = lambda1 + math.atan2(
            math.sin(theta) * math.sin(delta) * math.cos(phi1),
            math.cos(delta) - math.sin(phi1) * math.sin(phi2)
        )
        return (math.degrees(phi2), (math.degrees(lambda2) + 180) % 360 - 180)

    @classmethod
    def get_elevation_m(cls, lat: float, lon: float) -> float:
        """Synthetic MOLA elevation model calibrated around Jezero Crater (approx -2500m basin floor)."""
        # Jezero crater center approx (18.38 N, 77.58 E)
        center_lat, center_lon = 18.38, 77.58
        dist_km = cls.haversine_distance_km(lat, lon, center_lat, center_lon)

        # Crater basin is bowl-shaped with diameter ~45km, rim height rises to -2200m, floor at -2580m
        base_elevation = -2580.0
        if dist_km < 22.0:
            # Inside crater basin
            rim_factor = (dist_km / 22.0) ** 2.2 * 300.0
            # Add delta slope on west (lon < 77.55)
            delta_boost = 90.0 * max(0.0, (77.58 - lon) * 10.0) if lon < 77.58 else 0.0
            # Local undulating ripples
            micro_topo = 8.0 * math.sin(lat * 80.0) * math.cos(lon * 80.0)
            return round(base_elevation + rim_factor + delta_boost + micro_topo, 1)
        else:
            # Crater rim and outer plateau
            outer_elevation = -2250.0 + min(200.0, (dist_km - 22.0) * 15.0)
            micro_topo = 15.0 * math.sin(lat * 50.0) * math.cos(lon * 50.0)
            return round(outer_elevation + micro_topo, 1)

    @classmethod
    def calculate_slope_deg(cls, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Slope angle in degrees between two adjacent coordinates."""
        dist_km = cls.haversine_distance_km(lat1, lon1, lat2, lon2)
        dist_m = max(dist_km * 1000.0, 1.0)
        elev1 = cls.get_elevation_m(lat1, lon1)
        elev2 = cls.get_elevation_m(lat2, lon2)
        delta_h = abs(elev2 - elev1)
        slope_rad = math.atan(delta_h / dist_m)
        return round(math.degrees(slope_rad), 2)

