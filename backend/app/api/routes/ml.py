from fastapi import APIRouter
from pydantic import BaseModel
from app.ml.trained_models import ml_suite

router = APIRouter(prefix="/ml", tags=["Machine Learning Pipelines"])


class TerrainClassifySchema(BaseModel):
    mean_reflectance: float = 0.38
    roughness_std: float = 0.28
    edge_density: float = 0.45
    slope_deg: float = 7.0


class RiskPredictSchema(BaseModel):
    slope_deg: float = 8.5
    hazard_count: int = 2
    radiation_usv_hr: float = 28.0
    dust_tau: float = 0.52
    fatigue_score: float = 35.0


@router.post("/terrain-classify")
async def classify_terrain(payload: TerrainClassifySchema):
    """Model A: Optical/Morphometric Terrain Classification."""
    result = ml_suite.predict_terrain(
        reflectance=payload.mean_reflectance,
        roughness=payload.roughness_std,
        edge_density=payload.edge_density,
        slope_deg=payload.slope_deg
    )
    return result


@router.post("/risk-predict")
async def predict_risk(payload: RiskPredictSchema):
    """Model C: Multi-Factor Mission Risk Regression."""
    result = ml_suite.predict_risk(
        slope_deg=payload.slope_deg,
        hazard_count=payload.hazard_count,
        rad_usv=payload.radiation_usv_hr,
        dust_tau=payload.dust_tau,
        fatigue_score=payload.fatigue_score
    )
    return result


@router.get("/metrics")
async def get_model_evaluation_metrics():
    """Returns verified evaluation metrics across all four trained ML models."""
    return ml_suite.get_all_evaluation_metrics()

