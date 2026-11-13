from typing import List, Dict, Any
from fastapi import APIRouter
from pydantic import BaseModel
from app.geospatial.nasa_layers import NASALayerCatalog
from app.geospatial.mars_gis import MarsGIS

router = APIRouter(prefix="/geospatial", tags=["Planetary GIS & NASA Data Layers"])


class ElevationProfileRequestSchema(BaseModel):
    coordinates: List[List[float]] # [[lat, lon], ...]


@router.get("/layers")
async def get_nasa_layers():
    """Returns the 8 mandatory NASA multimodal planetary data layers
    with full scientific provenance, sensor instrument, resolution, and limitations.
    """
    layers = NASALayerCatalog.get_all_layers()
    return {
        "count": len(layers),
        "categories_covered": [l["category"] for l in layers],
        "layers": layers
    }


@router.get("/landmarks")
async def get_jezero_landmarks():
    """Returns validated scientific landmarks and waypoints in Jezero Crater."""
    return MarsGIS.JEZERO_LANDMARKS


@router.get("/elevation")
async def get_elevation(lat: float, lon: float):
    elev_m = MarsGIS.get_elevation_m(lat, lon)
    return {
        "lat": lat,
        "lon": lon,
        "elevation_m": elev_m,
        "datum": "Mars Areoid (MOLA 0m Datum)",
        "source": "MOLA-HRSC Blended Digital Terrain Model"
    }


@router.post("/elevation-profile")
async def compute_elevation_profile(payload: ElevationProfileRequestSchema):
    profile = []
    total_dist_km = 0.0

    for idx, pt in enumerate(payload.coordinates):
        lat, lon = pt[0], pt[1]
        elev = MarsGIS.get_elevation_m(lat, lon)
        slope = 0.0
        if idx > 0:
            prev_lat, prev_lon = payload.coordinates[idx - 1][0], payload.coordinates[idx - 1][1]
            seg_dist = MarsGIS.haversine_distance_km(prev_lat, prev_lon, lat, lon)
            total_dist_km += seg_dist
            slope = MarsGIS.calculate_slope_deg(prev_lat, prev_lon, lat, lon)

        profile.append({
            "point_index": idx,
            "lat": lat,
            "lon": lon,
            "elevation_m": elev,
            "cumulative_distance_km": round(total_dist_km, 3),
            "local_slope_deg": slope
        })

    return {
        "total_distance_km": round(total_dist_km, 3),
        "elevation_min_m": min(p["elevation_m"] for p in profile),
        "elevation_max_m": max(p["elevation_m"] for p in profile),
        "max_slope_deg": max(p["local_slope_deg"] for p in profile),
        "profile": profile
    }

