import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Float, Boolean, JSON, Text
from app.database.base import Base
from app.database.guid import GUID


class HistoricalIncident(Base):
    __tablename__ = "historical_incidents"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    incident_code = Column(String(50), unique=True, nullable=False, index=True)  # e.g. "NASA-ISS-EVA23-WATER"
    mission = Column(String(100), nullable=False)  # e.g. "ISS Expedition 36", "Apollo 12", "Apollo 17"
    date_occurred = Column(String(50), nullable=False)
    subsystem = Column(String(100), nullable=False)  # "EMU Liquid Cooling", "Helmet Water Separator", "Dust Seal"
    category = Column(String(50), nullable=False, index=True)  # "WATER_LEAK", "DUST_CONTAMINATION", "THERMAL_OVERHEAT", etc.

    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    root_cause = Column(Text, nullable=False)
    consequences = Column(Text, nullable=False)
    corrective_action = Column(Text, nullable=False)
    preventive_lesson = Column(Text, nullable=False)

    source_document = Column(String(255), nullable=False)  # NASA Document title
    source_citation = Column(String(255), nullable=False)  # Report ID, section, page
    source_url = Column(String(500), nullable=True)

    # Experience transferability & applicability
    lesson_type = Column(String(50), default="DIRECT_ENGINEERING")  # DIRECT_ENGINEERING, ANALOGOUS_SPACEFLIGHT, MARS_SPECIFIC
    transferability_limitations = Column(Text, nullable=False)
    applicable_conditions = Column(JSON, default=list)  # ["HIGH_THERMAL_LOAD", "FINE_REGOLITH", "LONG_EVA_DURATION"]

    created_at = Column(DateTime, default=datetime.utcnow)

