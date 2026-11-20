# tasks.md - Plan de Tareas Atómicas
## Reserva Club - Club Atlético Villanorte

> **Versión**: 1.0 | **Estado**: Listo para ejecución | **Basado en**: `spec.md` v1.0 + `plan.md` v1.0
> **Formato**: 7 campos obligatorios por tarea | **Orden**: Por dependencias arquitectónicas (no numérico HU)
> **Agentes**: `@backend`, `@frontend`, `@tester`, `@revisor`, `@arquitecto`, `@analista`

---

## Convenciones

| Campo | Descripción |
|-------|-------------|
| **T##** | Número de tarea único |
| **Título** | Imperativo, una línea |
| **Agente** | Quién implementa (backend/frontend/tester) |
| **Descripción** | Qué se hace, alcance exacto |
| **Cobertura** | RN/HU/EC cubiertas (trazabilidad) |
| **Dependencias** | Tareas que deben completarse antes |
| **Criterios Done** | Tests que deben pasar (TDD: tester escribe primero) |

---

## FASE 0: FUNDACIÓN Y CONFIGURACIÓN BASE

### T01: Inicializar repositorio Git + estructura base
- **Agente**: `@arquitecto`
- **Descripción**: Crear repo `reserva-club`, carpetas `docs/`, `backend/`, `frontend/`, `.cursor/rules/`, `.github/workflows/`. Archivos `.gitkeep` en carpetas vacías. `README.md` apuntando a `docs/spec.md` como fuente de verdad. `.gitignore` Node/TS/React estándar.
- **Cobertura**: Base para todo el proyecto
- **Dependencias**: Ninguna
- **Criterios Done**:
  - [ ] `git log --oneline` muestra commit inicial "chore: init repo structure"
  - [ ] Tag `v0.0.1-foundation` creado
  - [ ] Estructura de carpetas existe y persistida en Git

### T02: Crear AGENTS.md (Reglamento Universal)
- **Agente**: `@arquitecto`
- **Descripción**: Redactar `AGENTS.md` con: resumen sistema, ubicación fuentes verdad (`docs/spec.md`, `docs/plan.md`, `docs/tasks.md`), stack tecnológico, normas estrictas (prohibido inventar reglas, cambios chicos, áreas asignadas, TDD obligatorio, revisor antes de commit).
- **Cobertura**: Metodología completa
- **Dependencias**: T01
- **Criterios Done**:
  - [ ] Archivo existe en raíz
  - [ ] Contiene todas las secciones requeridas
  - [ ] `@analista` puede validar que no contradice `spec.md`

### T03: Configurar 6 Subagentes (.cursor/rules/)
- **Agente**: `@arquitecto`
- **Descripción**: Crear 6 archivos en `.cursor/rules/` (máx 30 líneas c/u): `analista.mdc`, `arquitecto.mdc`, `backend.mdc`, `frontend.mdc`, `tester.mdc`, `revisor.mdc`. Cada uno con: rol, permisos (lectura/escritura), comandos `@`, restricciones.
- **Cobertura**: Metodología completa
- **Dependencias**: T02
- **Criterios Done**:
  - [ ] 6 archivos creados
  - [ ] Cada uno invocable con `@analista`, `@arquitecto`, etc.
  - [ ] `@revisor` tiene permisos de solo lectura en todo + escritura en auditorías

### T04: Backend - Package.json + TypeScript + Vitest + Config base
- **Agente**: `@backend`
- **Descripción**: Inicializar `backend/package.json` con deps: express, kysely, pg, zod, jsonwebtoken, bcryptjs, vitest, supertest, @iainct/clock, nodemailer, dotenv, helmet, cors, express-rate-limit. `tsconfig.json` strict mode. `vitest.config.ts` con coverage. `.env.example` con todas las vars. `.gitignore`.
- **Cobertura**: Infra base para todas las tareas backend
- **Dependencias**: T01
- **Criterios Done**:
  - [ ] `npm install` en backend limpio instala sin errores
  - [ ] `npm run typecheck` pasa (tsc --noEmit)
  - [ ] `npm test` ejecuta vitest (aunque 0 tests)
  - [ ] `npm run lint` configurado (eslint + prettier)

### T05: Frontend - Package.json + Vite + TypeScript + Tailwind + Config base
- **Agente**: `@frontend`
- **Descripción**: Inicializar `frontend/package.json` con: react, react-dom, react-router-dom, @tanstack/react-query, axios, react-hook-form, @hookform/resolvers, zod, date-fns, lucide-react. `vite.config.ts`, `tsconfig.json`, `tailwind.config.js`, `postcss.config.js`, `.env.example`. Estructura carpetas `src/`.
- **Cobertura**: Infra base para todas las tareas frontend
- **Dependencias**: T01
- **Criterios Done**:
  - [ ] `npm install` en frontend limpio instala sin errores
  - [ ] `npm run dev` levanta Vite en localhost:5173
  - [ ] `npm run build` compila sin errores
  - [ ] Tailwind funciona (clase `bg-blue-500` renderiza azul)

### T06: Base de Datos - Neon Project + Migración 001 Schema Completo
- **Agente**: `@arquitecto` + `@backend`
- **Descripción**: Crear proyecto Neon. Migración `001_initial_schema.sql` con todas las tablas, índices, constraints, enums del `plan.md` sección 2. Incluye: usuario, cancha, reserva, lista_espera, bloqueo_mantenimiento, feriado, franja_pico, historial_precios, audit_log. Índices únicos para concurrencia.
- **Cobertura**: RN01-RN05, RN13-RN15, RN17-RN20, RN24-RN28, RN29-RN35, RN37
- **Dependencias**: T04
- **Criterios Done**:
  - [ ] `psql $DATABASE_URL -f 001_initial_schema.sql` ejecuta sin errores
  - [ ] `\d` en Neon muestra 9 tablas con columnas correctas
  - [ ] Índices únicos `uq_slot_activo` y `uq_lista_usuario_slot` existen
  - [ ] `@tester` puede conectar y hacer queries de prueba

### T07: Seeds Iniciales - Canchas, Admin, Franjas Pico Default
- **Agente**: `@backend`
- **Descripción**: Migración `002_seed_canchas_admin.sql`: 6 canchas (2 fútbol5, 3 pádel, 1 tenis) con precios base realistas. 1 usuario admin (email: admin@club.com, password hash). Franjas pico default (Lun-Vie 18-22). Migración `003_franjas_pico_default.sql` separada.
- **Cobertura**: RN03, RN06, RN11, HU20, HU22
- **Dependencias**: T06
- **Criterios Done**:
  - [ ] Seeds insertan sin errores PK duplicate
  - [ ] `SELECT * FROM cancha` devuelve 6 filas con duraciones correctas
  - [ ] Admin user existe con rol `admin`
  - [ ] Franjas pico default activas

---

## FASE 1: INFRAESTRUCTURA CORE (RELOJ, EMAIL, AUTH, MIDDLEWARE)

### T08: Clock Service - Abstracción de Reloj (Prod + Test)
- **Agente**: `@backend` (impl) / `@tester` (tests first)
- **Descripción**: `src/services/clock.ts` con interface `Clock { now(), nowISO(), today() }`. `systemClock` usa `new Date()` con TZ `America/Argentina/Buenos_Aires`. `fixedClock` para tests (seteable). Exporta `getClock(): Clock` que lee `process.env.NODE_ENV === 'test'`.
- **Cobertura**: RN01, EC14, Base para todos los servicios temporales
- **Dependencias**: T04
- **Criterios Done**:
  - [ ] `@tester` escribe test: `fixedClock.now()` retorna fecha fijada, `advance(ms)` avanza
  - [ ] `systemClock.today()` retorna fecha en TZ Argentina (test con mock TZ)
  - [ ] `@revisor` valida: sin `new Date()` directo en servicios, solo `clock.now()`

### T09: Email Adapter - Patrón Desacoplado (Dev: Ethereal)
- **Agente**: `@backend` / `@tester`
- **Descripción**: `src/services/email.service.ts`. Interface `EmailAdapter { send(to, subject, html): Promise<void> }`. `EtherealEmailAdapter` (dev): crea cuenta test Ethereal, loggea preview URL. `ConsoleEmailAdapter` (test): solo loggea. Factory `getEmailAdapter()` por `EMAIL_ADAPTER` env var.
- **Cobertura**: RN31, RN32, RN33, HU17, HU18, HU19
- **Dependencias**: T04
- **Criterios Done**:
  - [ ] `@tester` test: `ConsoleEmailAdapter.send` loggea sin error
  - [ ] `EtherealEmailAdapter` genera preview URL válida (manual check)
  - [ ] `@revisor` valida: servicios usan `EmailAdapter` interface, no implementación concreta

### T10: Auth Service - Registro, Login, Refresh, Logout, Bcrypt, JWT
- **Agente**: `@backend` / `@tester`
- **Descripción**: `src/services/auth.service.ts`. `register(email, password)`: valida email único, bcrypt cost 12, crea usuario `no_socio`, genera access (15min) + refresh (7d rotativo), setea cookies HttpOnly Secure. `login`: verifica bcrypt, genera tokens, rotación refresh. `refresh`: valida refresh token, revoca usado, emite nuevo par. `logout`: revoca refresh token. `me(userId)`: retorna perfil sin password. Tokens JWT HS256 (secret en env).
- **Cobertura**: RN39, RN40, RN41, RN42, HU01, HU02, HU03, HU04, EC10
- **Dependencias**: T04, T08 (clock para exp), T06 (tabla usuario)
- **Criterios Done**:
  - [ ] `@tester` tests unitarios: register dup email → 409, password <8 → 400, bcrypt cost 12 verificado
  - [ ] `@tester` tests integración (Supertest): POST /auth/register → 201 + cookies; POST /auth/login → 200 + cookies; POST /auth/refresh rota tokens; POST /auth/logout revoca
  - [ ] `@tester` test: refresh token reutilizado → revocación cadena + 401
  - [ ] `@revisor` valida: `password_hash` nunca en logs/responses, cookies `HttpOnly; Secure; SameSite=Strict`

### T11: Middleware Auth + Rate Limit + Error Handling
- **Agente**: `@backend` / `@tester`
- **Descripción**: `src/middleware/auth.middleware.ts`: extrae access token de cookie/header, verifica JWT, adjunta `req.user {id, rol}`. `requireRole(...roles)` guard. `src/middleware/rateLimit.middleware.ts`: `authLimiter` (10/min/IP), `apiLimiter` (100/min/user_id). `src/middleware/error.middleware.ts`: centraliza errores, mapea `ZodError`→400, `ConflictError`→409, `BusinessRuleError`→422, `UnauthorizedError`→401, `ForbiddenError`→403, `NotFoundError`→404, genérico→500 (log interno, sin stack al cliente).
- **Cobertura**: RN39, RN41, RN42, RN43, Transversal
- **Dependencias**: T10
- **Criterios Done**:
  - [ ] `@tester` test: token expirado → 401; token inválido → 401; sin token → 401
  - [ ] `@tester` test: `requireRole('admin')` con user socio → 403
  - [ ] `@tester` test: rate limit auth → 429 con `Retry-After` header
  - [ ] `@revisor` valida: error middleware no expone stack en prod, loggea en server

### T12: Repository Base + Kysely Connection Pool
- **Agente**: `@backend` / `@tester`
- **Descripción**: `src/data/database/connection.ts`: Kysely instance con pool PostgreSQL (Neon), `Dialect` pg. `src/data/repositories/base.repository.ts`: clase base con `db` inyectado, helpers transacción. Repositorios concretos extienden base.
- **Cobertura**: Base para todos los repositorios
- **Dependencias**: T04, T06
- **Criterios Done**:
  - [ ] `@tester` test: pool conecta a Neon test branch, query simple `SELECT 1` ok
  - [ ] `@tester` test: transacción rollback en error funciona
  - [ ] `@revisor` valida: sin SQL string interpolation, solo query builder Kysely

---

## FASE 2: DOMINIO RESERVAS - DISPONIBILIDAD, PRECIO, RESERVA, LISTA ESPERA

### T13: Cancha Repository + Service + Controller + Routes
- **Agente**: `@backend` / `@tester`
- **Descripción**: `cancha.repository.ts`: `findAll()`, `findById()`, `findActivas()`, `create()`, `update()`, `softDelete()`. `cancha.service.ts`: `getDisponibilidad(canchaId, fecha, userId?)` → array slots con `disponible`, `precio_final`, `motivo_si_no`. Calcula precio llamando `PrecioService`. `cancha.controller.ts`: GET `/canchas`, GET `/canchas/:id`, GET `/canchas/:id/disponibilidad`. `cancha.routes.ts` con Zod schemas.
- **Cobertura**: RN02, RN03, RN04, RN05, RN07-RN11, HU05, HU20
- **Dependencias**: T12, T14 (PrecioService)
- **Criterios Done**:
  - [ ] `@tester` test unit: `getDisponibilidad` respeta bloqueos mantenimiento, horarios operación, slots ocupados
  - [ ] `@tester` test integ: GET `/canchas/:id/disponibilidad?fecha=2025-01-20` → 200 con slots correctos
  - [ ] `@tester` test: precio final incluye recargos pico/fds y descuento socio si autenticado
  - [ ] `@revisor` valida: controller solo mapea HTTP→service→response, sin lógica

### T14: Precio Service - Motor de Cálculo Completo
- **Agente**: `@backend` / `@tester`
- **Descripción**: `precio.service.ts`: `calcularPrecio(cancha, fecha, horaInicio, esSocio, cuotaVigente)` → `{precio_base, recargo_pico_pct, recargo_fds_pct, descuento_socio_pct, total_final, historial_precios}`. Helper `esPico(fecha, hora)`: consulta `franja_pico` por día semana + hora. Helper `esFdsFeriado(fecha)`: sábado/domingo OR feriado en BD. Redondeo 2 decimales half-up. **Puro, sin I/O, 100% testeable**.
- **Cobertura**: RN06-RN12, RN19, RN20, EC02, EC04, EC13
- **Dependencias**: T06 (tablas feriado, franja_pico), T08 (clock para "hoy" en tests)
- **Criterios Done**:
  - [ ] `@tester` tests exhaustivos (mín 20 cases): pico sí/no, fds sí/no, feriado sí/no, socio sí/no, combinaciones, boundary horas (17:59 vs 18:00), redondeo
  - [ ] `@tester` test: feriado cargado después no afecta precio ya calculado (historial inmutable)
  - [ ] `@tester` test: slot 90min (pádel) siguiente disponible respeta duración (EC13)
  - [ ] `@revisor` valida: función pura, sin side effects, coverage 100%

### T15: Reserva Repository - CRUD + Lock Concurrencia
- **Agente**: `@backend` / `@tester`
- **Descripción**: `reserva.repository.ts`: `crearConLock(data)`: **advisory lock** `pg_advisory_xact_lock(hashSlot)` → verifica slot libre → insert → return. `findById()`, `findByUsuario()`, `findActivasByUsuarioSemana(usuarioId, semanaInicio)`, `updateEstado()`, `updateCheckin()`, `cancelar()`. `historialPreciosRepository`: `create(snapshot)`.
- **Cobertura**: RN04, RN14, RN15, RN16, RN17, RN19, RN34, RN35
- **Dependencias**: T12, T06 (índice único uq_slot_activo)
- **Criterios Done**:
  - [ ] `@tester` test unit (mock): `crearConLock` llama advisory lock, verifica slot, inserta
  - [ ] `@tester` test integración REAL (Neon test branch): 2 requests concurrentes mismo slot → exactamente 1 éxito (201), 1 falla (409 SLOT_OCUPADO)
  - [ ] `@tester` test: cupo semanal cuenta `confirmada` + `en_espera_confirmacion`
  - [ ] `@revisor` valida: advisory lock scope transacción, no hay race condition window

### T16: Reserva Service - Crear, Cancelar, Check-in, Inasistencia
- **Agente**: `@backend` / `@tester`
- **Descripción**: `reserva.service.ts`: 
  - `crearReserva(usuarioId, canchaId, fecha, horaInicio)`: verifica anticipación (RN13), cupo (RN14,15), precio (PrecioService), llama `repo.crearConLock()`, crea `historial_precios`, si hay lista espera → notifica 1ro (async via EmailAdapter).
  - `cancelarReserva(reservaId, usuarioId, esAdmin)`: verifica ownership/admin, calcula cargo (RN21,22), actualiza estado, registra deuda si cargo, libera cupo, promociona lista espera.
  - `checkin(reservaId, usuarioId)`: valida ventana ±15min (RN24), actualiza `checkin_en`.
  - `procesarInasistencias()`: job nocturno - busca `confirmada` sin checkin pasadas `hora_inicio + 15min` → marca `inasistencia`, incrementa contador rolling 30d, evalúa bloqueo (RN27,28), notifica, promociona lista espera.
- **Cobertura**: RN13-RN28, RN31-RN33, HU06-HU15, HU17-HU19, EC03, EC05, EC06, EC09, EC12
- **Dependencias**: T13, T14, T15, T09 (email), T08 (clock)
- **Criterios Done**:
  - [ ] `@tester` tests unitarios (mock repo): cada regla verificada aisladamente (anticipación, cupo, precio, cancelación gratis/con cargo, check-in ventana, inasistencia rolling 30d, bloqueo 3ra)
  - [ ] `@tester` tests integración: flujo completo crear→checkin→completar; crear→cancelar>24h; crear→cancelar<24h; crear→no checkin→inasistencia→bloqueo 3ra
  - [ ] `@tester` test: lista espera promoción automática al cancelar/inasistencia
  - [ ] `@revisor` valida: transacciones atómicas, historial_precios inmutable, deuda registrada correcta

### T17: Lista Espera Repository + Service + Controller + Routes
- **Agente**: `@backend` / `@tester`
- **Descripción**: `listaEspera.repository.ts`: `join(usuarioId, canchaId, fecha, horaInicio)` (unique constraint), `findBySlot(canchaId, fecha, horaInicio)` ordenado FIFO, `findByUsuario()`, `promover(slot)` → primera `esperando` → `en_espera_confirmacion` + `notificado_en=now()`, `confirmar(entryId)`, `expirar(entryId)`, `cancelar(entryId, usuarioId)`.
- `listaEspera.service.ts`: `unirse()`, `confirmar()`, `procesarExpiraciones()` (job: `en_espera_confirmacion` donde `notificado_en + 30min < now()` → `expirada` + promociona siguiente).
- Controller/Routes: POST `/listas-espera`, GET `/listas-espera`, DELETE `/listas-espera/:id`, PUT `/listas-espera/:id/confirmar`.
- **Cobertura**: RN29-RN33, RN35, HU16-HU19, EC05, EC06, EC07, EC12
- **Dependencias**: T15 (repo reserva para promocionar), T09 (email notificación), T08 (clock)
- **Criterios Done**:
  - [ ] `@tester` test: FIFO estricto por `creado_en`
  - [ ] `@tester` test: usuario no puede duplicar entrada mismo slot
  - [ ] `@tester` test: confirmar dentro 30min → reserva creada + cupo verificado; excede cupo → salta siguiente (EC06)
  - [ ] `@tester` test: expiración 30min → pasa al siguiente
  - [ ] `@revisor` valida: promoción atómica (lock slot + update lista + create reserva en transacción)

### T18: Bloqueo Mantenimiento Repository + Service + Admin Routes
- **Agente**: `@backend` / `@tester`
- **Descripción**: `bloqueo.repository.ts`: CRUD + `findVigentesEnRango(canchaId, fechaInicio, fechaFin)`. `bloqueo.service.ts`: `estaDisponible(canchaId, fecha, horaInicio)` considera bloqueos puntuales + recurrentes (semanal: día semana match). Admin routes: POST/GET/DELETE `/admin/bloqueos`.
- **Cobertura**: RN05, RN08, HU23, EC08
- **Dependencias**: T12, T06
- **Criterios Done**:
  - [ ] `@tester` test: bloqueo recurrente semanal bloquea mismo día semana en rango
  - [ ] `@tester` test: disponibilidad respeta bloqueo (disponible=false, motivo="mantenimiento")
  - [ ] `@tester` test: feriado + mantenimiento → mantenimiento gana (EC08)

### T19: Feriados + Franjas Pico Admin CRUD
- **Agente**: `@backend` / `@tester`
- **Descripción**: Repositories + Services + Controllers + Routes para `/admin/feriados` y `/admin/franjas-pico`. Validaciones: feriado fecha única, franja pico hora_inicio < hora_fin, días semana 0-6.
- **Cobertura**: RN10, RN11, HU21, HU22
- **Dependencias**: T12, T06
- **Criterios Done**:
  - [ ] `@tester` test: crear feriado → aplica recargo fds en precio service
  - [ ] `@tester` test: crear franja pico → aplica recargo pico en precio service
  - [ ] `@revisor` valida: solo admin accede (middleware requireRole)

---

## FASE 3: ADMIN - USUARIOS, OVERRIDES, AUDITORÍA, REPORTES

### T20: Admin Usuarios - Gestión Roles, Cuota, Bloqueo, Deuda
- **Agente**: `@backend` / `@tester`
- **Descripción**: `usuario.repository.ts`: `findAll()`, `findById()`, `updateRol()`, `updateCuota()`, `updateBloqueo()`, `updateDeuda()`. `usuario.service.ts`: `cambiarRol(usuarioId, nuevoRol)`, `actualizarCuota(usuarioId, fechaVigencia)`, `bloquearUsuario(usuarioId, dias, motivo)`, `ajustarDeuda(usuarioId, monto)`. Admin route: PATCH `/admin/usuarios/:id` con body validado Zod. Auditoría automática en cada cambio.
- **Cobertura**: RN36, RN37, RN38, PA06 (parcial), HU24 (parcial)
- **Dependencias**: T10, T11, T12
- **Criterios Done**:
  - [ ] `@tester` test: cambiar rol socio→no_socio actualiza anticipación/cupo futuras reservas
  - [ ] `@tester` test: bloqueo manual admin suma a `bloqueado_hasta` (no sobrescribe si ya bloqueado por inasistencias)
  - [ ] `@tester` test: cada cambio genera `audit_log` con admin_id, accion, detalle, motivo

### T21: Admin Reservas Override + Auditoría Completa
- **Agente**: `@backend` / `@tester`
- **Descripción**: `adminReserva.service.ts`: `crearOverride(data)`: salta validaciones anticipación, cupo, horario, precio (puede setear 0), crea reserva `confirmada` directa. `cancelarOverride(reservaId)`: cancela sin cargo, libera slot. `audit.repository.ts`: `findAll(filtros)`, `create(entry)`. Admin routes: POST `/admin/reservas`, DELETE `/admin/reservas/:id`, GET `/admin/auditoria`.
- **Cobertura**: RN36, RN37, HU24, HU25
- **Dependencias**: T15, T16, T20
- **Criterios Done**:
  - [ ] `@tester` test: override crea reserva en horario cerrado (ej: 07:00)
  - [ ] `@tester` test: override excede cupo semanal → permitida
  - [ ] `@tester` test: auditoría paginada con filtros (fecha, admin, accion, entidad)

### T22: Reporte Ocupación MVP
- **Agente**: `@backend` / `@tester`
- **Descripción**: `reporte.service.ts`: `ocupacion(desde, hasta, canchaId?)` → agrega por cancha y franja horaria (ej: 08-10, 10-12, ..., 22-24): `% ocupacion = slots_ocupados / slots_totales_posibles`. Query SQL optimizada con `generate_series` para franjas. Admin route: GET `/admin/reportes/ocupacion`.
- **Cobertura**: HU26, PA07 (mínimo)
- **Dependencias**: T15, T06
- **Criterios Done**:
  - [ ] `@tester` test: reporte calcula % correcto con datos seed conocidos
  - [ ] `@tester` test: filtro por cancha y rango fecha funciona

---

## FASE 4: FRONTEND - PÁGINAS Y FLUJOS COMPLETOS

### T23: Auth Frontend - Login, Register, Context, Protected Routes
- **Agente**: `@frontend` / `@tester`
- **Descripción**: `src/api/client.ts`: axios instance con interceptors (adjunta access token, maneja 401 → refresh automático → retry). `src/api/auth.ts`: hooks `useLogin`, `useRegister`, `useLogout`, `useMe`. `src/context/AuthContext.tsx`: provee `user`, `login`, `logout`, `isLoading`. `src/layout/AuthLayout.tsx` + `PublicLayout.tsx`. Páginas: `/login`, `/register` con React Hook Form + Zod validation. Rutas protegidas: wrapper `RequireAuth` que redirige a `/login` si no autenticado.
- **Cobertura**: HU01-HU04, RN39, RN41
- **Dependencias**: T05, T10 (backend auth endpoints)
- **Criterios Done**:
  - [ ] `@tester` test: login exitoso → redirige a `/mis-reservas`, user en context
  - [ ] `@tester` test: access token expira → refresh automático → request original retry
  - [ ] `@tester` test: ruta protegida sin auth → redirect `/login?redirect=...`
  - [ ] `@revisor` valida: tokens en memory (no localStorage), refresh en HttpOnly cookie

### T24: Disponibilidad Pública + Calendario Interactivo
- **Agente**: `@frontend` / `@tester`
- **Descripción**: `src/api/canchas.ts`: `useCanchas()`, `useDisponibilidad(canchaId, fecha)`. Componente `SlotGrid`: muestra slots como tarjetas con hora, precio, estado (libre/ocupado/mantenimiento). Filtro por tipo cancha, fecha (datepicker). Página `/` (Home): lista canchas + SlotGrid. Si autenticado → precios con descuento socio; si no → precios base. Click en slot libre → modal "Confirmar reserva" (si autenticado) o redirect `/login?redirect=...`.
- **Cobertura**: HU05, RN07-RN11
- **Dependencias**: T13, T23
- **Criterios Done**:
  - [ ] `@tester` test: SlotGrid renderiza slots correctos para fecha, muestra precio final
  - [ ] `@tester` test: click slot libre autenticado → modal reserva con datos precargados
  - [ ] `@tester` test: slot en mantenimiento muestra badge "Mantenimiento" y no clickeable
  - [ ] `@revisor` valida: responsive mobile-first, accesible (ARIA labels, keyboard nav)

### T25: Flujo Reserva - Crear, Ver Detalle, Cancelar, Check-in
- **Agente**: `@frontend` / `@tester`
- **Descripción**: `src/api/reservas.ts`: hooks `useCrearReserva`, `useMisReservas(filtros)`, `useCancelarReserva`, `useCheckin`. Página `/mis-reservas`: tabla con tabs (Próximas, Pasadas, Canceladas). Cada fila: cancha, fecha, hora, estado, acciones (Cancelar si >24h y antes de hora_inicio, Check-in si en ventana ±15min). Modal confirmar cancelación muestra cargo (gratis/50%). Check-in: botón "Llegué" → POST checkin → feedback toast.
- **Cobertura**: HU06-HU15, RN13-RN17, RN21-RN26
- **Dependencias**: T16, T23, T24
- **Criterios Done**:
  - [ ] `@tester` test: crear reserva → aparece en "Próximas" con estado confirmada
  - [ ] `@tester` test: cancelar >24h → estado cancelada_gratis, toast "Sin cargo"
  - [ ] `@tester` test: cancelar <24h → estado cancelada_con_cargo, muestra monto 50%
  - [ ] `@tester` test: check-in en ventana → botón desaparece, badge "Presente"
  - [ ] `@tester` test: botón cancelar se deshabilita exactamente a hora_inicio (RN26)

### T26: Lista de Espera - Unirse, Ver Posición, Confirmar
- **Agente**: `@frontend` / `@tester`
- **Descripción**: `src/api/listasEspera.ts`: hooks `useUnirseLista`, `useMisListas`, `useConfirmarLista`, `useSalirLista`. Página `/lista-espera`: lista mis entradas con posición, estado (esperando/en_espera_confirmacion/expirada). Si `en_espera_confirmacion` → cuenta regresiva 30min + botón "Confirmar ahora". Toast notificación "¡Tu turno disponible!" (simulado polling o SSE simple).
- **Cobertura**: HU16-HU19, RN29-RN33
- **Dependencias**: T17, T23
- **Criterios Done**:
  - [ ] `@tester` test: unirse a lista ocupada → muestra posición N
  - [ ] `@tester` test: promoción → entrada pasa a "Confirmar en 30:00", botón activo
  - [ ] `@tester` test: confirmar dentro 30min → reserva creada, desaparece de lista
  - [ ] `@tester` test: expiración 30min → entrada marcada "Expirada", siguiente notificado

### T27: Panel Admin Completo
- **Agente**: `@frontend` / `@tester`
- **Descripción**: Layout `AdminLayout` con sidebar navegación. Páginas/Tabs:
  - **Canchas**: tabla CRUD (crear, editar precio/activa, desactivar)
  - **Feriados**: tabla + modal crear (fecha, nombre, recurrencia)
  - **Franjas Pico**: tabla + modal crear (días, hora_inicio, hora_fin)
  - **Bloqueos**: tabla + modal crear (cancha, rango fechas, horas, recurrencia)
  - **Usuarios**: tabla con rol, cuota_vigente, bloqueado_hasta, deuda. Acciones: cambiar rol, actualizar cuota, bloquear, ajustar deuda
  - **Reservas Override**: form crear reserva admin (buscar usuario, cancha, fecha, hora, precio override, motivo)
  - **Auditoría**: tabla paginada con filtros (fecha, admin, acción, entidad)
  - **Reportes**: Ocupación con selector rango fecha + cancha, muestra grid % por franja
- **Cobertura**: HU20-HU26, RN36-RN38
- **Dependencias**: T18, T19, T20, T21, T22, T23 (requireRole admin)
- **Criterios Done**:
  - [ ] `@tester` test: admin crea cancha → aparece en pública inmediata
  - [ ] `@tester` test: admin cambia usuario a socio → usuario ve descuento en disponibilidad
  - [ ] `@tester` test: override reserva → audit_log entrada con motivo
  - [ ] `@tester` test: reporte ocupación renderiza % correctos
  - [ ] `@revisor` valida: solo accesible con rol admin (403 si socio/no_socio)

---

## FASE 5: INTEGRACIÓN, E2E, DEPLOY, CI/CD

### T28: GitHub Actions CI - Lint, Typecheck, Test, Build
- **Agente**: `@arquitecto` / `@backend` / `@frontend`
- **Descripción**: `.github/workflows/ci.yml`: jobs `lint-test` (backend + frontend paralelos): `npm ci`, `npm run lint`, `npm run typecheck`, `npm run test:coverage` (umbral 80% services), `npm run build`. Artifacts: coverage reports.
- **Cobertura**: Calidad transversal
- **Dependencias**: T04, T05, T10-T27 (todos los tests deben pasar)
- **Criterios Done**:
  - [ ] Push a main → CI pasa verde
  - [ ] Coverage backend services ≥ 90%
  - [ ] Build genera `backend/dist` y `frontend/dist` sin errores

### T29: Deploy Backend - Render + Neon DB
- **Agente**: `@arquitecto` / `@backend`
- **Descripción**: Crear Web Service Render conectado a repo. Build command: `npm ci && npm run build`. Start command: `npm run start` (desde `dist/server.js`). Env vars en Render panel: `DATABASE_URL` (Neon), `JWT_SECRET`, `JWT_REFRESH_SECRET`, `FRONTEND_URL`, `EMAIL_ADAPTER=sendgrid`, `SENDGRID_API_KEY`, `NODE_ENV=production`. Health check path `/health`.
- **Cobertura**: RN44, Deploy
- **Dependencias**: T28, T06 (Neon prod branch)
- **Criterios Done**:
  - [ ] `https://reserva-club-backend.onrender.com/health` → 200
  - [ ] POST `/auth/register` en prod → 201 + cookies Secure
  - [ ] Logs Render sin errores de conexión DB

### T30: Deploy Frontend - Netlify
- **Agente**: `@arquitecto` / `@frontend`
- **Descripción**: Conectar repo a Netlify. Build command: `npm ci && npm run build`. Publish directory: `dist`. Env vars: `VITE_API_URL=https://reserva-club-backend.onrender.com`. Redirects SPA (`/* /index.html 200`). Custom domain opcional.
- **Cobertura**: Deploy
- **Dependencias**: T28, T29 (backend URL)
- **Criterios Done**:
  - [ ] `https://reserva-club.netlify.app` carga Home
  - [ ] Login → redirige a `/mis-reservas` funcional
  - [ ] Requests a API van a backend prod (Network tab)

### T31: Verificación End-to-End en Producción
- **Agente**: `@tester` / `@revisor` / `@analista`
- **Descripción**: Ejecutar flujos críticos manuales en URLs prod:
  1. Invitado ve disponibilidad → precios base
  2. Registro no_socio → login → reserva pádel → check-in → completada
  3. Registro socio (admin cambia rol) → reserva con descuento 20%
  4. Cancelación >24h → gratis; <24h → 50% cargo
  5. Lista espera: 2 usuarios mismo slot → 1ro promocionado → confirma → 2do espera
  6. Admin: crea feriado → precio recalcula; override reserva → audit log
  7. Inasistencia: no check-in → job marca → 3ra → bloqueo 30d
- **Cobertura**: Todas las HU + RN críticas
- **Dependencias**: T29, T30
- **Criterios Done**:
  - [ ] Checklist arriba 100% verde en prod
  - [ ] `@revisor` firma off: seguridad (headers, cookies, secrets), performance aceptable
  - [ ] `@analista` valida: spec.md cumplido, pendientes = 0

### T32: Documentación Final + Tag Release
- **Agente**: `@arquitecto` / `@analista`
- **Descripción**: Actualizar `README.md` con: descripción, stack, arquitectura, setup local, deploy, variables env, scripts útiles, enlaces prod. `CHANGELOG.md` v1.0.0. Tag `v1.0.0-mvp`. Push tags.
- **Cobertura**: Entregable final
- **Dependencias**: T31
- **Criterios Done**:
  - [ ] README completo y preciso
  - [ ] Tag `v1.0.0-mvp` en GitHub
  - [ ] Repo público accesible para evaluación

---

## MATRIZ DE DEPENDENCIAS CRÍTICAS (Orden de Ejecución)

```
T01 → T02 → T03
  ↓
T04 → T05 (paralelo)
  ↓
T06 → T07
  ↓
T08 → T09 → T10 → T11 → T12
  ↓                    ↓
  ↓              T13 ← T14 (PrecioService antes de Disponibilidad)
  ↓                    ↓
  ↓              T15 → T16 → T17
  ↓                    ↓
  ↓              T18, T19, T20, T21, T22 (paralelo, todos usan T12,T15,T16)
  ↓
T23 (Auth FE) → T24 → T25 → T26
  ↓              ↓      ↓      ↓
  └──────────────┴──────┴──────→ T27 (Admin FE usa todos los endpoints)
                                    ↓
                                 T28 (CI)
                                    ↓
                                 T29 → T30 → T31 → T32
```

---

## RESUMEN POR AGENTE

| Agente | Tareas Principales |
|--------|-------------------|
| `@arquitecto` | T01, T02, T03, T06, T28, T29, T30, T32 |
| `@backend` | T04, T07, T08, T09, T10, T11, T12, T13, T14, T15, T16, T17, T18, T19, T20, T21, T22 |
| `@frontend` | T05, T23, T24, T25, T26, T27 |
| `@tester` | **Escribe tests ANTES** de cada T08-T27 (TDD estricto) |
| `@revisor` | Audita cada tarea completada antes de commit |
| `@analista` | Valida spec/plan/tasks coherencia, cierra pendientes |

---

## CRITERIOS GLOBALES DE ACEPTACIÓN DEL PROYECTO

- [ ] **Spec.md**: 0 pendientes, todas las RN trazadas a HU y tareas
- [ ] **Tests**: Cobertura services ≥ 95%, integración ≥ 80%, E2E flujos críticos
- [ ] **Git**: Historial limpio, commits por tarea, tags `v0.0.1-foundation`, `v1.0.0-mvp`
- [ ] **Seguridad**: Secrets solo en panels, bcrypt 12, JWT rotativo, rate limit, Helmet, CORS estricto
- [ ] **Deploy**: Backend Render + Frontend Netlify + DB Neon funcionando en prod
- [ ] **Flujos E2E**: 7 flujos críticos verificados en producción (T31)
- [ ] **Documentación**: README, CHANGELOG, spec/plan/tasks sincronizados

---

**Fin del tasks.md** — Listo para sprint. Próximo: `@arquitecto` ejecuta T01-T03, `@backend` T04, `@frontend` T05 en paralelo.