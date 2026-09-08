from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.api.v1 import api_router

app = FastAPI(
    title="OBRA360 API",
    version="1.0.0",
    description="Sistema de Planificación, Supervisión y Control de Obras - OBRA360"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API routes (Phase 1: Companies, Users, Projects + Auth)
# api_router ya incluye routes + auth, se monta una sola vez en /api/v1
app.include_router(api_router, prefix="/api/v1")

# Dependency: Get current user from Supabase session
def get_current_user():
    """
    Dependency to get the current authenticated user from Supabase session.
    In production, this would validate the JWT token from the Authorization header.
    For now, it reads from the session stored in Supabase.
    """
    try:
        from supabase import create_client
        import os
        
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_anon_key = os.getenv("SUPABASE_ANON_KEY")
        supabase = create_client(supabase_url, supabase_anon_key)
        
        user = supabase.auth.get_user()
        if not user.user:
            return None
        return user.user
    except Exception:
        return None

def get_current_company_id():
    """
    Obtener el company_id del usuario actual desde la sesión.
    Este es el key que usaremos en las políticas RLS de Supabase.
    """
    user = get_current_user()
    if not user:
        return None
    
    # Obtener company_id desde la tabla users de nuestra base de datos
    # O desde el user_metadata de Supabase
    company_id = getattr(user, 'user_metadata', {}).get('company_id')
    if not company_id:
        # Buscar en la tabla users
        try:
            # Esta consulta dependerá de cómo conectemos a la BD
            pass
        except:
            pass
    
    return company_id or "default-company-id"

@app.get("/")
async def root():
    return {"message": "OBRA360 API - Bienvenido", "version": "1.0.0", "status": "authenticated" if get_current_user() else "not_authenticated"}

@app.get("/health")
async def health_check():
    user = get_current_user()
    return {
        "status": "healthy", 
        "service": "obra360-api",
        "authenticated": user is not None,
        "user_id": user.id if user else None
    }

@app.get("/api/v1/me")
async def get_me(
    user = Depends(get_current_user)
):
    """
    Endpoint para obtener la información del usuario actual.
    Requiere autenticación via Supabase session.
    """
    if not user:
        raise HTTPException(
            status_code=401,
            detail="No autenticado"
        )
    
    from supabase import create_client
    import os
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_anon_key = os.getenv("SUPABASE_ANON_KEY")
    supabase = create_client(supabase_url, supabase_anon_key)
    
    db_user = supabase.table("users").select("*").eq("id", user.id).single().execute()
    
    return {
        "id": user.id,
        "email": user.email,
        "name": user.user_metadata.get("name") if user.user_metadata else None,
        "phone": user.user_metadata.get("phone") if user.user_metadata else None,
        "company_id": db_user.data.get("company_id") if db_user.data else None,
        "role": db_user.data.get("role") if db_user.data else "supervisor"
    }