from typing import Optional, List
from pydantic import BaseModel, EmailStr
from uuid import UUID
from datetime import datetime, date


# Company schemas
class CompanyCreate(BaseModel):
    name: str
    ruc: Optional[str] = None
    address: Optional[str] = None


class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    ruc: Optional[str] = None
    address: Optional[str] = None


class CompanyInDB(CompanyCreate):
    id: UUID
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# User schemas
class UserCreate(BaseModel):
    company_id: UUID
    role: str = "supervisor"
    name: str
    phone: Optional[str] = None


class UserUpdate(BaseModel):
    role: Optional[str] = None
    name: Optional[str] = None
    phone: Optional[str] = None


class UserInDB(UserCreate):
    id: UUID
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Project schemas
class ProjectCreate(BaseModel):
    company_id: UUID
    name: str
    code: Optional[str] = None
    client: Optional[str] = None
    location: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    budget: Optional[float] = 0
    status: str = "planificación"


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    client: Optional[str] = None
    location: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    budget: Optional[float] = None
    status: Optional[str] = None


class ProjectInDB(ProjectCreate):
    id: UUID
    wbs_code: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Response schemas
class APIResponse(BaseModel):
    success: bool
    message: str
    data: Optional[dict] = None
    
    class Config:
        from_attributes = True


class ErrorResponse(BaseModel):
    success: bool
    error: str
    detail: Optional[str] = None
    
    class Config:
        from_attributes = True