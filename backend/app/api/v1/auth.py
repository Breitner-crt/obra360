from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from typing import Optional
import uuid

from supabase import create_client, Client
from pydantic import BaseModel

# Configuración Supabase (desde entorno, sin hardcodear)
import os
from app.core.config import SUPABASE_URL, SUPABASE_ANON_KEY

def _get_supabase():
    if not SUPABASE_URL or not SUPABASE_ANON_KEY:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Faltan SUPABASE_URL / SUPABASE_ANON_KEY en el servidor (revisa .env o Variables de Vercel)",
        )
    return create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

router = APIRouter(prefix="/auth", tags=["Authentication"])


# Modelos Pydantic
class UserLogin(BaseModel):
    email: str
    password: str


class UserRegister(BaseModel):
    email: str
    password: str
    confirm_password: str
    name: str
    phone: Optional[str] = None


class UserInfo(BaseModel):
    id: str
    email: str
    name: Optional[str] = None
    phone: Optional[str] = None
    role: str = "supervisor"
    company_id: Optional[str] = None


# Endpoint: Login con Supabase Auth
@router.post("/login", response_model=UserInfo)
async def login(user_credentials: UserLogin):
    """
    Iniciar sesión con Supabase Auth (email/password).
    Returns user JWT token and info.
    """
    try:
        supabase = _get_supabase()
        # Authenticate with Supabase
        auth_response = supabase.auth.sign_in_with_password({
            "email": user_credentials.email,
            "password": user_credentials.password
        })
        
        user_data = auth_response.user
        
        # Get user's companies/projects to determine role/company
        # This is simplified - in production, check user metadata or profiles table
        user_info = UserInfo(
            id=user_data.id,
            email=user_data.email,
            name=user_data.user_metadata.get("name") if user_data.user_metadata else None,
            phone=user_data.user_metadata.get("phone") if user_data.user_metadata else None,
            role=get_user_role(user_data.id),  # Function to determine role
            company_id=get_user_company(user_data.id)  # Function to determine company
        )
        
        return user_info
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales inválidas",
            headers={"WWW-Authenticate": "Bearer"},
        )


# Endpoint: Register nuevo usuario
@router.post("/register", response_model=UserInfo, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegister):
    """
    Registrar nuevo usuario con Supabase Auth.
    """
    try:
        if user_data.password != user_data.confirm_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Las contraseñas no coinciden"
            )
        
        auth_response = _get_supabase().auth.sign_up({
            "email": user_data.email,
            "password": user_data.password,
            "user_metadata": {
                "name": user_data.name,
                "phone": user_data.phone or ""
            }
        })
        
        user_info = UserInfo(
            id=auth_response.user.id,
            email=auth_response.user.email,
            name=user_data.name,
            phone=user_data.phone,
            role="supervisor",  # Default role - admin assigns later
            company_id=None  # Will be assigned by admin
        )
        
        return user_info
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


# Endpoint: Logout
@router.post("/logout")
async def logout():
    """
    Cerrar sesión actual.
    """
    try:
        _get_supabase().auth.sign_out()
        return {"message": "Sesión cerrada correctamente"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al cerrar sesión"
        )


# Endpoint: Obtener usuario actual
@router.get("/me", response_model=UserInfo)
async def get_current_user(
    # token: str = Depends(oauth2_scheme)  # Se usaría con seguridad JWT
):
    """
    Obtener información del usuario actual desde la sesión Supabase.
    """
    try:
        # Get current user from session
        user = _get_supabase().auth.get_user()
        
        if not user.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="No autenticado"
            )
        
        return UserInfo(
            id=user.user.id,
            email=user.user.email,
            name=user.user.user_metadata.get("name") if user.user.user_metadata else None,
            phone=user.user.user_metadata.get("phone") if user.user.user_metadata else None,
            role=get_user_role(user.user.id),
            company_id=get_user_company(user.user.id)
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sesión expirada o inválida"
        )


# Helper functions to determine role and company
def get_user_role(user_id: str) -> str:
    """
    Determinar el rol del usuario basándose en la base de datos.
    En Phase 1, esto se asigna manualmente o por default.
    """
    # Por defecto, todos los usuarios autenticados tienen acceso básico
    # El rol específico se gestiona en el frontend y RLS policies
    return "supervisor"  # Default


def get_user_company(user_id: str) -> Optional[str]:
    """
    Obtener el company_id asociado al usuario.
    Se busca en la tabla users de OBRA360.
    """
    try:
        # Query the users table to find company_id
        supabase = _get_supabase()
        response = supabase.table("users").select("company_id").eq("id", user_id).single().execute()
        if response.data:
            return response.data.get("company_id")
    except:
        pass
    return None


# Endpoint: Verificar estado de auth
@router.get("/status")
async def auth_status():
    """
    Verificar si hay sesión activa.
    """
    try:
        user = _get_supabase().auth.get_user()
        if user.user:
            return {"authenticated": True, "user_id": user.user.id}
        return {"authenticated": False}
    except:
        return {"authenticated": False}