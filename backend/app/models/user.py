import enum
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Enum, Boolean, DateTime
from app.database.base import Base
from app.database.guid import GUID


class UserRole(str, enum.Enum):
    COMMANDER = "COMMANDER"
    ASTRONAUT = "ASTRONAUT"
    RESEARCHER = "RESEARCHER"
    ADMIN = "ADMIN"


class User(Base):
    __tablename__ = "users"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255))
    role = Column(Enum(UserRole), default=UserRole.RESEARCHER)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
