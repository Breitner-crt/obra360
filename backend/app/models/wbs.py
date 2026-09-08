from sqlalchemy import Column, String, Text, DECIMAL, Date, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from app.models.base import TimeStampedModel


class Activity(TimeStampedModel):
    __tablename__ = "activities"

    project_id = Column(PGUUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    parent_id = Column(PGUUID(as_uuid=True), ForeignKey("activities.id", ondelete="CASCADE"), nullable=True)
    wbs_code = Column(String(100), nullable=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(50), nullable=False, default="planificada")
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    duration_days = Column(Integer, nullable=True)
    progress_percent = Column(Integer, nullable=False, default=0)
    weight_percent = Column(DECIMAL(5, 2), nullable=False, default=0)
    assigned_to = Column(PGUUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    sort_order = Column(Integer, nullable=False, default=0)

    def __repr__(self):
        return f"Activity(id={self.id}, wbs={self.wbs_code}, name={self.name})"


class ActivityDependency(TimeStampedModel):
    __tablename__ = "activity_dependencies"

    predecessor_id = Column(PGUUID(as_uuid=True), ForeignKey("activities.id", ondelete="CASCADE"), nullable=False)
    successor_id = Column(PGUUID(as_uuid=True), ForeignKey("activities.id", ondelete="CASCADE"), nullable=False)
    dep_type = Column(String(2), nullable=False, default="FS")
    lag_days = Column(Integer, nullable=False, default=0)

    def __repr__(self):
        return f"Dependency({self.predecessor_id} -{self.dep_type}+{self.lag_days}-> {self.successor_id})"
