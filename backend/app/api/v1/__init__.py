from fastapi import APIRouter

from app.api.v1.routes import router as v1_router
from app.api.v1.auth import router as auth_router

# Router principal v1. main.py lo monta con prefix="/api/v1",
# por lo que aqui NO se agrega prefijo extra para evitar /api/v1/api/v1.
api_router = APIRouter()

api_router.include_router(v1_router)
api_router.include_router(auth_router)