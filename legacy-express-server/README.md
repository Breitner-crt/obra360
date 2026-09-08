# Legacy Express Server (archivado)

Este backend Node + Express quedo archivado el 2026-09-07.

**Backend oficial: FastAPI en `backend/`** (puerto 8000, docs en `/docs`).

No se despliega en Vercel ni se usa en desarrollo.
Se conserva solo como referencia para migrar logica JWT/bcrypt si se necesita.

Para desarrollo usar:
```bash
cd backend
uvicorn app.main:app --reload
```
