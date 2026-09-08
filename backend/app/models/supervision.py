from sqlalchemy import Column, String, Text, Date, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from app.models.base import TimeStampedModel


class DailyLog(TimeStampedModel):
    """Parte diario de campo: avance reportado por actividad (Fase 4 mínima)."""

    __tablename__ = "daily_logs"

    project_id = Column(PGUUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    activity_id = Column(PGUUID(as_uuid=True), ForeignKey("activities.id", ondelete="CASCADE"), nullable=False)
    log_date = Column(Date, nullable=False)
    progress_percent = Column(Integer, nullable=False, default=0)
    note = Column(Text, nullable=True)
    photo_url = Column(Text, nullable=True)
    reported_by = Column(PGUUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    def __repr__(self):
        return f"DailyLog(activity={self.activity_id}, date={self.log_date}, progress={self.progress_percent}%)"
