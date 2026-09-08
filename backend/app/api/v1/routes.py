from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.config import SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL
from app.schemas.company import (
    CompanyCreate, CompanyUpdate, CompanyInDB,
    UserCreate, UserUpdate, UserInDB,
    ProjectCreate, ProjectUpdate, ProjectInDB,
    APIResponse, ErrorResponse
)
from app.models.company import Company, User, Project

router = APIRouter(tags=["Phase 1: Companies + Projects"])


# --- COMPANIES ENDPOINTS ---

@router.post("/companies/", response_model=CompanyInDB, status_code=status.HTTP_201_CREATED)
async def create_company(
    company_data: CompanyCreate,
    db: Session = Depends(get_db)
):
    """Crear nueva empresa"""
    import uuid
    company_id = uuid.uuid4()
    
    db_company = Company(
        id=company_id,
        name=company_data.name,
        ruc=company_data.ruc,
        address=company_data.address
    )
    db.add(db_company)
    db.commit()
    db.refresh(db_company)
    
    return CompanyInDB(
        id=db_company.id,
        name=db_company.name,
        ruc=db_company.ruc,
        address=db_company.address,
        created_at=db_company.created_at,
        updated_at=db_company.updated_at
    )


@router.get("/companies/", response_model=List[CompanyInDB])
async def list_companies(
    db: Session = Depends(get_db)
):
    """Listar empresas de la empresa actual"""
    companies = db.query(Company).all()
    return [
        CompanyInDB(
            id=c.id,
            name=c.name,
            ruc=c.ruc,
            address=c.address,
            created_at=c.created_at,
            updated_at=c.updated_at
        )
        for c in companies
    ]


@router.get("/companies/{company_id}", response_model=CompanyInDB)
async def get_company(
    company_id: UUID,
    db: Session = Depends(get_db)
):
    """Obtener empresa por ID"""
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found"
        )
    return CompanyInDB(
        id=company.id,
        name=company.name,
        ruc=company.ruc,
        address=company.address,
        created_at=company.created_at,
        updated_at=company.updated_at
    )


# --- USERS ENDPOINTS ---

@router.post("/users/", response_model=UserInDB, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_data: UserCreate,
    db: Session = Depends(get_db)
):
    """Crear nuevo usuario"""
    import uuid
    user_id = uuid.uuid4()
    
    db_user = User(
        id=user_id,
        company_id=user_data.company_id,
        role=user_data.role,
        name=user_data.name,
        phone=user_data.phone
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return UserInDB(
        id=db_user.id,
        company_id=db_user.company_id,
        role=db_user.role,
        name=db_user.name,
        phone=db_user.phone,
        created_at=db_user.created_at,
        updated_at=db_user.updated_at
    )


@router.get("/users/", response_model=List[UserInDB])
async def list_users(
    company_id: UUID,
    db: Session = Depends(get_db)
):
    """Listar usuarios de una empresa"""
    users = db.query(User).filter(User.company_id == company_id).all()
    return [
        UserInDB(
            id=u.id,
            company_id=u.company_id,
            role=u.role,
            name=u.name,
            phone=u.phone,
            created_at=u.created_at,
            updated_at=u.updated_at
        )
        for u in users
    ]


# --- PROJECTS (OBRAS) ENDPOINTS ---

@router.post("/projects/", response_model=ProjectInDB, status_code=status.HTTP_201_CREATED)
async def create_project(
    project_data: ProjectCreate,
    db: Session = Depends(get_db)
):
    """Crear nueva obra/proyecto"""
    import uuid
    project_id = uuid.uuid4()
    
    db_project = Project(
        id=project_id,
        company_id=project_data.company_id,
        name=project_data.name,
        code=project_data.code,
        client=project_data.client,
        location=project_data.location,
        start_date=project_data.start_date,
        end_date=project_data.end_date,
        budget=project_data.budget,
        status=project_data.status,
        wbs_code=f"01.{str(project_id)[:8]}"
    )
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    
    return ProjectInDB(
        id=db_project.id,
        company_id=db_project.company_id,
        name=db_project.name,
        code=db_project.code,
        client=db_project.client,
        location=db_project.location,
        start_date=db_project.start_date,
        end_date=db_project.end_date,
        budget=db_project.budget,
        status=db_project.status,
        wbs_code=db_project.wbs_code,
        created_at=db_project.created_at,
        updated_at=db_project.updated_at
    )


@router.get("/projects/", response_model=List[ProjectInDB])
async def list_projects(
    company_id: UUID,
    db: Session = Depends(get_db)
):
    """Listar obras de una empresa"""
    projects = db.query(Project).filter(Project.company_id == company_id).all()
    return [
        ProjectInDB(
            id=p.id,
            company_id=p.company_id,
            name=p.name,
            code=p.code,
            client=p.client,
            location=p.location,
            start_date=p.start_date,
            end_date=p.end_date,
            budget=p.budget,
            status=p.status,
            wbs_code=p.wbs_code,
            created_at=p.created_at,
            updated_at=p.updated_at
        )
        for p in projects
    ]


@router.get("/projects/{project_id}", response_model=ProjectInDB)
async def get_project(
    project_id: UUID,
    db: Session = Depends(get_db)
):
    """Obtener obra por ID"""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    return ProjectInDB(
        id=project.id,
        company_id=project.company_id,
        name=project.name,
        code=project.code,
        client=project.client,
        location=project.location,
        start_date=project.start_date,
        end_date=project.end_date,
        budget=project.budget,
        status=project.status,
        wbs_code=project.wbs_code,
        created_at=project.created_at,
        updated_at=project.updated_at
    )


@router.put("/projects/{project_id}", response_model=ProjectInDB)
async def update_project(
    project_id: UUID,
    project_data: ProjectUpdate,
    db: Session = Depends(get_db)
):
    """Actualizar obra"""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    update_data = project_data.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(project, key, value)
    
    db.commit()
    db.refresh(project)
    
    return ProjectInDB(
        id=project.id,
        company_id=project.company_id,
        name=project.name,
        code=project.code,
        client=project.client,
        location=project.location,
        start_date=project.start_date,
        end_date=project.end_date,
        budget=project.budget,
        status=project.status,
        wbs_code=project.wbs_code,
        created_at=project.created_at,
        updated_at=project.updated_at
    )


# Root API check
@router.get("/check/", response_model=APIResponse)
async def api_check():
    return APIResponse(
        success=True,
        message="OBRA360 API Phase 1 is running",
        data={"endpoints": ["companies", "users", "projects"]}
    )