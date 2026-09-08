from typing import Optional
from uuid import UUID
from datetime import datetime, date
from pydantic import BaseModel, Field


class DailyLogCreate(BaseModel):
    project_id: UUID
    activity_id: UUID
    log_date: date
    progress_percent: int = Field(ge=0, le=100)
    note: Optional[str] = None
    photo_url: Optional[str] = None
    reported_by: Optional[UUID] = None


class DailyLogUpdate(BaseModel):
    progress_percent: Optional[int] = Field(default=None, ge=0, le=100)
    note: Optional[str] = None
    photo_url: Optional[str] = None


class DailyLogInDB(DailyLogCreate):
    id: UUID
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
