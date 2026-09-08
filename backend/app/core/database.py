import os
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.pool import NullPool

# Carga .env aquí también: este módulo crea el engine al importarse y puede
# cargarse antes que app.core.config (que también carga el .env).
ROOT_DIR = Path(__file__).resolve().parents[3]
load_dotenv(ROOT_DIR / ".env")
load_dotenv()

# Usar Supabase con PostgreSQL mediante la conexión direct SQLAlchemy
# Formato: postgresql://postterrors:password@db.xxx.supabase.com:5432/postgres
SQLALCHEMY_DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql://postgres:postgres@db.obra360.supabase.com:5432/postgres"
)

# En serverless (Vercel) no se reutilizan conexiones entre invocaciones:
# NullPool evita agotar el pool de Supabase.
_engine_kwargs = (
    {"poolclass": NullPool}
    if os.getenv("VERCEL")
    else {"pool_size": 5, "max_overflow": 10}
)

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_pre_ping=True,
    **_engine_kwargs,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()