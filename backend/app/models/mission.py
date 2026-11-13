import enum
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Enum, DateTime, Float, JSON, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database.base import Base
from app.database.guid import GUID


class MissionStatus(str, enum.Enum):
    PLANNED = "PLANNED"
    ACTIVE = "ACTIVE"
    PAUSED = "PAUSED"
    COMPLETED = "COMPLETED"
    ABORTED = "ABORTED"
    EMERGENCY = "EMERGENCY"


class RiskLevel(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class Mission(Base):
    __tablename__ = "missions"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text)
    status = Column(Enum(MissionStatus), default=MissionStatus.PLANNED, nullable=False)

    commander_id = Column(GUID, ForeignKey("users.id"), nullable=True)
    crew_ids = Column(JSON, default=list)  # list of user UUIDs

    # Location stored as lat/lon floats
    start_lat = Column(Float, nullable=False)
    start_lon = Column(Float, nullable=False)
    start_elevation_m = Column(Float, default=0.0)

    dest_lat = Column(Float, nullable=False)
    dest_lon = Column(Float, nullable=False)
    dest_elevation_m = Column(Float, default=0.0)

    planned_start_time = Column(DateTime, nullable=False, default=datetime.utcnow)
    planned_duration_hours = Column(Float, nullable=False, default=4.0)
    actual_start_time = Column(DateTime, nullable=True)
    actual_end_time = Column(DateTime, nullable=True)

    risk_level = Column(Enum(RiskLevel), default=RiskLevel.LOW)
    active_route_candidate_id = Column(GUID, nullable=True)

    tags = Column(JSON, default=list)
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
