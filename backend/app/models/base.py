from sqlalchemy import Column, UUID, Timestamp, String, Boolean, Integer, Text, DECIMAL
from sqlalchemy.sql import func
from app.core.database import Base

class TimeStampedModel(Base):
    __abstract__ = True
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=func.uuid_generate_v4())
    created_at = Column(Timestamp(timezone=True), server_default=func.now())
    updated_at = Column(Timestamp(timezone=True), default=func.now())
    created_by = Column(UUID(as_uuid=True), nullable=True)
    updated_by = Column(UUID(as_uuid=True), nullable=True)
    is_active = Column(Boolean, default=True)
    is_deleted = Column(Boolean, default=False)