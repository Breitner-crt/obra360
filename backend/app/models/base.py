import uuid
from sqlalchemy import Column, String, Boolean, DateTime
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.sql import func
from app.core.database import Base


class TimeStampedModel(Base):
    __abstract__ = True

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())
    created_by = Column(PGUUID(as_uuid=True), nullable=True)
    updated_by = Column(PGUUID(as_uuid=True), nullable=True)
    is_active = Column(Boolean, default=True)
    is_deleted = Column(Boolean, default=False)