import enum
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Enum, DateTime, Float, Boolean, JSON, ForeignKey, Text
from app.database.base import Base
from app.database.guid import GUID


class ObservationCategory(str, enum.Enum):
    TEMPERATURE = "TEMPERATURE"
    PRESSURE = "PRESSURE"
    RADIATION = "RADIATION"
    TERRAIN = "TERRAIN"
    DUST = "DUST"
    GEOLOGICAL = "GEOLOGICAL"
    ATMOSPHERIC = "ATMOSPHERIC"
    BIOLOGICAL = "BIOLOGICAL"
    MECHANICAL = "MECHANICAL"
    VISUAL = "VISUAL"
    SEISMIC = "SEISMIC"


class ObservationType(str, enum.Enum):
    POINT = "POINT"
    AREA = "AREA"
    PATH = "PATH"


class DataSource(str, enum.Enum):
    OBSERVED = "OBSERVED"
    DERIVED = "DERIVED"
    SIMULATED = "SIMULATED"


class Observation(Base):
    __tablename__ = "observations"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    mission_id = Column(GUID, ForeignKey("missions.id"), nullable=False, index=True)
    observer_id = Column(GUID, ForeignKey("users.id"), nullable=True)

    category = Column(Enum(ObservationCategory), nullable=False)
    observation_type = Column(Enum(ObservationType), default=ObservationType.POINT)
    data_source = Column(Enum(DataSource), default=DataSource.OBSERVED)

    # Stored value (numeric or JSON for complex readings)
    value_numeric = Column(Float, nullable=True)
    value_json = Column(JSON, nullable=True)
    unit = Column(String(50), nullable=True)

    confidence = Column(Float, default=1.0)  # 0.0–1.0

    # Geospatial
    lat = Column(Float, nullable=False)
    lon = Column(Float, nullable=False)
    elevation_m = Column(Float, nullable=True)

    timestamp = Column(DateTime, nullable=False, default=datetime.utcnow)
    metadata_ = Column("metadata", JSON, default=dict)
    tags = Column(JSON, default=list)

    is_anomaly = Column(Boolean, default=False)
    anomaly_score = Column(Float, nullable=True)
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
