import uuid
from uuid import UUID
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.wbs import Activity
from app.models.supervision import DailyLog
from app.schemas.supervision import DailyLogCreate, DailyLogInDB

router = APIRouter(tags=["Phase 4: Supervision - Parte diario"])


def _to_in_db(d: DailyLog) -> DailyLogInDB:
    return DailyLogInDB(
        id=d.id,
        project_id=d.project_id,
        activity_id=d.activity_id,
        log_date=d.log_date,
        progress_percent=d.progress_percent,
        note=d.note,
        photo_url=d.photo_url,
        reported_by=d.reported_by,
        created_at=d.created_at,
    )


def _apply_progress(db: Session, activity_id: UUID, progress: int):
    a = db.query(Activity).filter(
        Activity.id == activity_id,
        Activity.is_deleted == False,  # noqa: E712
    ).first()
    if not a:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Activity not found")
    a.progress_percent = progress
    if progress >= 100:
        a.progress_percent = 100
        a.status = "completada"
    elif progress > 0 and a.status == "planificada":
        a.status = "en_progreso"
    elif progress == 0:
        a.status = "planificada"
    return a


@router.post("/daily-logs/", response_model=DailyLogInDB, status_code=status.HTTP_201_CREATED)
async def create_daily_log(data: DailyLogCreate, db: Session = Depends(get_db)):
    act = db.query(Activity).filter(
        Activity.id == data.activity_id,
        Activity.is_deleted == False,  # noqa: E712
    ).first()
    if not act:
        raise HTTPException(status_code=404, detail="Activity not found")
    if act.project_id != data.project_id:
        raise HTTPException(status_code=422, detail="La actividad no pertenece a esa obra")
    d = DailyLog(
        id=uuid.uuid4(),
        project_id=data.project_id,
        activity_id=data.activity_id,
        log_date=data.log_date,
        progress_percent=data.progress_percent,
        note=data.note,
        photo_url=data.photo_url,
        reported_by=data.reported_by,
    )
    db.add(d)
    _apply_progress(db, data.activity_id, data.progress_percent)
    db.commit()
    db.refresh(d)
    return _to_in_db(d)


@router.get("/daily-logs/", response_model=list[DailyLogInDB])
async def list_daily_logs(
    project_id: UUID,
    activity_id: Optional[UUID] = None,
    db: Session = Depends(get_db),
):
    q = db.query(DailyLog).filter(DailyLog.project_id == project_id)
    if activity_id:
        q = q.filter(DailyLog.activity_id == activity_id)
    rows = q.order_by(DailyLog.log_date.desc(), DailyLog.created_at.desc()).limit(200).all()
    return [_to_in_db(d) for d in rows]


@router.delete("/daily-logs/{log_id}")
async def delete_daily_log(log_id: UUID, db: Session = Depends(get_db)):
    d = db.query(DailyLog).filter(DailyLog.id == log_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Log not found")
    activity_id = d.activity_id
    db.delete(d)
    db.commit()
    # Recalcula al último parte restante (o 0 si no quedan)
    last = db.query(DailyLog).filter(DailyLog.activity_id == activity_id).order_by(
        DailyLog.log_date.desc(), DailyLog.created_at.desc()
    ).first()
    _apply_progress(db, activity_id, last.progress_percent if last else 0)
    db.commit()
    return {"success": True, "message": "Parte eliminado"}
