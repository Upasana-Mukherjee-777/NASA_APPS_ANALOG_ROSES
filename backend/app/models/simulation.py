import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Float, Boolean, JSON, ForeignKey, Text
from app.database.base import Base
from app.database.guid import GUID


class SimulationRun(Base):
    __tablename__ = "simulation_runs"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    mission_id = Column(GUID, ForeignKey("missions.id"), nullable=True, index=True)
    experiment_id = Column(GUID, ForeignKey("experiments.id"), nullable=True, index=True)
    title = Column(String(255), nullable=False)
    scenario_type = Column(String(100), nullable=False)  # THERMAL_CYCLE, RADIATION_SPIKE, DUST_DEGRADATION, ROVER_MOBILITY, WORKLOAD_FATIGUE

    # Input parameters
    parameters = Column(JSON, default=dict)  # {ambient_temp_c, radiation_msv_hr, dust_tau, slope_deg, distance_m, duration_min}
    initial_conditions = Column(JSON, default=dict)

    # Computed results
    results = Column(JSON, default=dict)  # time-series {time_min: [...], suit_temp: [...], power_w: [...], fatigue_idx: [...], risk_level: [...]}
    summary = Column(JSON, default=dict)   # {max_temp, peak_radiation, success_probability, safety_margin, warnings: []}
    passed_safety_thresholds = Column(Boolean, default=True)

    assumptions = Column(JSON, default=list)
    model_version = Column(String(50), default="1.0-physics-approx")

    created_at = Column(DateTime, default=datetime.utcnow)
