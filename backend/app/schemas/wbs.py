from typing import Optional, List
from uuid import UUID
from datetime import datetime, date
from pydantic import BaseModel, Field


VALID_STATUS = ("planificada", "en_progreso", "completada", "detenida", "cancelada")
VALID_DEP_TYPES = ("FS", "SS", "FF", "SF")


# --- Activities ---
class ActivityCreate(BaseModel):
    project_id: UUID
    parent_id: Optional[UUID] = None
    name: str
    description: Optional[str] = None
    status: str = "planificada"
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    duration_days: Optional[int] = Field(default=None, ge=0)
    progress_percent: int = Field(default=0, ge=0, le=100)
    weight_percent: float = Field(default=0, ge=0, le=100)
    quantity: float = Field(default=0, ge=0)
    unit: Optional[str] = None
    unit_cost: float = Field(default=0, ge=0)
    assigned_to: Optional[UUID] = None
    sort_order: int = 0


class ActivityUpdate(BaseModel):
    parent_id: Optional[UUID] = None
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    duration_days: Optional[int] = Field(default=None, ge=0)
    progress_percent: Optional[int] = Field(default=None, ge=0, le=100)
    weight_percent: Optional[float] = Field(default=None, ge=0, le=100)
    quantity: Optional[float] = Field(default=None, ge=0)
    unit: Optional[str] = None
    unit_cost: Optional[float] = Field(default=None, ge=0)
    assigned_to: Optional[UUID] = None
    sort_order: Optional[int] = None


class ActivityInDB(ActivityCreate):
    id: UUID
    wbs_code: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ActivityNode(ActivityInDB):
    children: List["ActivityNode"] = []


ActivityNode.model_rebuild()


# --- Dependencies ---
class DependencyCreate(BaseModel):
    predecessor_id: UUID
    successor_id: UUID
    dep_type: str = "FS"
    lag_days: int = 0


class DependencyInDB(DependencyCreate):
    id: UUID

    class Config:
        from_attributes = True


# --- Project progress ---
class ProjectProgress(BaseModel):
    project_id: UUID
    progress_percent: float
    total_activities: int
    completed_activities: int
