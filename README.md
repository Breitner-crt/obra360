# 🏗️ OBRA360 - Sistema de Planificación, Supervisión y Control de Obras

Aplicación web integral para empresas constructoras, combinando las mejores características de Microsoft Project con herramientas específicas para la construcción.

## 🎯 Visión General

**Principio fundamental:** "PLANIFICAR UNA VEZ Y ACTUALIZAR LA OBRA DESDE EL CAMPO"

La información ingresada por el supervisor alimenta automáticamente el cronograma, avance, costos y dashboard.

---

## 📐 Arquitectura

```
OBRA360/
├── backend/          # FastAPI + Python
│   ├── app/          # Código fuente
│   │   ├── main.py           # Entry point
│   │   ├── core/             # Configuración
│   │   ├── models/           # SQLAlchemy models
│   │   ├── schemas/          # Pydantic schemas
│   │   └── api/              # Rutas API v1
├── supabase/         # Base de datos y storage
│   └── migrations/       # SQL migrations
├── frontend/         # Next.js + React (por definir)
└── .env              # Variables de entorno
```

---

## 🗄️ Base de Datos (Supabase)

### Tablas creadas en Phase 1:

| Tabla | Descripción |
|-------|-------------|
| `companies` | Empresas constructoras |
| `users` | Usuarios con roles (admin, gerente, supervisor, bodega, consulta) |
| `projects` | Obras/proyectos con WBS, status, presupuesto |
| `activities` | Ítems WBS jerárquicos (parent_id, wbs_code auto, avance %) |
| `activity_dependencies` | Dependencias FS/SS/FF/SF con lag entre actividades |

### Row Level Security (RLS):

- Cada empresa solo ve sus propios datos (filtrado por `company_id`)
- Las políticas de role-based access (admin/gerente/supervisor) se manejan en el backend FastAPI

### Migraciones:

- `supabase/migrations/20240101_initial.sql` - Migración Fase 1

---

## 🐍 Backend FastAPI

### Requisitos previos:

```bash
# Instalar dependencias
pip install fastapi uvicorn sqlalchemy pydantic supabase python-dotenv

# Opcional: Para TypeScript/React frontend
# npm install next react react-dom
```

### Ejecutar backend:

```bash
# Desde la carpeta backend/
cd backend

# Iniciar servidor con auto-recarga
uvicorn app.main:app --reload

# Acceder en: http://localhost:8000
# Documentación automática: http://localhost:8000/docs
```

### Endpoints Fase 1:

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/` | Raíz de la API |
| `GET` | `/health` | Health check |
| `POST` | `/api/v1/companies/` | Crear empresa |
| `GET` | `/api/v1/companies/` | Listar empresas |
| `GET` | `/api/v1/companies/{id}` | Obtener empresa |
| `POST` | `/api/v1/users/` | Crear usuario |
| `GET` | `/api/v1/users/` | Listar usuarios por empresa |
| `POST` | `/api/v1/projects/` | Crear obra |
| `GET` | `/api/v1/projects/` | Listar obras de empresa |
| `GET` | `/api/v1/projects/{id}` | Obtener obra |
| `GET` | `/api/v1/check/` | Verificar API |
| `POST/GET` | `/api/v1/activities/` | Crear/listar actividades de obra |
| `GET` | `/api/v1/activities/tree` | Árbol WBS jerárquico |
| `GET/PUT/DELETE` | `/api/v1/activities/{id}` | Ver/actualizar/eliminar actividad |
| `POST/GET` | `/api/v1/dependencies/` | Crear/listar dependencias FS/SS/FF/SF |
| `GET` | `/api/v1/projects/{id}/progress` | Avance ponderado de la obra |

### Autenticación:

- Usa Supabase Auth (email/password, Google, etc.)
- El `APP_CURRENT_COMPANY_ID` se establece en el frontend tras login
- RLS policies aseguran aislamiento por empresa

---

## ⚙️ Variables de Entorno (.env)

Crea un archivo `.env` en la raíz del proyecto:

```env
# Supabase
SUPABASE_URL=tu_proyecto_supabase_url
SUPABASE_ANON_KEY=tu_anon_key_supabase
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key

# Application
APP_NAME=OBRA360
APP_ENV=development

# Database (opcional, usa Supabase URL por encima)
DATABASE_URL=postgresql://postgres:postgres@db.obra360.supabase.com:5432/postgres
```

---

## 📦 Estructura de Archivos

```
obra360/
├── README.md                  # Esta documentación
├── .env                       # Configuración (NO commitear credenciales!)
├── backend/                   # FastAPI Python
│   ├── app/
│   │   ├── main.py           # Entry point FastAPI
│   │   ├── core/
│   │   │   ├── config.py     # Variables de entorno
│   │   │   └── database.py   # SQLAlchemy engine + SessionLocal
│   │   ├── models/
│   │   │   ├── base.py       # TimeStampedModel base
│   │   │   ├── company.py    # Company, User, Project models
│   │   │   └── ...           # Más modelos por fase
│   │   ├── schemas/
│   │   │   ├── company.py    # Pydantic schemas
│   │   │   └── ...           # Más schemas por fase
│   │   └── api/
│   │       └── v1/
│   │           ├── routes.py # CRUD endpoints Phase 1
│   │           └── __init__.py # Router principal
│   └── tests/                # Pruebas (por definir)
├── supabase/
│   ├── migrations/
│   │   └── 20240101_initial.sql  # Migración Fase 1 (tabla + RLS)
│   └── seed.sql              # Datos iniciales (por definir)
└── frontend/                 # Next.js/React (por definir)
```

---

## 🛠️ Fases de Desarrollo

OBRA360 se está construyendo en 8 fases:

| Fase | Enfoque | Status |
|------|---------|--------|
| **FASE 1** | Autenticación + Empresas + Obras + Dashboard | ✅ **Completado** |
| FASE 2 | WBS + Actividades + Dependencias + Gantt | ✅ **Completado** |
| FASE 3 | Recursos (Personal + Materiales + Maquinaria) | 📋 Por iniciar |
| FASE 4 | Supervisión + Registro Diario + Bitácora | 📋 Por iniciar |
| FASE 5 | Costos + Presupuesto + Compras | 📋 Por iniciar |
| FASE 6 | Control Avanzado + Línea Base + Ruta Crítica | 📋 Por iniciar |
| FASE 7 | Reportes + PDF/Excel + Exportación | 📋 Por iniciar |
| FASE 8 | NLU + Generación Automática + Alertas Inteligentes | 📋 Por iniciar |

---

## 🚀 Primeros Pasos

### 1. Configurar Supabase

1. Ve a [supabase.io](https://supabase.io) y crea una cuenta
2. Crea un nuevo proyecto
3. Ve a **SQL Editor** y ejecuta:
   ```sql
   -- Ejecutar el archivo: supabase/migrations/20240101_initial.sql
   ```
4. Ve a **Authentication** y configura métodos de login (email/password, Google)
5. Ve a **Settings > API** y copia las claves `SUPABASE_URL` y `SUPABASE_ANON_KEY`

### 2. Configurar Variables de Entorno

```bash
cp .env.example .env
# Edita .env con tus credenciales de Supabase
```

### 3. Ejecutar Backend

```bash
cd backend
pip install -r requirements.txt  # O manual: fastapi uvicorn sqlalchemy pydantic supabase python-dotenv
uvicorn app.main:app --reload
```

### 4. Probar API

Accede a la documentación automática:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

---

## 📡 API Documentation

Una vez corriendo el backend, explora los endpoints en:

```
http://localhost:8000/docs
```

Muestra todos los endpoints disponibles con parámetros y respuestas de ejemplo.

---

## 👥 Roles y Permisos

| Rol | Permisos |
|-----|----------|
| **admin** | Acceso completo a todas las funcionalidades de su empresa |
| **gerente** | Obras, costos, cronograma y reportes |
| **supervisor** | Avance, bitácora, fotografías, personal y materiales |
| **bodega** | Control de materiales y movimientos |
| **consulta** | Solo lectura de datos |

---

## 📱 Roadmap Futuro

Después de Phase 1, el desarrollo continúa con:

1. **Gantt interactivo** - Componente visual de cronograma
2. **Registro móvil** - Para supervisores en campo
3. **Curva S y Ruta Crítica** - Análisis de desempeño
4. **Reportes automáticos** - PDF, Excel, integraciones
5. **Plantillas de obra** - Vivienda, edificio, vial, etc.
6. **Lenguaje natural** - Registro rápido por texto ("Hoy excavaron 35 m³")

---

## 🤝 Contribuir

1. Fork el repositorio
2. Crea tu rama (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Añadir nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

---

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Ver el archivo `LICENSE` para más detalles.

---

## 📞 Contacto

Para soporte o consultas, abre un issue en el repositorio o contacta al equipo de desarrollo.

---

**OBRA360** - Transformando la construcción con tecnología inteligente 🏗️✨