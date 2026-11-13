import enum
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Enum, DateTime, Float, Boolean, JSON, ForeignKey, Text, Integer
from app.database.base import Base
from app.database.guid import GUID


class ExperimentClass(str, enum.Enum):
    GEOLOGICAL_SAMPLING = "GEOLOGICAL_SAMPLING"
    ATMOSPHERIC_ANALYSIS = "ATMOSPHERIC_ANALYSIS"
    BIOLOGY_ASTROBIOLOGY = "BIOLOGY_ASTROBIOLOGY"
    PHYSICS_MEASUREMENT = "PHYSICS_MEASUREMENT"
    ENGINEERING_TEST = "ENGINEERING_TEST"
    IMAGING_SURVEY = "IMAGING_SURVEY"
    THERMAL_ANALYSIS = "THERMAL_ANALYSIS"
    SEISMIC_MONITORING = "SEISMIC_MONITORING"


class ExperimentStatus(str, enum.Enum):
    PLANNED = "PLANNED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    SKIPPED = "SKIPPED"
    FAILED = "FAILED"


class ExperimentPriority(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class InterventionClass(str, enum.Enum):
    CLASS_A = "CLASS_A"  # Autonomous Execution
    CLASS_B = "CLASS_B"  # Supervised Execution
    CLASS_C = "CLASS_C"  # Human Approval Required
    CLASS_D = "CLASS_D"  # Stop and Reassess


class Experiment(Base):
    __tablename__ = "experiments"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    mission_id = Column(GUID, ForeignKey("missions.id"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    experiment_class = Column(Enum(ExperimentClass), nullable=False)

    # Location
    lat = Column(Float, nullable=False)
    lon = Column(Float, nullable=False)
    elevation_m = Column(Float, nullable=True)

    planned_start_time = Column(DateTime, nullable=False, default=datetime.utcnow)
    planned_duration_minutes = Column(Integer, default=30)
    actual_start_time = Column(DateTime, nullable=True)
    actual_end_time = Column(DateTime, nullable=True)

    status = Column(Enum(ExperimentStatus), default=ExperimentStatus.PLANNED)
    priority = Column(Enum(ExperimentPriority), default=ExperimentPriority.MEDIUM)

    # AI Classification & Intervention
    intervention_class = Column(Enum(InterventionClass), default=InterventionClass.CLASS_B)
    risk_score = Column(Float, default=25.0)  # 0–100
    classification_explanation = Column(Text, nullable=True)
    contributing_factors = Column(JSON, default=list)
    recommended_precautions = Column(JSON, default=list)

    # Human Approval workflow
    requires_human_approval = Column(Boolean, default=False)
    is_approved = Column(Boolean, default=False)
    approved_by = Column(String(255), nullable=True)
    approved_at = Column(DateTime, nullable=True)
    approval_notes = Column(Text, nullable=True)

    equipment_required = Column(JSON, default=list)
    safety_requirements = Column(JSON, default=list)
    expected_outputs = Column(JSON, default=list)
    actual_outputs = Column(JSON, nullable=True)
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
