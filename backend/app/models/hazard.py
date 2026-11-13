import enum
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Enum, DateTime, Float, Boolean, JSON, ForeignKey, Text
from app.database.base import Base
from app.database.guid import GUID


class HazardSeverity(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class HazardSource(str, enum.Enum):
    OBSERVED = "OBSERVED"
    DERIVED = "DERIVED"
    SIMULATED = "SIMULATED"


class Hazard(Base):
    __tablename__ = "hazards"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    mission_id = Column(GUID, ForeignKey("missions.id"), nullable=True, index=True)

    name = Column(String(255), nullable=False)
    description = Column(Text)
    severity = Column(Enum(HazardSeverity), nullable=False, default=HazardSeverity.MEDIUM)
    category = Column(String(100), nullable=False)  # e.g. DUST_STORM, ROCK_FALL, RADIATION_SPIKE

    # Location
    lat = Column(Float, nullable=False)
    lon = Column(Float, nullable=False)
    elevation_m = Column(Float, nullable=True)

    affected_radius_m = Column(Float, default=50.0)
    confidence = Column(Float, default=0.8)  # 0.0–1.0
    source = Column(Enum(HazardSource), default=HazardSource.DERIVED)

    detected_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)

    mitigation_steps = Column(JSON, default=list)
    metadata_ = Column("metadata", JSON, default=dict)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
