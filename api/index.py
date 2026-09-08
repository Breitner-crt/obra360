"""Entry point para Vercel Serverless (Python).

Vercel detecta `api/index.py` y expone `app`.
Reutiliza el backend FastAPI de backend/app/main.py
sin duplicar codigo.
"""
import sys
from pathlib import Path

# Permite `from app.main import app` en Vercel (/var/task/backend)
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))

from app.main import app  # noqa: E402
