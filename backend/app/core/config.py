import os
from dotenv import load_dotenv

load_dotenv()

# Supabase Configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

# Application Configuration
APP_NAME = os.getenv("APP_NAME", "OBRA360")
APP_ENV = os.getenv("APP_ENV", "development")

# Session settings
SESSION_COOKIE_NAME = "obra360_session"