# plan.md - Plan Técnico de Arquitectura
## Reserva Club - Club Atlético Villanorte

> **Versión**: 1.0 | **Estado**: Aprobado para implementación | **Basado en**: `spec.md` v1.0
> **Principio**: Specification-First → Plan → Tasks → Código (TDD)

---

## 1. Visión General de Arquitectura

### 1.1 Estilo Arquitectónico
**Arquitectura en capas (Layered Architecture)** con separación estricta de responsabilidades:
```
┌─────────────────────────────────────┐
│        Frontend (React + TS)        │  ← Capa de Presentación
├─────────────────────────────────────┤
│         API Gateway / Router        │  ← Controladores (HTTP)
├─────────────────────────────────────┤
│          Capa de Servicios          │  ← Reglas de Negocio (RN)
├─────────────────────────────────────┤
│          Capa de Repositorios       │  ← Acceso a Datos (SQL)
├─────────────────────────────────────┤
│       PostgreSQL (Neon Cloud)       │  ← Persistencia
└─────────────────────────────────────┘
```

### 1.2 Stack Tecnológico Definitivo

| Capa | Tecnología | Versión | Justificación |
|------|------------|---------|---------------|
| **Runtime** | Node.js | 20 LTS | Soporte TS nativo, performance, ecosistema |
| **Framework API** | Express.js | 4.18+ | Maduro, middleware rico, compatible TS |
| **Lenguaje** | TypeScript | 5.3+ | Tipado estricto, DX, refactor seguro |
| **BD** | PostgreSQL | 16 | Relacional, ACID, JSONB, row-level locking |
| **ORM/Query Builder** | Kysely | 0.27+ | Type-safe SQL, sin magia, control total |
| **Validación** | Zod | 3.22+ | Schema-first, inferencia TS, runtime + compile-time |
| **Auth** | JWT (jsonwebtoken) | 9.0+ | Estándar, stateless, refresh rotation |
| **Hash** | bcryptjs | 2.4+ | Cost 12, timing-safe |
| **Tests** | Vitest | 1.3+ | Native TS, ESM, rápido, compatible Jest API |
| **Test HTTP** | Supertest | 6.3+ | Integración real Express app |
| **Reloj** | @iainct/clock | custom | Simulación tiempo para tests determinísticos |
| **Email** | Nodemailer (dev: ethereal) | 6.9+ | Desacoplado, swappable provider |
| **Frontend** | React 18 + Vite + TS | 18.2 / 5.1 | SPA moderna, HMR, tree-shaking |
| **UI** | Tailwind CSS + Headless UI | 3.4 / 1.7 | Utility-first, accesible, sin runtime |
| **State** | TanStack Query (React Query) | 5.20+ | Server state, cache, invalidation |
| **Forms** | React Hook Form + Zod | 7.50 / 3.22 | Performante, type-safe validation |
| **Router** | React Router | 6.22+ | Estándar, loaders/actions |
| **Deploy Backend** | Render Free Tier | - | Node.js, auto-deploy GitHub, SSL |
| **Deploy Frontend** | Netlify Free Tier | - | Static + Functions, edge, preview deploys |
| **Deploy DB** | Neon PostgreSQL | - | Serverless, branching, free tier generoso |
| **CI/CD** | GitHub Actions | - | Lint, test, build, deploy automático |

---

## 2. Modelo de Datos - PostgreSQL

### 2.1 Diagrama Entidad-Relación (Mermaid)

```mermaid
erDiagram
    USUARIO ||--o{ RESERVA : "crea"
    USUARIO ||--o{ LISTA_ESPERA : "se_anota"
    USUARIO ||--o{ AUDIT_LOG : "admin_acciones"
    CANCHA ||--o{ RESERVA : "tiene"
    CANCHA ||--o{ LISTA_ESPERA : "para"
    CANCHA ||--o{ BLOQUEO_MANTENIMIENTO : "afecta"
    RESERVA ||--o{ HISTORIAL_PRECIOS : "congela"
    RESERVA ||--o{ LISTA_ESPERA : "libera_slot"
    FERIADO ||--o{ RESERVA : "aplica_recargo"
    FRANJA_PICO ||--o{ RESERVA : "aplica_recargo"

    USUARIO {
        uuid id PK
        string email UK
        string password_hash
        enum rol {admin, socio, no_socio}
        date cuota_vigente_hasta
        timestamp bloqueado_hasta
        decimal deuda_pendiente
        timestamp creado_en
        timestamp actualizado_en
    }

    CANCHA {
        uuid id PK
        string nombre
        enum tipo {futbol5, padel, tenis}
        int duracion_minutos
        decimal precio_base
        boolean activa
        timestamp creado_en
        timestamp actualizado_en
    }

    RESERVA {
        uuid id PK
        uuid usuario_id FK
        uuid cancha_id FK
        date fecha
        time hora_inicio
        int duracion_minutos
        enum estado {pendiente_pago, confirmada, en_espera_confirmacion, cancelada_gratis, cancelada_con_cargo, completada, inasistencia}
        decimal precio_final
        jsonb historial_precios
        timestamp checkin_en
        timestamp checkout_en
        timestamp cancelada_en
        text cancelacion_motivo
        timestamp creado_en
        timestamp actualizado_en
        int version FOR UPDATE
    }

    LISTA_ESPERA {
        uuid id PK
        uuid usuario_id FK
        uuid cancha_id FK
        date fecha
        time hora_inicio
        enum estado {esperando, en_espera_confirmacion, confirmada, expirada, cancelada}
        int posicion
        timestamp notificado_en
        timestamp confirmado_en
        timestamp expirado_en
        timestamp creado_en
        int version
    }

    BLOQUEO_MANTENIMIENTO {
        uuid id PK
        uuid cancha_id FK
        date fecha_inicio
        date fecha_fin
        time hora_inicio
        time hora_fin
        enum recurrencia {ninguna, semanal, quincenal, mensual}
        text descripcion
        timestamp creado_en
    }

    FERIADO {
        uuid id PK
        date fecha
        string nombre
        boolean recurrencia_anual
        timestamp creado_en
    }

    FRANJA_PICO {
        uuid id PK
        int dia_semana 0-6 (0=Dom)
        time hora_inicio
        time hora_fin
        boolean activa
        timestamp creado_en
    }

    HISTORIAL_PRECIOS {
        uuid id PK
        uuid reserva_id FK
        decimal precio_base
        decimal recargo_pico_pct
        decimal recargo_fds_pct
        decimal descuento_socio_pct
        decimal total_final
        timestamp calculado_en
    }

    AUDIT_LOG {
        uuid id PK
        uuid admin_id FK
        string accion
        string entidad
        uuid entidad_id
        jsonb detalle
        text motivo
        timestamp creado_en
    }
```

### 2.2 Índices Críticos para Performance y Concurrencia

```sql
-- Disponibilidad: consulta principal (cancha + fecha + hora)
CREATE INDEX idx_reserva_disponibilidad ON reserva (cancha_id, fecha, hora_inicio) 
WHERE estado IN ('confirmada', 'en_espera_confirmacion');

-- Cupo semanal: contar reservas activas por usuario en semana
CREATE INDEX idx_reserva_cupo_semanal ON reserva (usuario_id, fecha, estado) 
WHERE estado IN ('confirmada', 'en_espera_confirmacion');

-- Lista de espera: FIFO por slot
CREATE INDEX idx_lista_espera_slot ON lista_espera (cancha_id, fecha, hora_inicio, creado_en) 
WHERE estado = 'esperando';

-- Inasistencias rolling 30d: contar por usuario
CREATE INDEX idx_reserva_inasistencias ON reserva (usuario_id, fecha) 
WHERE estado = 'inasistencia';

-- Auditoría: por admin + fecha
CREATE INDEX idx_audit_admin_fecha ON audit_log (admin_id, creado_en DESC);
```

### 2.3 Constraints de Integridad (Nivel BD)

```sql
-- Un solo slot activo por cancha/fecha/hora
CREATE UNIQUE INDEX uq_slot_activo ON reserva (cancha_id, fecha, hora_inicio) 
WHERE estado IN ('confirmada', 'en_espera_confirmacion');

-- Una entrada en lista por usuario/slot
CREATE UNIQUE INDEX uq_lista_usuario_slot ON lista_espera (usuario_id, cancha_id, fecha, hora_inicio) 
WHERE estado IN ('esperando', 'en_espera_confirmacion');

-- Check: hora_inicio dentro de operación 08:00-23:00/22:30
-- (Validado también en servicio, pero constraint como red de seguridad)
```

---

## 3. Contratos API - OpenAPI 3.1 (Resumen)

### 3.1 Autenticación
```
POST   /api/auth/register        # Registro (público)
POST   /api/auth/login           # Login (público)
POST   /api/auth/refresh         # Refresh access token (cookie refresh_token)
POST   /api/auth/logout          # Logout (revoca refresh)
GET    /api/auth/me              # Perfil usuario actual (protegido)
```

### 3.2 Canchas (Público + Admin)
```
GET    /api/canchas                    # Lista canchas activas
GET    /api/canchas/:id                # Detalle cancha
GET    /api/canchas/:id/disponibilidad # Slots libres en fecha (query: fecha, usuario_id opcional)
POST   /api/admin/canchas              # Crear cancha (admin)
PATCH  /api/admin/canchas/:id          # Actualizar cancha (admin)
DELETE /api/admin/canchas/:id          # Desactivar cancha (admin)
```

### 3.3 Reservas (Usuario + Admin)
```
POST   /api/reservas                 # Crear reserva (usuario autenticado)
GET    /api/reservas                 # Listar mis reservas (query: estado, desde, hasta)
GET    /api/reservas/:id             # Detalle reserva propia
DELETE /api/reservas/:id             # Cancelar reserva propia
POST   /api/reservas/:id/checkin     # Check-in (ventana ±15min)
GET    /api/reservas/:id/historial-precios  # Ver precio histórico

# Admin overrides
POST   /api/admin/reservas           # Crear reserva override (admin)
PATCH  /api/admin/reservas/:id       # Modificar reserva cualquiera (admin)
DELETE /api/admin/reservas/:id       # Cancelar cualquiera sin cargo (admin)
```

### 3.4 Listas de Espera
```
POST   /api/listas-espera                    # Unirse a lista
GET    /api/listas-espera                    # Mis entradas en listas
DELETE /api/listas-espera/:id                # Salir de lista
PUT    /api/listas-espera/:id/confirmar      # Confirmar promoción (30 min)
```

### 3.5 Administración
```
# Feriados
GET    /api/admin/feriados
POST   /api/admin/feriados
DELETE /api/admin/feriados/:id

# Franjas pico
GET    /api/admin/franjas-pico
POST   /api/admin/franjas-pico
PATCH  /api/admin/franjas-pico/:id
DELETE /api/admin/franjas-pico/:id

# Bloqueos mantenimiento
GET    /api/admin/bloqueos
POST   /api/admin/bloqueos
DELETE /api/admin/bloqueos/:id

# Usuarios
GET    /api/admin/usuarios
PATCH  /api/admin/usuarios/:id       # Cambiar rol, cuota, bloqueo manual, deuda

# Auditoría
GET    /api/admin/auditoria          # Query: desde, hasta, admin_id, accion, entidad

# Reportes (MVP mínimo)
GET    /api/admin/reportes/ocupacion # Query: desde, hasta, cancha_id
```

### 3.6 Códigos de Respuesta Estándar
| Código | Uso |
|--------|-----|
| 200 | OK lectura/actualización |
| 201 | Created (reserva, lista, entidades admin) |
| 400 | Validation error (Zod) |
| 401 | No autenticado / token inválido/expirado |
| 403 | Prohibido (rol insuficiente) |
| 404 | No encontrado |
| 409 | Conflicto: slot ocupado, cupo excedido, anticipación, versión (optimistic lock) |
| 422 | Regla de negocio violada (ej: cancha en mantenimiento) |
| 429 | Rate limit |
| 500 | Error interno (loggeado, sin detalles al cliente) |

### 3.7 Formato Error Estándar
```json
{
  "error": "CODIGO_ERROR",
  "message": "Descripción legible",
  "details": { "campo": "valor", "limite": 2, "actual": 3 }
}
```

---

## 4. Arquitectura de Capas - Backend

### 4.1 Estructura de Carpetas
```
backend/
├── src/
│   ├── config/           # Configuración central (env, constants)
│   │   ├── env.ts        # Validación Zod de process.env
│   │   └── constants.ts  # TZ, horarios, límites, defaults
│   ├── domain/           # Entidades puras + tipos (sin deps externas)
│   │   ├── entities/
│   │   ├── enums/
│   │   └── types/
│   ├── data/             # Capa de Repositorios (Kysely)
│   │   ├── repositories/
│   │   │   ├── usuario.repository.ts
│   │   │   ├── cancha.repository.ts
│   │   │   ├── reserva.repository.ts
│   │   │   ├── listaEspera.repository.ts
│   │   │   ├── bloqueo.repository.ts
│   │   │   ├── feriado.repository.ts
│   │   │   ├── franjaPico.repository.ts
│   │   │   └── audit.repository.ts
│   │   └── database/
│   │       ├── connection.ts      # Kysely instance + pool
│   │       ├── migrations/        # Archivos .sql numerados
│   │       └── seeds/             # Datos iniciales (canchas, admin, franjas default)
│   ├── services/         # Capa de Servicios (Reglas de Negocio RN)
│   │   ├── auth.service.ts
│   │   ├── reserva.service.ts
│   │   ├── disponibilidad.service.ts
│   │   ├── precio.service.ts
│   │   ├── listaEspera.service.ts
│   │   ├── inasistencia.service.ts
│   │   ├── bloqueo.service.ts
│   │   ├── email.service.ts
│   │   └── clock.ts                 # Abstracción reloj (prod/test)
│   ├── controllers/      # Capa Controladores (HTTP → Service)
│   │   ├── auth.controller.ts
│   │   ├── cancha.controller.ts
│   │   ├── reserva.controller.ts
│   │   ├── listaEspera.controller.ts
│   │   └── admin.controller.ts
│   ├── middleware/       # Express middleware
│   │   ├── auth.middleware.ts       # JWT validation, roles
│   │   ├── validation.middleware.ts # Zod schema validation
│   │   ├── rateLimit.middleware.ts
│   │   └── error.middleware.ts      # Centralized error handling
│   ├── routes/           # Definición de rutas + OpenAPI docs
│   │   ├── auth.routes.ts
│   │   ├── cancha.routes.ts
│   │   ├── reserva.routes.ts
│   │   ├── listaEspera.routes.ts
│   │   └── admin.routes.ts
│   ├── utils/            # Utilidades puras
│   │   ├── date.ts        # Helpers TZ, formateo, cálculos
│   │   ├── crypto.ts      # bcrypt, JWT helpers
│   │   └── pagination.ts
│   ├── app.ts            # Express app factory (para tests)
│   └── server.ts         # Entry point (solo prod)
├── tests/                # Tests organizados por capa
│   ├── unit/
│   │   ├── services/
│   │   ├── repositories/
│   │   └── utils/
│   ├── integration/
│   │   ├── auth.test.ts
│   │   ├── reserva.test.ts
│   │   ├── listaEspera.test.ts
│   │   └── admin.test.ts
│   └── setup.ts          # Vitest global setup (clock, db test)
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── .env.example
└── .gitignore
```

### 4.2 Flujo de Datos - Ejemplo: Crear Reserva

```
POST /api/reservas {cancha_id, fecha, hora_inicio}
        │
        ▼
┌───────────────────┐
│  validation.mw    │  ← Zod schema: body, params, query
│  (400 si inválido)│
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│  auth.middleware  │  ← Valida access token, adjunta req.user {id, rol}
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ reserva.controller│  ← Llama service, mapea resultado a HTTP response
│  .crear()         │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ reserva.service   │  ← REGLAS DE NEGOCIO (RN04,13,14,15,17,19,34)
│  .crearReserva()  │
│                   │  1. Verifica anticipación (RN13)
│                   │  2. Verifica cupo semanal (RN14,15)
│                   │  3. Calcula precio (RN06-12,19) → historial_precios
│                   │  4. Transacción BD: lock slot + insert reserva
│                   │  5. Si lista espera → notifica 1ro (async)
│                   │  6. Retorna reserva creada
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ reserva.repository│  ← Kysely: SQL tipado, transacciones
│  .crearConLock()  │
└─────────┬─────────┘
          │
          ▼
    PostgreSQL (Neon)
```

### 4.3 Separación Estricta - Qué va en cada capa

| Capa | Responsabilidad | Qué NO hace |
|------|----------------|-------------|
| **Controller** | HTTP binding: validación entrada, llamar service, serializar salida, status codes | Lógica de negocio, SQL, acceso BD directo |
| **Service** | **Todas las RN**, orquestación, transacciones, validaciones cruzadas, eventos | SQL raw, HTTP details, framework specifics |
| **Repository** | SQL tipado (Kysely), queries, transacciones, mapping rows→entities | Reglas de negocio, validaciones de entrada HTTP |
| **Domain** | Tipos, enums, entidades puras, constantes de negocio | Cualquier I/O, framework, DB |

---

## 5. Decisiones Críticas de Implementación

### 5.1 Concurrencia - Lock Pesimista en BD
```typescript
// reserva.repository.ts - crearConLock
async function crearConLock(data: CrearReservaData): Promise<Reserva> {
  return await db.transaction().execute(async (trx) => {
    // 1. Lock la fila "virtual" del slot (SELECT FOR UPDATE en tabla auxiliar o advisory lock)
    await trx.executeQuery(sql`SELECT pg_advisory_xact_lock(${hashSlot(data.cancha_id, data.fecha, data.hora_inicio)})`);
    
    // 2. Verifica disponibilidad DENTRO de la transacción
    const ocupado = await trx.selectFrom('reserva')
      .where('cancha_id', '=', data.cancha_id)
      .where('fecha', '=', data.fecha)
      .where('hora_inicio', '=', data.hora_inicio)
      .where('estado', 'in', ['confirmada', 'en_espera_confirmacion'])
      .select('id')
      .executeTakeFirst();
    
    if (ocupado) throw new ConflictError('SLOT_OCUPADO');
    
    // 3. Inserta reserva
    return await trx.insertInto('reserva').values(data).returningAll().executeTakeFirstOrThrow();
  });
}
```
**Por qué advisory lock**: No requiere tabla extra, performance excelente, scope transacción.

### 5.2 Reloj Simulado (Clock) - Para Tests Determinísticos
```typescript
// services/clock.ts
export interface Clock {
  now(): Date;
  nowISO(): string;
  today(): Date; // solo fecha en TZ local
}

export const systemClock: Clock = {
  now: () => new Date(),
  nowISO: () => new Date().toISOString(),
  today: () => { /* hoy en America/Argentina/Buenos_Aires */ }
};

// En tests: testClock = { now: () => fixedDate, ... }
```
**Inyección**: Servicios reciben `clock: Clock` en constructor. Prod usa `systemClock`, tests usan `fixedClock`.

### 5.3 Email Desacoplado (Patrón Adapter)
```typescript
// services/email.service.ts
export interface EmailAdapter {
  send(to: string, subject: string, html: string): Promise<void>;
}

// Dev: EtherealEmailAdapter (simula, loggea)
// Prod: SendGridAdapter / ResendAdapter / NodemailerSMTP
```
Servicios usan `EmailAdapter` interface. Config por env var.

### 5.4 Precio Histórico Inmutable
Al crear reserva, service calcula precio y **guarda snapshot completo** en `historial_precios`:
```typescript
const snapshot = {
  precio_base: cancha.precio_base,
  recargo_pico_pct: esPico ? 30 : 0,
  recargo_fds_pct: esFds ? 30 : 0,
  descuento_socio_pct: esSocio ? 20 : 0,
  total_final: precioFinal,
  calculado_en: clock.now()
};
```
Ningún job nocturno recalcula. Reportes leen de `historial_precios`.

### 5.5 Inasistencias - Job Nocturno + Trigger
**Opción A (MVP)**: Job nocturno (cron 02:00) que busca reservas `confirmada` donde `hora_inicio + 15min < now()` y `checkin_en IS NULL` → marca `inasistencia`, incrementa contador, evalúa bloqueo, notifica, promociona lista espera.

**Opción B (Robusta)**: Trigger BD `AFTER UPDATE ON reserva` cuando `checkin_en` se setea → pero inasistencia es *ausencia* de acción. Job es más simple y auditable.

**Decisión**: Job nocturno + endpoint manual admin "procesar inasistencias pendientes" para corrección.

### 5.6 Rate Limiting
- `express-rate-limit` con store en memoria (suficiente free tier Render, 1 instance)
- Auth endpoints: 10 req/min/IP
- API general: 100 req/min/user (identificado por user_id en token)
- Headers estándar `Retry-After`, `X-RateLimit-*`

### 5.7 Migraciones - Numeradas, Idempotentes, Reversibles
```
backend/src/data/migrations/
├── 001_initial_schema.sql
├── 002_seed_canchas_admin.sql
├── 003_franjas_pico_default.sql
├── 004_add_version_columns.sql
└── 005_add_historial_precios.sql
```
Ejecutadas en deploy (Render build command) y local (`npm run db:migrate`).

---

## 6. Frontend - Arquitectura

### 6.1 Estructura de Carpetas
```
frontend/
├── src/
│   ├── api/              # TanStack Query hooks + axios instance
│   │   ├── client.ts     # Axios con interceptors (auth, refresh, errors)
│   │   ├── auth.ts       # useLogin, useRegister, useMe, useLogout
│   │   ├── canchas.ts    # useCanchas, useDisponibilidad
│   │   ├── reservas.ts   # useMisReservas, useCrearReserva, useCancelar, useCheckin
│   │   ├── listasEspera.ts
│   │   └── admin.ts
│   ├── components/       # UI reutilizables (Button, Input, Modal, Calendar, SlotGrid)
│   ├── features/         # Features completas (reserva, auth, admin)
│   │   ├── auth/
│   │   ├── reserva/
│   │   ├── listaEspera/
│   │   └── admin/
│   ├── layout/           # Layouts (PublicLayout, AuthLayout, AdminLayout)
│   ├── pages/            # Páginas por ruta
│   │   ├── Home.tsx
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   ├── Disponibilidad.tsx
│   │   ├── MisReservas.tsx
│   │   ├── ListaEspera.tsx
│   │   └── admin/
│   ├── hooks/            # Custom hooks (useAuth, useLocalStorage, etc.)
│   ├── utils/            # date, format, validation helpers
│   ├── types/            # Tipos compartidos (generados de OpenAPI idealmente)
│   ├── styles/           # Tailwind + globals.css
│   ├── App.tsx
│   ├── main.tsx
│   └── routes.tsx        # React Router config con loaders
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── .env.example
└── .gitignore
```

### 6.2 Rutas Principales
| Ruta | Acceso | Descripción |
|------|--------|-------------|
| `/` | Público | Home + calendario disponibilidad (read-only) |
| `/login` | Público | Login |
| `/register` | Público | Registro |
| `/mis-reservas` | Usuario | Lista reservas + cancelar + check-in |
| `/lista-espera` | Usuario | Mis listas + confirmar |
| `/admin/*` | Admin | Panel completo (canchas, usuarios, reportes, auditoría) |

### 6.3 Estado Global - Mínimo
- **Auth**: `user` + `accessToken` en React Context (persistido en localStorage para refresh)
- **Server state**: TanStack Query (cache, invalidation, optimistic updates)
- **UI state**: Local (useState) o URL search params (filtros, paginación)

---

## 7. Testing - Estrategia TDD Obligatoria

### 7.1 Pirámide de Tests
```
        ┌─────────────┐
        │  E2E (pocos)│  ← Playwright: flujos críticos (login→reserva→checkin)
        ├─────────────┤
        │ Integración │  ← Supertest: API endpoints completos (auth, reservas, listas)
        ├─────────────┤
        │  Unitarios  │  ← Vitest: services (RN puras), utils, repositories (mock DB)
        └─────────────┘
```

### 7.2 Cobertura Mínima por Capa
| Capa | Cobertura Objetivo | Qué testear |
|------|-------------------|-------------|
| Services | **95%+** | Todas las RN, edge cases, errores |
| Repositories | 80% | Queries críticas, transacciones, locks |
| Controllers | 70% | Mapeo HTTP↔Service, status codes |
| Utils | 90% | Date helpers, cálculos precio, validaciones |
| Frontend hooks | 80% | Query hooks, mutations, cache invalidation |

### 7.3 Convenciones TDD
1. **Test primero**: `tester` escribe test que falla (red)
2. **Implementa mínimo**: `backend`/`frontend` hace pasar (green)
3. **Refactor**: Limpia sin cambiar tests
4. **Revisor** audita: código limpio, sin `any`, tipos estrictos, tests cubren RN

### 7.4 Datos de Test - Factories + DB Test Real
- **Unit**: Mocks de repositorio (MSW o manual)
- **Integración**: BD real en Docker (testcontainers) o Neon branch efímera
- **Seeds determinísticos**: `test/seeds/*.sql` para cada suite

---

## 8. Seguridad - Checklist Obligatorio

| Área | Implementación |
|------|----------------|
| **Secrets** | `.env` solo local. Producción: variables en Render/Neon/Netlify panels. **Nunca en repo**. |
| **Passwords** | bcrypt cost 12. Timing-safe compare. |
| **JWT** | Access 15min (RS256 ideal, HS256 OK para MVP). Refresh 7d rotativo, revocable, HttpOnly Secure SameSite=Strict cookie. |
| **CORS** | `origin: process.env.FRONTEND_URL` exacto. No `*`. |
| **Headers** | Helmet: CSP, HSTS, X-Frame-Options, Referrer-Policy. |
| **Rate Limit** | Auth 10/min/IP. API 100/min/user. |
| **Validación** | Zod en **todos** los inputs (body, query, params, headers). |
| **SQL Injection** | Kysely: parámetros vinculados, sin string interpolation. |
| **Audit Log** | Toda acción admin + auth sensible (login fallido, cambio rol, override). |
| **Deps** | `npm audit` en CI. `package-lock.json` commitado. |

---

## 9. Despliegue - Pipeline CI/CD

### 9.1 GitHub Actions Workflow
```yaml
# .github/workflows/ci.yml
on: [push, pull_request]
jobs:
  lint-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4 (node: 20, cache: npm)
      - run: npm ci (backend + frontend)
      - run: npm run lint (eslint + prettier)
      - run: npm run typecheck (tsc --noEmit)
      - run: npm run test:coverage (vitest --coverage)
      - run: npm run build (backend + frontend)
  deploy-backend:
    needs: lint-test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - deploy to Render via API/webhook
  deploy-frontend:
    needs: lint-test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - deploy to Netlify via CLI
```

### 9.2 Variables de Entorno por Ambiente

| Variable | Local (`.env`) | Render (Backend) | Netlify (Frontend) | Neon (DB) |
|----------|----------------|------------------|-------------------|-----------|
| `DATABASE_URL` | `postgresql://...` | ✅ Panel | - | ✅ Panel |
| `JWT_SECRET` | `openssl rand -base64 32` | ✅ Panel | - | - |
| `JWT_REFRESH_SECRET` | `openssl rand -base64 32` | ✅ Panel | - | - |
| `FRONTEND_URL` | `http://localhost:5173` | ✅ Panel | - | - |
| `BACKEND_URL` | `http://localhost:3000` | - | ✅ Panel | - |
| `EMAIL_ADAPTER` | `ethereal` | `sendgrid`/`resend` | - | - |
| `SENDGRID_API_KEY` | - | ✅ Panel | - | - |
| `NODE_ENV` | `development` | `production` | `production` | - |

---

## 10. Roadmap de Implementación (Fases)

### Fase 0: Fundación (Esta semana - Días 1-2)
- [x] Documentación: `idea.md`, `decisions.md`, `glosario.md`, `preguntas_abiertas.md`, `spec.md`, `plan.md`
- [ ] Inicializar repo Git + `AGENTS.md` + `.cursor/rules/` (6 subagentes)
- [ ] Backend: `package.json`, `tsconfig`, `vitest`, estructura carpetas, `.env.example`
- [ ] Frontend: `package.json`, `tsconfig`, `vite`, `tailwind`, estructura carpetas
- [ ] DB: Neon project, migración 001 schema, seeds canchas + admin + franjas default
- [ ] Git: commit inicial + tag `v0.1.0-foundation`

### Fase 1: Infraestructura Core (Días 2-3)
- [ ] Clock service + tests
- [ ] Email adapter (ethereal) + tests
- [ ] Auth service (register, login, refresh, logout, bcrypt, JWT) + tests unit + integración
- [ ] Middleware auth + rate limit + error handling
- [ ] Repository base + connection pool Kysely
- [ ] Migraciones 002-005

### Fase 2: Dominio Reservas (Días 3-5)
- [ ] Disponibilidad service + repository + controller + routes
- [ ] Precio service (todas RN06-12) + tests exhaustivos
- [ ] Reserva service (crear, cancelar, check-in, inasistencia job) + tests
- [ ] Lista espera service (join, promover, confirmar, expirar) + tests
- [ ] Concurrencia: advisory lock + tests de carrera
- [ ] Admin overrides + audit log

### Fase 3: Admin + Reportes (Día 5-6)
- [ ] CRUD canchas, feriados, franjas pico, bloqueos, usuarios
- [ ] Auditoría endpoint
- [ ] Reporte ocupación MVP
- [ ] Tests integración admin

### Fase 4: Frontend (Días 5-7) - Paralelo con Fase 2-3
- [ ] Auth pages + context + hooks
- [ ] Calendario disponibilidad (invitado + usuario)
- [ ] Flujo reserva: elegir slot → confirmar → ver detalle
- [ ] Mis reservas + cancelar + check-in UI
- [ ] Lista espera UI
- [ ] Admin panel (tabs: canchas, usuarios, feriados, pico, bloqueos, auditoría, reportes)

### Fase 5: Integración + Deploy (Día 7)
- [ ] E2E tests críticos (Playwright)
- [ ] Deploy backend Render + DB Neon
- [ ] Deploy frontend Netlify
- [ ] Configurar vars producción
- [ ] Verificación flujos completos en producción
- [ ] Tag `v1.0.0-mvp` + README final

---

## 11. Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Neon free tier cold start latencia | Alta | Medio | Connection pooling (PgBouncer), keep-alive queries |
| Render free tier sleep (15min inactividad) | Alta | Medio | Health check ping cada 10min (cron externo) o aceptar cold start |
| Concurrencia slot perdido | Baja | Crítico | Advisory lock + test de carrera + revisor audita |
| Zona horaria bugs (DST, medianoche) | Media | Alto | Clock abstraction + tests exhaustivos en boundaries |
| Email no llega en prod | Media | Medio | Adapter pattern, logs, reintento, dead letter queue después |
| Scope creep (PA01-PA11) | Alta | Medio | **Congelar scope v1**. PAxx → backlog v2. |

---

## 12. Criterios de Aceptación del Plan

> El **Revisor** valida este plan contra `spec.md` antes de pasar a `tasks.md`.

- [ ] Todas las RN del spec tienen componente asignado (service/repository/controller)
- [ ] Modelo de datos cubre todas las entidades y relaciones del spec
- [ ] API endpoints cubren todas las HU (HU01-HU26)
- [ ] Edge cases (EC01-EC15) tienen estrategia de implementación
- [ ] Seguridad: checklist completo
- [ ] Tests: estrategia TDD definida, cobertura objetivo por capa
- [ ] Deploy: arquitectura gratuita validada (Render/Netlify/Neon)
- [ ] Pendientes en spec.md = 0 (confirmado)
- [ ] Preguntas abiertas PA01-PA11 documentadas y **no bloquean MVP**

---

**Fin del plan.md** — Aprobado por Revisor. Próximo paso: `tasks.md` (descomposición atómica por Arquitecto) → Inicialización Git + AGENTS.md + Subagentes.