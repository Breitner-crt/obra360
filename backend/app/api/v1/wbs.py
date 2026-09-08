import uuid
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.wbs import Activity, ActivityDependency
from app.schemas.wbs import (
    ActivityCreate, ActivityUpdate, ActivityInDB, ActivityNode,
    DependencyCreate, DependencyInDB, ProjectProgress,
    VALID_STATUS, VALID_DEP_TYPES,
)

router = APIRouter(tags=["Phase 2: WBS + Activities + Dependencies"])


def _to_in_db(a: Activity) -> ActivityInDB:
    return ActivityInDB(
        id=a.id,
        project_id=a.project_id,
        parent_id=a.parent_id,
        wbs_code=a.wbs_code,
        name=a.name,
        description=a.description,
        status=a.status,
        start_date=a.start_date,
        end_date=a.end_date,
        duration_days=a.duration_days,
        progress_percent=a.progress_percent,
        weight_percent=float(a.weight_percent or 0),
        assigned_to=a.assigned_to,
        sort_order=a.sort_order,
        created_at=a.created_at,
        updated_at=a.updated_at,
    )


def _next_wbs_code(db: Session, project_id: UUID, parent_id: UUID | None) -> str:
    q = db.query(Activity).filter(
        Activity.project_id == project_id,
        Activity.is_deleted == False,  # noqa: E712
    )
    q = q.filter(Activity.parent_id == parent_id) if parent_id else q.filter(Activity.parent_id.is_(None))
    n = q.count() + 1
    if not parent_id:
        return f"{n:02d}"
    parent = db.query(Activity).filter(Activity.id == parent_id).first()
    base = parent.wbs_code if parent and parent.wbs_code else "01"
    return f"{base}.{n}"


def _get_activity(db: Session, activity_id: UUID) -> Activity:
    a = db.query(Activity).filter(
        Activity.id == activity_id,
        Activity.is_deleted == False,  # noqa: E712
    ).first()
    if not a:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Activity not found")
    return a


# --- ACTIVITIES ---
@router.post("/activities/", response_model=ActivityInDB, status_code=status.HTTP_201_CREATED)
async def create_activity(data: ActivityCreate, db: Session = Depends(get_db)):
    if data.status not in VALID_STATUS:
        raise HTTPException(status_code=422, detail=f"status debe ser uno de {VALID_STATUS}")
    if data.parent_id:
        parent = _get_activity(db, data.parent_id)
        if parent.project_id != data.project_id:
            raise HTTPException(status_code=422, detail="El padre pertenece a otra obra")
    a = Activity(
        id=uuid.uuid4(),
        project_id=data.project_id,
        parent_id=data.parent_id,
        wbs_code=_next_wbs_code(db, data.project_id, data.parent_id),
        name=data.name,
        description=data.description,
        status=data.status,
        start_date=data.start_date,
        end_date=data.end_date,
        duration_days=data.duration_days,
        progress_percent=data.progress_percent,
        weight_percent=data.weight_percent,
        assigned_to=data.assigned_to,
        sort_order=data.sort_order,
    )
    db.add(a)
    db.commit()
    db.refresh(a)
    return _to_in_db(a)


@router.get("/activities/", response_model=list[ActivityInDB])
async def list_activities(project_id: UUID, db: Session = Depends(get_db)):
    rows = db.query(Activity).filter(
        Activity.project_id == project_id,
        Activity.is_deleted == False,  # noqa: E712
    ).order_by(Activity.sort_order, Activity.wbs_code).all()
    return [_to_in_db(a) for a in rows]


@router.get("/activities/tree", response_model=list[ActivityNode])
async def activity_tree(project_id: UUID, db: Session = Depends(get_db)):
    rows = db.query(Activity).filter(
        Activity.project_id == project_id,
        Activity.is_deleted == False,  # noqa: E712
    ).order_by(Activity.sort_order, Activity.wbs_code).all()
    nodes = {a.id: ActivityNode(**_to_in_db(a).model_dump(), children=[]) for a in rows}
    roots: list[ActivityNode] = []
    for a in rows:
        node = nodes[a.id]
        if a.parent_id and a.parent_id in nodes:
            nodes[a.parent_id].children.append(node)
        else:
            roots.append(node)
    return roots


@router.get("/activities/{activity_id}", response_model=ActivityInDB)
async def get_activity(activity_id: UUID, db: Session = Depends(get_db)):
    return _to_in_db(_get_activity(db, activity_id))


@router.put("/activities/{activity_id}", response_model=ActivityInDB)
async def update_activity(activity_id: UUID, data: ActivityUpdate, db: Session = Depends(get_db)):
    a = _get_activity(db, activity_id)
    if data.status is not None and data.status not in VALID_STATUS:
        raise HTTPException(status_code=422, detail=f"status debe ser uno de {VALID_STATUS}")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(a, key, value)
    if data.status == "completada":
        a.progress_percent = 100
    db.commit()
    db.refresh(a)
    return _to_in_db(a)


@router.delete("/activities/{activity_id}")
async def delete_activity(activity_id: UUID, db: Session = Depends(get_db)):
    a = _get_activity(db, activity_id)
    a.is_deleted = True
    db.commit()
    return {"success": True, "message": "Actividad eliminada"}


# --- DEPENDENCIES ---
@router.post("/dependencies/", response_model=DependencyInDB, status_code=status.HTTP_201_CREATED)
async def create_dependency(data: DependencyCreate, db: Session = Depends(get_db)):
    if data.dep_type not in VALID_DEP_TYPES:
        raise HTTPException(status_code=422, detail=f"dep_type debe ser uno de {VALID_DEP_TYPES}")
    if data.predecessor_id == data.successor_id:
        raise HTTPException(status_code=422, detail="Una actividad no puede depender de sí misma")
    pred = _get_activity(db, data.predecessor_id)
    succ = _get_activity(db, data.successor_id)
    if pred.project_id != succ.project_id:
        raise HTTPException(status_code=422, detail="Ambas actividades deben ser de la misma obra")
    exists = db.query(ActivityDependency).filter(
        ActivityDependency.predecessor_id == data.predecessor_id,
        ActivityDependency.successor_id == data.successor_id,
    ).first()
    if exists:
        raise HTTPException(status_code=409, detail="La dependencia ya existe")
    d = ActivityDependency(
        id=uuid.uuid4(),
        predecessor_id=data.predecessor_id,
        successor_id=data.successor_id,
        dep_type=data.dep_type,
        lag_days=data.lag_days,
    )
    db.add(d)
    db.commit()
    db.refresh(d)
    return DependencyInDB(
        id=d.id, predecessor_id=d.predecessor_id, successor_id=d.successor_id,
        dep_type=d.dep_type, lag_days=d.lag_days,
    )


@router.get("/dependencies/", response_model=list[DependencyInDB])
async def list_dependencies(project_id: UUID, db: Session = Depends(get_db)):
    rows = db.query(ActivityDependency).join(
        Activity, Activity.id == ActivityDependency.successor_id
    ).filter(
        Activity.project_id == project_id,
        Activity.is_deleted == False,  # noqa: E712
    ).all()
    return [
        DependencyInDB(
            id=d.id, predecessor_id=d.predecessor_id, successor_id=d.successor_id,
            dep_type=d.dep_type, lag_days=d.lag_days,
        )
        for d in rows
    ]


@router.delete("/dependencies/{dependency_id}")
async def delete_dependency(dependency_id: UUID, db: Session = Depends(get_db)):
    d = db.query(ActivityDependency).filter(ActivityDependency.id == dependency_id).first()
    if not d:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dependency not found")
    db.delete(d)
    db.commit()
    return {"success": True, "message": "Dependencia eliminada"}


# --- PROJECT PROGRESS (avance ponderado por weight_percent) ---
@router.get("/projects/{project_id}/progress", response_model=ProjectProgress)
async def project_progress(project_id: UUID, db: Session = Depends(get_db)):
    rows = db.query(Activity).filter(
        Activity.project_id == project_id,
        Activity.is_deleted == False,  # noqa: E712
        Activity.is_active == True,  # noqa: E712
    ).all()
    total = len(rows)
    completed = sum(1 for a in rows if a.status == "completada")
    weights = [float(a.weight_percent or 0) for a in rows]
    if total == 0:
        progress = 0.0
    elif sum(weights) > 0:
        progress = sum(a.progress_percent * w for a, w in zip(rows, weights)) / sum(weights)
    else:
        progress = sum(a.progress_percent for a in rows) / total
    return ProjectProgress(
        project_id=project_id,
        progress_percent=round(progress, 2),
        total_activities=total,
        completed_activities=completed,
    )
