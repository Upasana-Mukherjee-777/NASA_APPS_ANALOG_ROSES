import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Float, Boolean, JSON, Text
from app.database.base import Base
from app.database.guid import GUID


class DatasetMetadata(Base):
    __tablename__ = "dataset_metadata"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    category = Column(String(50), nullable=False)  # OPTICAL, THERMAL, SPECTRAL, TOPOGRAPHIC, GEOPHYSICAL, ATMOSPHERIC, RADIATION, CHEMICAL
    source_agency = Column(String(100), default="NASA / JPL / USGS")
    instrument = Column(String(100), nullable=False)  # e.g., "HiRISE", "THEMIS", "CRISM", "MOLA", "RAD", "APXS", "REMS"
    mission = Column(String(100), nullable=False)     # e.g., "MRO", "Mars Odyssey", "Mars Science Laboratory", "Mars 2020"
    acquisition_date = Column(String(100), nullable=False)
    spatial_coverage = Column(String(255), nullable=False)
    resolution = Column(String(100), nullable=False)
    units = Column(String(50), nullable=False)
    processing_method = Column(Text, nullable=False)
    data_limitations = Column(Text, nullable=False)
    provenance_type = Column(String(50), default="OBSERVED")  # OBSERVED, DERIVED, SIMULATED
    is_available = Column(Boolean, default=True)
    layer_config = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)
