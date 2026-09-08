from sqlalchemy import Column, String, Text, DECIMAL, Date
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from app.models.base import TimeStampedModel


class Company(TimeStampedModel):
    __tablename__ = "companies"

    name = Column(String(255), nullable=False)
    ruc = Column(String(20), nullable=True, unique=True)
    address = Column(Text, nullable=True)

    def __repr__(self):
        return f"Company(id={self.id}, name={self.name})"


class User(TimeStampedModel):
    __tablename__ = "users"

    company_id = Column(PGUUID(as_uuid=True), nullable=False)
    role = Column(String(50), nullable=False, default="supervisor")
    name = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)

    def __repr__(self):
        return f"User(id={self.id}, name={self.name}, role={self.role})"


class Project(TimeStampedModel):
    __tablename__ = "projects"

    company_id = Column(PGUUID(as_uuid=True), nullable=False)
    name = Column(String(255), nullable=False)
    code = Column(String(50), nullable=True)
    client = Column(String(255), nullable=True)
    location = Column(Text, nullable=True)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    budget = Column(DECIMAL(15, 2), nullable=True, default=0)
    status = Column(String(50), nullable=False, default="planificación")
    wbs_code = Column(String(100), nullable=True)

    def __repr__(self):
        return f"Project(id={self.id}, name={self.name}, status={self.status})"