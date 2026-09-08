import os
from pathlib import Path
from dotenv import load_dotenv

# Carga .env desde la raiz del proyecto (C:\OBRA360\.env)
# aunque uvicorn se ejecute desde backend/
ROOT_DIR = Path(__file__).resolve().parents[3]
load_dotenv(ROOT_DIR / ".env")
load_dotenv()  # fallback a .env local / variables Vercel

# Supabase Configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

# Application Configuration
APP_NAME = os.getenv("APP_NAME", "OBRA360")
APP_ENV = os.getenv("APP_ENV", "development")

# Session settings
SESSION_COOKIE_NAME = "obra360_session"