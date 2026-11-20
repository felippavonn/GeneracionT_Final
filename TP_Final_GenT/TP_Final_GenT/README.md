# Reserva Club - Club Atlético Villanorte

Sistema web de reservas de canchas deportivas (Fútbol 5, Pádel, Tenis) que reemplaza la gestión manual por WhatsApp, eliminando solapamientos, pérdidas económicas y errores humanos.

---

## 🚀 Estado del Proyecto

| Componente | Estado |
|------------|--------|
| **Documentación** | ✅ Completa (spec, plan, tasks, decisions, glosario) |
| **Base de Datos** | ✅ Schema completo + seeds (`database.sql`) |
| **Backend (API)** | 🟡 **Auth funcional** - Register, Login, Refresh, Logout, Me |
| **Frontend (React)** | 🟡 Estructura + Auth pages + Layouts + UI components |
| **Manuales** | ✅ Técnico + Usuario |

> **Auth endpoints listos para usar**: `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/refresh`, `POST /api/auth/logout`, `GET /api/auth/me`

---

## 📋 Funcionalidades Principales

### Para Usuarios
- 📅 **Disponibilidad en tiempo real** con precios dinámicos
- 🎾 **Reservas** con reglas: anticipación, cupos, recargos pico/fds, descuento socio
- ⏰ **Check-in** ±15 min | **Cancelación** gratis >24h / 50% ≤24h
- 🔔 **Lista de espera** FIFO automática + notificación email + 30 min para confirmar
- 📊 **Historial** de reservas, cancelaciones, inasistencias

### Para Administradores
- ⚙️ **CRUD Canchas** (precios, tipos, estados)
- 👥 **Gestión Usuarios** (roles, cuotas, bloqueos, deudas)
- 📅 **Feriados** y **Franjas Pico** configurables
- 🔧 **Mantenimiento** (bloqueos puntuales/recurrentes)
- 📋 **Auditoría completa** | 📈 **Reportes ocupación**

### Reglas de Negocio Clave (44 RN documentadas)
- Precio histórico inmutable | Concurrencia con advisory locks | Rolling window 30d para inasistencias | Bloqueo auto a 3 inasistencias | Cupos semanales lunes-domingo

---

## 🛠 Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| **Backend** | Node.js 20 + Express + TypeScript + Kysely (type-safe SQL) |
| **Database** | PostgreSQL 16 (Neon serverless) |
| **Auth** | JWT (access 15m + refresh 7d rotativo) + bcrypt cost 12 + HttpOnly cookies |
| **Frontend** | React 18 + Vite + TypeScript + Tailwind CSS + TanStack Query |
| **Testing** | Vitest + Supertest (backend) | Vitest + Testing Library (frontend) |
| **Deploy** | Render (backend) + Netlify (frontend) + Neon (DB) |

---

## 📦 Instalación Rápida

### 1. Clonar y configurar
```bash
git clone https://github.com/tu-usuario/reserva-club.git
cd reserva-club
```

### 2. Base de Datos (Neon recomendado)
```bash
# Opción A: Neon Cloud (gratis)
# 1. Crear project en neon.tech → copiar connection string
# 2. Pegar en backend/.env como DATABASE_URL

# Opción B: PostgreSQL local
createdb reserva_club
psql -d reserva_club -f database.sql
```

### 3. Backend
```bash
cd backend
cp .env.example .env
# Editar .env con DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET, FRONTEND_URL
npm install
npm run db:migrate  # Ejecuta migraciones + seeds
npm run dev         # http://localhost:3000
```

### 4. Frontend
```bash
cd frontend
cp .env.example .env
# Verificar VITE_API_URL=http://localhost:3000/api
npm install
npm run dev         # http://localhost:5173
```

---

## 🔐 Credenciales de Prueba

| Usuario | Email | Password | Rol |
|---------|-------|----------|-----|
| **Admin** | admin@club.com | Admin123! | admin |

> El registro crea usuarios **No Socio**. Admin cambia a **Socio** en panel Usuarios.

---

## 📁 Estructura del Repositorio

```
reserva-club/
├── docs/                    # Documentación completa
│   ├── spec.md             # Especificación formal (44 RN, 26 HU Gherkin, 15 EC)
│   ├── plan.md             # Arquitectura, modelo BD, API contracts, roadmap
│   ├── tasks.md            # 32 tareas atómicas con dependencias
│   ├── decisions.md        # 11 decisiones de negocio (D01-D11)
│   ├── glosario.md         # 40+ términos definidos
│   └── preguntas_abiertas.md # 11 riesgos/pendientes (PA01-PA11)
├── database.sql            # Schema completo + índices + seeds + funciones
├── MANUAL_TECNICO.md       # Instalación, config, deploy, troubleshooting
├── MANUAL_USUARIO.md       # Guía para socios, no socios, admins
├── AGENTS.md               # Reglamento metodológico (Specification-First, TDD)
├── .cursor/rules/          # 6 subagentes (analista, arquitecto, backend, frontend, tester, revisor)
├── backend/
│   ├── src/
│   │   ├── config/         # env.ts, constants.ts
│   │   ├── domain/         # enums, entities (tipos puros)
│   │   ├── data/           # repositories, database, migrations
│   │   ├── services/       # auth, clock, email (lógica negocio)
│   │   ├── controllers/    # HTTP handlers
│   │   ├── middleware/     # auth, rate-limit, validation, errors
│   │   ├── routes/         # Express routers
│   │   ├── utils/          # errors, helpers
│   │   ├── app.ts          # Express factory
│   │   └── server.ts       # Entry point
│   └── tests/              # Unit + Integration tests
└── frontend/
    ├── src/
    │   ├── api/            # Axios + TanStack Query hooks
    │   ├── components/ui/  # Button, Input, Modal, Toast, Badge
    │   ├── hooks/          # useAuth, useToast
    │   ├── layout/         # PublicLayout, AuthLayout, AdminLayout
    │   ├── pages/          # Home, Login, Register, MisReservas, ListaEspera, Admin
    │   └── styles/         # Tailwind globals
    └── ...
```

---

## 🧪 Testing

```bash
# Backend
cd backend
npm run test           # Todos los tests
npm run test:watch     # Modo watch
npm run test:coverage  # Cobertura (objetivo services >90%)

# Frontend
cd frontend
npm run test
```

---

## 🚀 Despliegue Producción

| Servicio | Plataforma | Config |
|----------|------------|--------|
| **Backend** | Render | Build: `npm ci && npm run build` · Start: `npm run start` |
| **Frontend** | Netlify | Build: `npm ci && npm run build` · Publish: `dist` |
| **Database** | Neon | Branch `main` · Connection string en `DATABASE_URL` |

Variables de entorno en paneles de cada proveedor (nunca en repo).

---

## 📚 Documentación Clave

- **Especificación completa**: `docs/spec.md`
- **Arquitectura y decisiones**: `docs/plan.md`
- **Plan de trabajo**: `docs/tasks.md`
- **Manual técnico**: `MANUAL_TECNICO.md`
- **Manual usuario**: `MANUAL_USUARIO.md`

---

## 📄 Licencia

Proyecto académico - Club Atlético Villanorte - 2025