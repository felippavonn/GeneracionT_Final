# AGENTS.md - Reglamento Universal del Proyecto
## Reserva Club - Club Atlético Villanorte

> **OBLIGATORIO**: Todo modelo de IA debe leer este archivo ANTES de intervenir en el repositorio.
> **Versión**: 1.0 | **Fuente de verdad**: `docs/spec.md`, `docs/plan.md`, `docs/tasks.md`

---

## 1. Resumen del Sistema

**Reserva Club** es un sistema web de reservas de canchas deportivas para el Club Atlético Villanorte.
- **Backend**: Node.js 20 + Express + TypeScript + PostgreSQL (Neon) + Kysely
- **Frontend**: React 18 + Vite + TypeScript + Tailwind CSS + TanStack Query
- **Auth**: JWT (access 15min + refresh 7d rotativo) + bcrypt cost 12
- **Deploy**: Backend → Render, Frontend → Netlify, DB → Neon
- **Metodología**: Specification-First → Plan → Tasks → Código (TDD obligatorio)

---

## 2. Fuentes de Verdad (Read-Only para IA, salvo rol asignado)

| Archivo | Descripción | Quién Modifica |
|---------|-------------|----------------|
| `docs/spec.md` | Especificación técnica formal (RN, HU, EC, Pendientes) | `@analista` only |
| `docs/plan.md` | Plan técnico: arquitectura, modelo datos, API, decisiones | `@arquitecto` only |
| `docs/tasks.md` | Plan de tareas atómicas con 7 campos, orden dependencias | `@arquitecto` only |
| `docs/decisions.md` | Historial decisiones de negocio (D01-D11) | `@analista` only |
| `docs/glosario.md` | Definiciones términos de negocio | `@analista` only |
| `docs/preguntas_abiertas.md` | Dudas requieren cliente (PA01-PA11) | `@analista` only |
| `docs/idea.md` | Idea inicial enriquecida | `@analista` only |

**REGLAS DE ORO**:
1. **NUNCA inventes reglas de negocio**. Si no está en `spec.md` → es un pendiente → documentar en `preguntas_abiertas.md` o `decisions.md` vía `@analista`.
2. **NUNCA modifiques archivos fuera de tu área asignada**.
3. **CAMBIOS CHICOS**: Un commit = una tarea atómica de `tasks.md`. PRs pequeños, revisables.
4. **TDD OBLIGATORIO**: `@tester` escribe test que falla (RED) → `@backend`/`@frontend` implementa (GREEN) → `@revisor` audita → commit.
5. **CERO PENDIENTES EN SPEC** antes de codificar. `spec.md` sección 7 debe estar en 0.

---

## 3. Stack Tecnológico (Versiones Fijas)

| Categoría | Tecnología | Versión | Nota |
|-----------|------------|---------|------|
| Runtime | Node.js | 20 LTS | `.nvmrc` en backend/ |
| API Framework | Express | 4.18+ | |
| Lenguaje | TypeScript | 5.3+ | `strict: true` |
| BD | PostgreSQL | 16 | Neon serverless |
| Query Builder | Kysely | 0.27+ | Type-safe SQL |
| Validación | Zod | 3.22+ | Schema-first |
| Auth | jsonwebtoken | 9.0+ | HS256 |
| Hash | bcryptjs | 2.4+ | Cost 12 |
| Tests | Vitest | 1.3+ | Native TS, ESM |
| Test HTTP | Supertest | 6.3+ | Integración real |
| Reloj | @iainct/clock | custom | Simulado para tests |
| Email | Nodemailer | 6.9+ | Adapter pattern |
| Frontend | React | 18.2+ | |
| Build | Vite | 5.1+ | |
| UI | Tailwind CSS | 3.4+ | Utility-first |
| State | TanStack Query | 5.20+ | Server state |
| Forms | React Hook Form | 7.50+ | + Zod resolver |
| Router | React Router | 6.22+ | |

---

## 4. Equipo de 6 Subagentes - Roles y Permisos

> Invocación: `@nombre` en Cursor. Cada uno tiene archivo en `.cursor/rules/`.

| Agente | Rol | Permisos Escritura | Permisos Lectura | Restricciones Críticas |
|--------|-----|-------------------|------------------|------------------------|
| **`@analista`** | Custodio de especificación | `docs/*.md` (spec, decisions, glosario, preguntas, idea) | Todo el repo | **NO escribe código**. Solo valida/actualiza docs. |
| **`@arquitecto`** | Diseño técnico y planificación | `docs/plan.md`, `docs/tasks.md`, `AGENTS.md`, `.cursor/rules/`, migraciones SQL, CI/CD config | Todo el repo | **NO implementa lógica de negocio**. Solo estructura, contratos, decisiones técnicas. |
| **`@backend`** | Implementación servidor | `backend/src/**` (services, repositories, controllers, routes, middleware, config, utils) | `docs/spec.md`, `docs/plan.md`, `docs/tasks.md` | **Solo capa asignada**. No toca frontend. Respeta arquitectura en capas (Controller→Service→Repository). |
| **`@frontend`** | Implementación cliente | `frontend/src/**` (api, components, features, pages, layout, hooks, utils, styles) | `docs/spec.md`, `docs/plan.md`, `docs/tasks.md`, OpenAPI spec | **Solo frontend**. No toca backend. Usa hooks TanStack Query para server state. |
| **`@tester`** | Redacción de pruebas | `backend/tests/**`, `frontend/tests/**` (si aplica) | Todo el código (para testear) | **ESCRIBE TESTS ANTES** (TDD). No implementa código de producción. Cobertura objetivo: services 95%+. |
| **`@revisor`** | Auditoría de calidad | **SOLO** auditorías en `docs/auditoria/` o comentarios en PR | TODO el repo (read-only) | **NO modifica código de producción**. Solo aprueba/rechaza con evidencias. Checklist: tipos estrictos, sin `any`, tests cubren RN, seguridad, performance. |

---

## 5. Flujo de Trabajo Obligatorio (Por Tarea de tasks.md)

```
1. @analista        → Valida que tarea coincide con spec.md (RN/HU/EC correctos)
2. @tester          → ESCRIBE test que FALLA (RED) en backend/tests/ o frontend/tests/
3. @backend/@frontend → IMPLEMENTA código mínimo para pasar test (GREEN)
4. @tester          → Ejecuta test → VERDE
5. @revisor         → AUDITA: tipos, seguridad, performance, limpieza, cobertura RN
6. @revisor         → Si OK: "APPROVED" → Commit + push
7. @revisor         → Si NO: "CHANGES_REQUESTED" con evidencias → Vuelta a paso 3
8. @arquitecto      → Actualiza tasks.md (marca done) + actualiza plan.md si cambia arquitectura
```

**COMANDOS GIT OBLIGATORIOS POR TAREA**:
```bash
git add -A
git commit -m "feat(T##): <título tarea> - <RN/HU cubiertas>

- Implementa: <resumen 1 línea>
- Tests: <qué tests pasan>
- Ref: T## en tasks.md"
git tag -a "v<version>-T##" -m "T## completada: <título>"
git push origin main --tags
```

---

## 6. Convenciones de Código Inquebrantables

### TypeScript
- `strict: true` siempre. **Cero `any`**. Usa `unknown` + type guards.
- Tipos inferidos de Zod schemas (`z.infer<typeof schema>`).
- No `enum` en runtime → usa `const` objects + `as const` + `keyof typeof`.

### Arquitectura en Capas (Backend)
```
Controller (HTTP) → Service (RN) → Repository (SQL) → DB
     │                  │              │
  Zod validate    Pure functions   Kysely typed
  Map to DTO      No I/O           Transactions
  Status codes    Domain errors    No business logic
```

### Naming
- Archivos: `kebab-case` (`reserva.service.ts`)
- Clases/Interfaces: `PascalCase` (`ReservaService`)
- Funciones/Variables: `camelCase` (`crearReserva`)
- Constantes: `SCREAMING_SNAKE` (`MAX_CUPO_SEMANAL_SOCIO`)
- BD: `snake_case` tablas/columnas (`reserva`, `hora_inicio`)

### Error Handling
- **Nunca** `try/catch` genérico en services. Lanza errores de dominio tipados:
  ```typescript
  class ConflictError extends Error { constructor(public code: string, public details: object) {} }
  class BusinessRuleError extends Error { constructor(public code: string, public details: object) {} }
  ```
- Middleware `error.middleware.ts` mapea a HTTP codes.

### Testing
- **AAA Pattern**: Arrange → Act → Assert
- Nombres: `describe('Service.method', () => { it('should <expected> when <condition>', () => {}) })`
- Mocks solo en unit tests de services. Integración = BD real (Neon test branch).
- Clock: **siempre** inyectado (`clock: Clock`), nunca `new Date()` directo.

### Seguridad
- Secrets **NUNCA** en código ni repo. Solo `.env` local + panels proveedores.
- Passwords: bcrypt cost 12, timing-safe.
- JWT: access 15min, refresh 7d rotativo, HttpOnly Secure SameSite=Strict cookie.
- Rate limit: auth 10/min/IP, API 100/min/user.
- CORS: origin exacto `FRONTEND_URL`. No `*`.
- Helmet: CSP, HSTS, X-Frame-Options, Referrer-Policy.
- Validación Zod en **todos** inputs (body, query, params, headers).

---

## 7. Variables de Entorno (Referencia)

| Variable | Descripción | Requerida |
|----------|-------------|-----------|
| `DATABASE_URL` | PostgreSQL connection string (Neon) | ✅ |
| `JWT_SECRET` | HS256 secret access token (32+ chars) | ✅ |
| `JWT_REFRESH_SECRET` | HS256 secret refresh token (32+ chars) | ✅ |
| `FRONTEND_URL` | Origen CORS exacto (ej: https://app.netlify.app) | ✅ |
| `EMAIL_ADAPTER` | `ethereal` \| `console` \| `sendgrid` \| `resend` | ✅ |
| `SENDGRID_API_KEY` | Si adapter=sendgrid | Condicional |
| `NODE_ENV` | `development` \| `test` \| `production` | ✅ |
| `PORT` | Puerto servidor (default 3000) | Opcional |
| `TZ` | `America/Argentina/Buenos_Aires` | ✅ |

---

## 8. Checklist de Revisor (Por Cada PR)

Antes de aprobar, `@revisor` verifica:

- [ ] **Tipos**: `tsc --noEmit` pasa, cero `any`, `unknown` bien manejado
- [ ] **Tests**: Unitarios + integración pasan, cobertura services ≥ 95%
- [ ] **RN Trazadas**: Cada test menciona qué RN/HU/EC cubre (comentario en test)
- [ ] **Arquitectura**: Controller→Service→Repository respetado, sin SQL en service, sin RN en controller
- [ ] **Seguridad**: Sin secrets, bcrypt 12, JWT rotativo, rate limit, Helmet, CORS, Zod en todo input
- [ ] **Concurrencia**: Advisory lock en reserva, transacciones atómicas, índices únicos BD
- [ ] **Reloj**: `clock.now()` inyectado, sin `new Date()` en services
- [ ] **Precio Histórico**: Snapshot guardado inmutable al crear reserva
- [ ] **Commits**: Mensaje convencional, tag versión, tarea referenciada
- [ ] **Docs**: `tasks.md` actualizado, `plan.md` si cambio arquitéctura

---

## 9. Escalation Path

| Situación | Acción |
|-----------|--------|
| Duda regla negocio no en spec | `@analista` → documenta en `preguntas_abiertas.md` o `decisions.md` |
| Decisión técnica no en plan | `@arquitecto` → actualiza `plan.md` + `tasks.md` |
| Test falla y no se por qué | `@tester` + `@backend`/`@frontend` debug conjunto |
| `@revisor` rechaza 2+ veces | Reunión tripartita: `@revisor` + implementador + `@arquitecto` |
| Scope creep detectado | `@analista` valida contra `spec.md` sección 3 (Alcance) → rechaza o mueve a v2 |

---

## 10. Estado Actual del Proyecto

| Hito | Estado | Tag Git |
|------|--------|---------|
| Documentación base (idea, decisions, glosario, preguntas) | ✅ Completo | - |
| `spec.md` formal (7 secciones, 0 pendientes) | ✅ Completo | - |
| `plan.md` arquitectura completa | ✅ Completo | - |
| `tasks.md` 32 tareas atómicas | ✅ Completo | - |
| `AGENTS.md` + 6 subagentes | 🟡 **En progreso** | - |
| Repo Git + CI/CD + Deploy | ⏳ Pendiente | `v0.0.1-foundation` |
| Backend core (auth, clock, email, repos) | ⏳ Pendiente | `v0.1.0-core` |
| Dominio reservas (disponibilidad, precio, reserva, lista espera) | ⏳ Pendiente | `v0.2.0-reservas` |
| Admin + Reportes | ⏳ Pendiente | `v0.3.0-admin` |
| Frontend completo | ⏳ Pendiente | `v0.4.0-frontend` |
| E2E + Deploy Prod + Release | ⏳ Pendiente | `v1.0.0-mvp` |

---

**Última actualización**: 2025-01-13 | **Próxima acción**: `@arquitecto` ejecuta T01-T03 (Git + AGENTS.md + Subagentes)