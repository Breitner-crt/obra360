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

# Usar Supabase Postgres via SQLAlchemy.
# IMPORTANTE serverless/local sin IPv6: NO uses la conexión directa
# db.xxx.supabase.co:5432 (da OperationalError "Cannot assign requested address"
# porque resuelve a IPv6). Usa el Transaction Pooler puerto 6543:
# Supabase > Settings > Database > Connection string > Transaction pooler.
# Acepta DATABASE_URL o DATABASE_POOLER_URL (preferida si existe).
_pooler_url = os.getenv("DATABASE_POOLER_URL") or os.getenv("SUPABASE_DB_POOLER_URL")
SQLALCHEMY_DATABASE_URL = (
    _pooler_url
    or os.getenv("DATABASE_URL")
    or "postgresql://postgres:postgres@db.obra360.supabase.com:5432/postgres"
)

_is_pooler = ":6543" in SQLALCHEMY_DATABASE_URL or "pooler.supabase" in SQLALCHEMY_DATABASE_URL

# Supabase entrega el pooler con ?pgbouncer=true&connection_limit=1 que
# psycopg2 no entiende -> se remueven, SQLAlchemy ya usa NullPool arriba.
def _clean_url(url: str) -> str:
    try:
        from urllib.parse import urlsplit, urlunsplit, parse_qsl, urlencode

        parts = urlsplit(url)
        if not parts.query:
            return url
        q = [(k, v) for k, v in parse_qsl(parts.query) if k not in ("pgbouncer", "connection_limit")]
        return urlunsplit((parts.scheme, parts.netloc, parts.path, urlencode(q), parts.fragment))
    except Exception:
        return url


SQLALCHEMY_DATABASE_URL = _clean_url(SQLALCHEMY_DATABASE_URL)

# En serverless (Vercel) o con pgbouncer (6543) no reutilizar conexiones:
# NullPool evita agotar el pool y errores de prepared statements.
_use_null_pool = bool(os.getenv("VERCEL")) or _is_pooler
_engine_kwargs = (
    {"poolclass": NullPool}
    if _use_null_pool
    else {"pool_size": 5, "max_overflow": 10}
)

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_pre_ping=True,
    connect_args={"sslmode": "require", "connect_timeout": 10},
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