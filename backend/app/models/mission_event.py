import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Float, Boolean, JSON, ForeignKey, Text
from app.database.base import Base
from app.database.guid import GUID


class MissionEvent(Base):
    __tablename__ = "mission_events"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    mission_id = Column(GUID, ForeignKey("missions.id"), nullable=False, index=True)
    event_type = Column(String(100), nullable=False)  # OBSERVATION_RECORDED, HAZARD_DETECTED, ROUTE_RECALCULATED, EXPERIMENT_ALERT, APPROVAL_REQUEST, DIGITAL_TWIN_UPDATED
    severity = Column(String(50), default="INFO")  # INFO, WARNING, HAZARD, CRITICAL
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    details = Column(JSON, default=dict)
    lat = Column(Float, nullable=True)
    lon = Column(Float, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
