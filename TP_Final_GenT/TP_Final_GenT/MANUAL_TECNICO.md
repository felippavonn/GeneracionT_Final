# Manual Técnico - Reserva Club
## Club Atlético Villanorte

> Guía de instalación, configuración y despliegue para desarrolladores

---

## 1. Requisitos Previos

| Herramienta | Versión Mínima |
|-------------|----------------|
| Node.js | 20 LTS |
| npm | 10+ |
| PostgreSQL | 16 (o Neon Cloud) |
| Git | 2.40+ |

---

## 2. Instalación Local

### 2.1 Clonar repositorio
```bash
git clone https://github.com/tu-usuario/reserva-club.git
cd reserva-club
```

### 2.2 Backend
```bash
cd backend
cp .env.example .env
# Editar .env con tus credenciales (ver sección 3)
npm install
npm run db:migrate  # Ejecuta migraciones + seeds
npm run dev         # Levanta en http://localhost:3000
```

### 2.3 Frontend
```bash
cd frontend
cp .env.example .env
# Editar VITE_API_URL si backend no está en localhost:3000
npm install
npm run dev         # Levanta en http://localhost:5173
```

---

## 3. Variables de Entorno

### Backend (`.env`)
```env
# Base de datos (Neon o local)
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require

# JWT (generar con: openssl rand -base64 32)
JWT_SECRET=tu_secret_32_chars_minimo
JWT_REFRESH_SECRET=otro_secret_diferente_32_chars

# URLs
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:3000
PORT=3000

# Email (dev: ethereal / console)
EMAIL_ADAPTER=ethereal

# Entorno
NODE_ENV=development
TZ=America/Argentina/Buenos_Aires
```

### Frontend (`.env`)
```env
VITE_API_URL=http://localhost:3000/api
VITE_FRONTEND_URL=http://localhost:5173
```

---

## 4. Base de Datos

### Opción A: Neon (Recomendado - Gratis)
1. Crear cuenta en [neon.tech](https://neon.tech)
2. Crear project → copiar connection string
3. Pegar en `DATABASE_URL`

### Opción B: PostgreSQL Local
```bash
# Crear DB
createdb reserva_club

# Ejecutar schema completo
psql -d reserva_club -f ../database.sql
```

### Migraciones
```bash
cd backend
npm run db:migrate  # Ejecuta migraciones pendientes en orden
```

---

## 5. Scripts Disponibles

### Backend
| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Desarrollo con hot reload (tsx watch) |
| `npm run build` | Compila TypeScript a `dist/` |
| `npm run start` | Ejecuta `dist/server.js` (producción) |
| `npm run test` | Tests unitarios + integración (Vitest) |
| `npm run test:watch` | Tests en modo watch |
| `npm run test:coverage` | Tests con reporte de cobertura |
| `npm run typecheck` | `tsc --noEmit` solo tipos |
| `npm run lint` | ESLint + Prettier |
| `npm run db:migrate` | Ejecuta migraciones SQL |

### Frontend
| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Vite dev server (HMR) |
| `npm run build` | Build producción en `dist/` |
| `npm run preview` | Preview build local |
| `npm run test` | Tests (Vitest + Testing Library) |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint |

---

## 6. Estructura del Proyecto

```
reserva-club/
├── docs/                 # Documentación completa
│   ├── spec.md          # Especificación formal (44 RN, 26 HU)
│   ├── plan.md          # Arquitectura técnica
│   ├── tasks.md         # 32 tareas atómicas
│   └── ...
├── database.sql         # Schema completo + seeds
├── backend/
│   ├── src/
│   │   ├── config/      # env, constants
│   │   ├── domain/      # enums, entities (tipos puros)
│   │   ├── data/        # Repositories, DB, migrations
│   │   ├── services/    # Lógica de negocio (RN)
│   │   ├── controllers/ # HTTP handlers
│   │   ├── middleware/  # Auth, rate limit, validation, errors
│   │   ├── routes/      # Express routers
│   │   ├── utils/       # Errors, helpers
│   │   ├── app.ts       # Express factory
│   │   └── server.ts    # Entry point
│   └── tests/           # Unit + Integration tests
└── frontend/
    ├── src/
    │   ├── api/         # Axios + TanStack Query hooks
    │   ├── components/  # UI primitives (Button, Modal, etc)
    │   ├── hooks/       # useAuth, useToast
    │   ├── layout/      # PublicLayout, AuthLayout, AdminLayout
    │   ├── pages/       # Páginas por ruta
    │   └── styles/      # Tailwind globals
    └── ...
```

---

## 7. API Endpoints Implementados

### Autenticación (`/api/auth`)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/register` | Registro usuario (devuelve cookies HttpOnly) |
| POST | `/login` | Login (devuelve cookies HttpOnly) |
| POST | `/refresh` | Renueva access token (rotación refresh) |
| POST | `/logout` | Cierra sesión (revoca refresh token) |
| GET | `/me` | Perfil usuario autenticado |

### Próximos (pendientes)
- `/api/canchas` - Listado, detalle, disponibilidad
- `/api/reservas` - CRUD reservas, check-in, cancelación
- `/api/listas-espera` - Unirse, confirmar, listar
- `/api/admin/*` - Panel admin completo

---

## 8. Testing

```bash
# Backend
cd backend
npm run test           # Corre todos los tests
npm run test:watch     # Modo watch
npm run test:coverage  # Con cobertura (objetivo services >90%)

# Frontend
cd frontend
npm run test
```

---

## 9. Despliegue Producción

### Backend → Render
1. Conectar repo GitHub
2. Build: `npm ci && npm run build`
3. Start: `npm run start`
4. Env vars en panel Render (ver sección 3)

### Frontend → Netlify
1. Conectar repo
2. Build: `npm ci && npm run build`
3. Publish: `dist`
3. Env var: `VITE_API_URL=https://tu-backend.onrender.com/api`

### DB → Neon
- Usar branch `main` o `production`
- Connection string en `DATABASE_URL` del backend

---

## 10. Credenciales de Prueba

| Usuario | Email | Password | Rol |
|---------|-------|----------|-----|
| Admin | admin@club.com | Admin123! | admin |

*Registro crea usuarios con rol `no_socio` por defecto. Admin puede cambiar a `socio` en panel admin.*

---

## 11. Troubleshooting

| Error | Solución |
|-------|----------|
| `DATABASE_URL` inválida | Verificar connection string, SSL mode, credenciales |
| JWT_SECRET muy corto | Mínimo 32 chars: `openssl rand -base64 32` |
| CORS error | `FRONTEND_URL` debe coincidir exactamente (incluye puerto) |
| Cookies no se envían | `withCredentials: true` en axios, `credentials: true` en CORS |
| Migraciones fallan | Verificar que DB está vacía o migraciones ya aplicadas |

---

## 12. Contacto / Soporte

- **Repositorio**: https://github.com/tu-usuario/reserva-club
- **Documentación completa**: `docs/spec.md` + `docs/plan.md`
- **Issues**: GitHub Issues para bugs/features