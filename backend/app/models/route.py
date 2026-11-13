import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Float, Boolean, JSON, ForeignKey, Text
from app.database.base import Base
from app.database.guid import GUID


class Route(Base):
    __tablename__ = "routes"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    mission_id = Column(GUID, ForeignKey("missions.id"), nullable=False, index=True)
    constraints = Column(JSON, default=dict)  # RouteConstraints JSON
    selected_candidate_id = Column(GUID, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class RouteCandidate(Base):
    __tablename__ = "route_candidates"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    route_id = Column(GUID, ForeignKey("routes.id"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)

    # Waypoints stored as JSON array [{sequence, lat, lon, elevation_m, label, description, tasks}]
    waypoints = Column(JSON, default=list)

    # Full route geometry as GeoJSON Feature/LineString
    geometry_geojson = Column(JSON, nullable=True)

    total_distance_km = Column(Float, default=0.0)
    estimated_duration_hours = Column(Float, default=0.0)
    risk_score = Column(Float, default=50.0)   # 0–100
    comfort_score = Column(Float, default=50.0) # 0–100
    energy_cost_estimate = Column(Float, default=0.0)
    hazard_count = Column(Float, default=0)
    is_selected = Column(Boolean, default=False)

    # Constraint checks and reasoning
    hard_constraints_met = Column(Boolean, default=True)
    rejection_reason = Column(Text, nullable=True)
    selection_rationale = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
