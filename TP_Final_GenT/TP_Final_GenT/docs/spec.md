# spec.md - Especificación Técnica Formal
## Reserva Club - Club Atlético Villanorte

> **Contrato formal tripartito**: Cliente • Equipo • IA
> **Versión**: 1.0 | **Estado**: Cerrado para desarrollo | **Pendientes**: 0
> **Fuentes**: `idea.md`, `decisions.md`, `glosario.md`, `preguntas_abiertas.md`

---

## 1. Objetivo del Sistema

Desarrollar una aplicación web para la gestión integral de reservas de canchas deportivas del Club Atlético Villanorte, reemplazando la operación manual vía WhatsApp. El sistema debe garantizar **integridad de datos** (cero solapamientos), **trazabilidad completa** (auditoría de cada acción), **aplicación automática de reglas de negocio** (tarifas, penalidades, cupos) y **experiencia de usuario fluida** (disponibilidad en tiempo real, listas de espera, notificaciones).

**Problema a resolver**: Solapamientos de turnos, pérdidas económicas por no-shows sin penalidad, gestión manual propensa a errores, ausencia de historial y reportes.

---

## 2. Usuarios y Roles

| Rol | Descripción | Permisos Clave |
|-----|-------------|----------------|
| **Invitado** | No autenticado | Ver disponibilidad pública (calendario read-only) |
| **No Socio** | Registrado, sin cuota | Reservar (anticipación 3d, cupo 1), ver historial propio, lista de espera, cancelar |
| **Socio** | Registrado, cuota vigente | Reservar (anticipación 7d, cupo 2, 20% desc.), ver historial, lista de espera, cancelar |
| **Administrador** | Staff del club | CRUD total: canchas, horarios, tarifas, feriados, mantenimiento, usuarios, reportes, auditoría, overrides |

**Transiciones de rol**: `no_socio` → `socio` (admin actualiza tras pago cuota). `socio` → `no_socio` (vencimiento cuota, ver PA06).

---

## 3. Alcance (Scope)

### INCLUIDO (v1 - MVP)
- ✅ Gestión de canchas (3 tipos, 6 canchas totales) con duraciones fijas
- ✅ Motor de precios: base + recargo pico (configurable) + recargo fin de semana/feriado + descuento socio
- ✅ Reservas con estados completos y transiciones válidas
- ✅ Cupos semanales por rol (rolling Monday-Sunday)
- ✅ Cancelaciones: gratuita (>24h) / con cargo 50% (≤24h)
- ✅ Inasistencias: tolerancia 15 min, auto-marque, bloqueo 3 en 30d rolling
- ✅ Listas de espera FIFO por (cancha, fecha, hora) exactos, notificación email, ventana 30 min
- ✅ Control de concurrencia estricto (transacciones BD)
- ✅ Bloqueos por mantenimiento (puntuales + recurrentes)
- ✅ Precio histórico inmutable al momento de reserva
- ✅ Admin overrides con auditoría completa
- ✅ Auth JWT (access + refresh), roles, middleware protección
- ✅ API REST + OpenAPI spec
- ✅ Tests unitarios + integración (TDD obligatorio)
- ✅ Deploy: Frontend (Netlify), Backend (Render), DB (Neon PostgreSQL)

### EXCLUIDO (v1)
- ❌ Pasarela de pagos online (ver PA02)
- ❌ App móvil nativa / PWA
- ❌ Notificaciones WhatsApp / SMS / Push (ver PA05)
- ❌ Multisede / franquicias (ver PA03)
- ❌ Torneos, ligas, rankings
- ❌ Check-in por QR/NFC en cancha (ver PA04)
- ❌ Módulo contable / facturación automática
- ❌ i18n multi-idioma (ver PA09)

---

## 4. Reglas de Negocio (RN)

> Numeradas, medibles, trazables a HU. Formato: `RN##: Descripción medible.`

### 4.1 Inventario y Disponibilidad
- **RN01**: El sistema opera en zona horaria **America/Argentina/Buenos_Aires (UTC-3)**. Todos los cálculos de día, medianoche, franjas y tolerancias usan esta TZ.
- **RN02**: Horario de operación: **08:00 a 24:00**. El último slot inicia a las 23:00 (fútbol 60min) o 22:30 (pádel/tenis 90min).
- **RN03**: Canchas y duraciones fijas:
  - Fútbol 5 (2 canchas): 60 min/turno
  - Pádel (3 canchas): 90 min/turno
  - Tenis (1 cancha): 90 min/turno
- **RN04**: Un **slot** = tupla única `(cancha_id, fecha, hora_inicio)`. No pueden existir dos reservas confirmadas/en_espera para el mismo slot.
- **RN05**: Bloqueos por mantenimiento (admin) anulan disponibilidad en rango `(cancha_id, fecha_inicio, fecha_fin, hora_inicio, hora_fin, recurrencia?)`.

### 4.2 Tarifas y Cálculo de Precio
- **RN06**: Precio base configurable por cancha (admin).
- **RN07**: Recargo horario pico: **+30%** si `hora_inicio` ∈ franjas pico configurables (default: Lun-Vie 18:00-22:00). Se evalúa solo hora de inicio.
- **RN08**: Recargo fin de semana/feriado: **+30%** si `fecha` es sábado, domingo o feriado cargado. Sumable con pico.
- **RN09**: Descuento socio: **-20%** sobre subtotal (base + recargos). Aplica solo si usuario tiene rol `socio` Y cuota vigente al momento de crear reserva.
- **RN10**: Feriados: carga manual admin (fecha + nombre + recurrencia_anual?). No recalculan reservas previas (RN13).
- **RN11**: Franjas pico: configurables por admin (días semana + hora_inicio + hora_fin). Default: Lun-Vie 18:00-22:00.
- **RN12**: **Precio final** = `ROUND(precio_base × (1 + recargo_pico + recargo_fds) × (1 - desc_socio), 2)`. Redondeo 2 decimales, half-up.

### 4.3 Anticipación y Cupos
- **RN13**: Anticipación máxima: Socio **7 días**, No Socio **3 días**. Cuenta desde hoy (día 0) inclusive.
- **RN14**: Cupo semanal de reservas activas (`confirmada` + `en_espera_confirmacion`): Socio **2**, No Socio **1**. Semana calendario: Lunes 00:00 - Domingo 23:59.
- **RN15**: Cupo se verifica al **crear** reserva. Si excede → rechazo 409.
- **RN16**: Cupo se **libera inmediato** al: cancelar (gratis o con cargo), completar (check-out o fin horario), inasistencia (auto-marque).

### 4.4 Reservas - Ciclo de Vida
- **RN17**: Estados válidos y transiciones:
  ```
  pendiente_pago → confirmada → completada
                      ↓
                  cancelada_gratis (si >24h)
                  cancelada_con_cargo (si ≤24h, 50%)
                      ↓
                  inasistencia (auto a los 15 min post hora_inicio sin check-in)
  ```
  `en_espera_confirmacion` → (confirma en 30min) → `confirmada` | (expira) → slot libre
- **RN18**: Solo No Socios pueden tener `pendiente_pago` si se requiere prepago (configurable). Socios siempre `confirmada` directo.
- **RN19**: Al crear reserva, se guarda **historial de precios inmutable**: precio_base, recargo_pico, recargo_fds, desc_socio, total_final, timestamps.
- **RN20**: Cambios de tarifa base / recargos / feriados **posteriores** no afectan reservas ya creadas (RN19).

### 4.5 Cancelaciones
- **RN21**: Cancelación **gratuita** si `now < hora_inicio - 24h`. Estado → `cancelada_gratis`. Sin cargo. Cupo libera (RN16).
- **RN22**: Cancelación **con cargo 50%** si `now ≥ hora_inicio - 24h`. Estado → `cancelada_con_cargo`. Se registra deuda 50% total_final. Cupo libera (RN16).
- **RN23**: Admin puede cancelar cualquier reserva (override). Sin cargo para usuario. Auditado.

### 4.6 Inasistencias y Bloqueo
- **RN24**: Tolerancia check-in: **15 minutos** posterior a `hora_inicio`. Ventana: `[hora_inicio - 15min, hora_inicio + 15min]`.
- **RN25**: Sin check-in a `hora_inicio + 15:01` → estado `inasistencia` automático (job o trigger BD). Cancha libera para lista de espera.
- **RN26**: Botón "Cancelar" en frontend se deshabilita exactamente a `hora_inicio` (no antes).
- **RN27**: Contador inasistencias: **ventana deslizante 30 días corridos** (rolling). Cada inasistencia suma 1; las >30d expiran.
- **RN28**: Al alcanzar **3 inasistencias** en ventana → **bloqueo automático 30 días** desde esa 3ra inasistencia. Usuario no puede crear reservas. Admin puede revertir (auditado).

### 4.7 Listas de Espera
- **RN29**: Lista FIFO por **clave exacta** `(cancha_id, fecha, hora_inicio)`. No agrupa por tipo de cancha.
- **RN30**: Usuario puede estar en múltiples listas (distintas claves). Una entrada por clave por usuario.
- **RN31**: Al liberarse slot (cancelación o inasistencia) → notifica al 1ro de la lista (email simulado). Estado → `en_espera_confirmacion`.
- **RN32**: Ventana confirmación: **30 minutos** desde notificación. Si confirma → `confirmada` (cupo verificado). Si expira/no confirma → pasa al siguiente.
- **RN33**: Si usuario en lista ya tiene reserva en ese mismo slot (imposible por RN04) o excede cupo al confirmar → se salta y pasa al siguiente.

### 4.8 Concurrencia
- **RN34**: Crear reserva: transacción BD con **lock pesimista** (`SELECT FOR UPDATE` en slot) o **optimista** (version row). Debe garantizar atomicidad check-disponibilidad + insert.
- **RN35**: Lista de espera: misma garantía al promocionar (slot libre → asignar a 1ro de lista atómicamente).

### 4.9 Administrador - Overrides y Auditoría
- **RN36**: Admin puede: reservar fuera de horario, exceder cupos, precio $0, saltar lista de espera, cancelar sin cargo, revertir bloqueo inasistencias.
- **RN37**: **Toda acción admin** genera entrada en `audit_log`: `admin_id`, `accion`, `entidad_id`, `detalle_json`, `timestamp`, `motivo_opcional`.
- **RN38**: Admin CRUD feriados, franjas pico, precios base, bloqueos mantenimiento, usuarios (roles, cuota, bloqueo manual).

### 4.10 Autenticación y Seguridad
- **RN39**: Auth: JWT Access Token (15min) + Refresh Token (7d, rotación, revocación). Guardado HttpOnly Secure cookie + header Authorization.
- **RN40**: Passwords: **bcrypt** (cost 12). Nunca en logs.
- **RN41**: Endpoints protegidos: middleware valida access token, extrae `user_id`, `rol`. Verifica permisos por rol.
- **RN42**: Rate limiting: auth endpoints (login/register) 10 req/min/IP. API general 100 req/min/user.
- **RN43**: CORS: solo origen frontend permitido. Helmet headers.
- **RN44**: Variables de entorno: **NUNCA** en código ni repo. `.env` local only. Producción: variables en panel proveedor (Render/Neon/Netlify).

---

## 5. Historias de Usuario (HU) y Criterios de Aceptación (Gherkin)

> Formato: `HU##: Como [rol] quiero [acción] para [beneficio]`. Cada HU vincula RN. Criterios en Gherkin `Dado... Cuando... Entonces...`.

### 5.1 Autenticación y Acceso

#### HU01: Registro de usuario
**Como** visitante **quiero** registrarme con email y contraseña **para** acceder a reservas.
**RN**: RN39, RN40, RN41
```
Dado que no tengo cuenta
Cuando envío POST /auth/register con email válido y password ≥8 chars
Entonces recibo 201, access+refresh tokens en cookies HttpOnly, y mi rol es "no_socio"
```

#### HU02: Inicio de sesión
**Como** usuario registrado **quiero** loguearme **para** obtener tokens de acceso.
**RN**: RN39, RN40, RN41
```
Dado que tengo cuenta activa
Cuando envío POST /auth/login con credenciales correctas
Entonces recibo 200, access+refresh tokens, y puedo acceder a endpoints protegidos
```

#### HU03: Refresh token
**Como** usuario autenticado **quiero** renovar mi access token **para** seguir operando sin reloguear.
**RN**: RN39
```
Dado que mi access token expiró pero mi refresh token es válido
Cuando envío POST /auth/refresh con cookie refresh_token
Entonces recibo nuevo access token (15min) y nuevo refresh token (rotado)
```

#### HU04: Cerrar sesión
**Como** usuario **quiero** cerrar sesión **para** invalidar mis tokens.
**RN**: RN39
```
Dado que estoy logueado
Cuando envío POST /auth/logout
Entonces mis refresh tokens son revocados y cookies limpiadas
```

---

### 5.2 Disponibilidad y Consulta Pública

#### HU05: Ver disponibilidad (invitado/usuario)
**Como** invitado o usuario **quiero** ver horarios libres de una cancha en una fecha **para** elegir mi turno.
**RN**: RN01-RN05, RN07-RN11
```
Dado que consulto GET /canchas/:id/disponibilidad?fecha=2025-01-20
Cuando la cancha existe y la fecha es válida
Entonces recibo 200 con array de slots: [{hora_inicio, hora_fin, precio_final, disponible: true/false, motivo_si_no}]
Y los precios reflejan recargos pico/fds y descuento socio (si autenticado)
Y slots en mantenimiento o pasados muestran disponible=false
```

---

### 5.3 Reservas - Creación

#### HU06: Crear reserva (Socio)
**Como** socio con cuota vigente **quiero** reservar una cancha **para** jugar en mi horario preferido.
**RN**: RN04, RN06-RN09, RN13, RN14, RN15, RN17-RN19, RN34
```
Dado que soy socio autenticado con cuota vigente
Y existe slot libre (cancha Pádel 1, 2025-01-20, 20:00) dentro de mi anticipación (≤7d)
Y no excedo mi cupo semanal (≤2 activas)
Cuando envío POST /reservas con {cancha_id, fecha, hora_inicio}
Entonces recibo 201 con reserva {id, estado: "confirmada", precio_final, historial_precios}
Y el slot queda bloqueado para otros usuarios
Y mi cupo semanal disminuye en 1
```

#### HU07: Crear reserva (No Socio)
**Como** no socio **quiero** reservar una cancha **para** jugar ocasionalmente.
**RN**: RN04, RN06-RN09, RN13, RN14, RN15, RN17-RN19, RN34
```
Dado que soy no socio autenticado
Y existe slot libre dentro de mi anticipación (≤3d)
Y no excedo mi cupo semanal (≤1 activa)
Cuando envío POST /reservas con {cancha_id, fecha, hora_inicio}
Entonces recibo 201 con reserva {id, estado: "confirmada", precio_final}
```

#### HU08: Rechazo por cupo excedido
**Como** usuario **quiero** que el sistema me avise si excedo mi cupo **para** no perder tiempo.
**RN**: RN14, RN15
```
Dado que ya tengo 2 reservas activas esta semana (socio) / 1 (no socio)
Cuando intento crear una 3ra / 2da reserva
Entonces recibo 409 {error: "CUPO_SEMANAL_EXCEDIDO", limite: 2, actuales: 2}
```

#### HU09: Rechazo por anticipación
**Como** usuario **quiero** saber si estoy fuera de plazo **para** planificar mejor.
**RN**: RN13
```
Dado que hoy es 2025-01-13
Y soy socio (anticipación 7d) / no socio (3d)
Cuando intento reservar para 2025-01-21 (8d) / 2025-01-17 (4d)
Entonces recibo 409 {error: "ANTICIPACION_EXCEDIDA", maxima_dias: 7, solicitados: 8}
```

#### HU10: Rechazo por slot ocupado (concurrencia)
**Como** usuario **quiero** que el sistema maneje reservas simultáneas **para** no tener conflictos.
**RN**: RN04, RN34
```
Dado que dos usuarios envían POST /reservas para el mismo slot al mismo milisegundo
Cuando la BD procesa ambas transacciones
Entonces exactamente una recibe 201 y la otra 409 {error: "SLOT_OCUPADO"}
Y no queda reserva huérfana ni duplicada
```

---

### 5.4 Reservas - Cancelación

#### HU11: Cancelar gratis (>24h)
**Como** usuario **quiero** cancelar sin cargo si aviso con tiempo **para** no perder dinero.
**RN**: RN21, RN16
```
Dado que tengo reserva confirmada para 2025-01-20 20:00
Y ahora es 2025-01-19 10:00 (>24h)
Cuando envío DELETE /reservas/:id
Entonces recibo 200 {estado: "cancelada_gratis", cargo: 0}
Y mi cupo semanal libera inmediato
Y el slot queda libre para lista de espera / público
```

#### HU12: Cancelar con cargo (≤24h)
**Como** usuario **quiero** cancelar aunque falte poco **para** liberar el turno, aceptando el cargo.
**RN**: RN22, RN16
```
Dado que tengo reserva confirmada para 2025-01-20 20:00
Y ahora es 2025-01-19 21:00 (≤24h)
Cuando envío DELETE /reservas/:id
Entonces recibo 200 {estado: "cancelada_con_cargo", cargo: 50% total_final}
Y se registra deuda de 50% en mi cuenta
Y mi cupo semanal libera inmediato
Y el slot queda libre para lista de espera / público
```

---

### 5.5 Check-in / Inasistencia

#### HU13: Check-in en ventana
**Como** usuario **quiero** hacer check-in al llegar **para** registrar mi presencia.
**RN**: RN24, RN25
```
Dado que mi reserva es para 2025-01-20 20:00
Y estoy en ventana [19:45, 20:15]
Cuando envío POST /reservas/:id/checkin
Entonces recibo 200 {checkin_en: timestamp}
Y mi reserva sigue en estado "confirmada"
```

#### HU14: Inasistencia automática
**Como** sistema **quiero** marcar inasistencia si no hay check-in **para** liberar la cancha y aplicar penalidad.
**RN**: RN24, RN25, RN26, RN27, RN28
```
Dado que mi reserva es para 2025-01-20 20:00
Y no hice check-in hasta 20:15:01
Cuando el job/trigger ejecuta a las 20:15:01
Entonces mi reserva pasa a estado "inasistencia"
Y se incrementa mi contador rolling 30d
Y si es mi 3ra inasistencia en 30d → me bloquean 30d (bloqueado_hasta = now + 30d)
Y el slot queda libre para lista de espera
Y recibo email de notificación
```

#### HU15: Botón cancelar se deshabilita a la hora
**Como** usuario **quiero** que no pueda cancelar a último momento **para** evitar abusos.
**RN**: RN26
```
Dado que mi reserva es para 20:00
Y son las 19:59
Cuando veo mi reserva en frontend
Entonces el botón "Cancelar" está habilitado
Y a las 20:00:00 el botón se deshabilita (solo lectura)
```

---

### 5.6 Listas de Espera

#### HU16: Unirse a lista de espera
**Como** usuario **quiero** anotarme en lista de espera **para** que me avisen si se libera el turno.
**RN**: RN29, RN30
```
Dado que el slot (Pádel 1, 2025-01-20, 20:00) está ocupado
Y no estoy ya en esa lista
Cuando envío POST /listas-espera con {cancha_id, fecha, hora_inicio}
Entonces recibo 201 {posicion: N, notificacion: "email"}
Y mi posición es FIFO por timestamp creación
```

#### HU17: Promoción automática desde lista
**Como** usuario en lista **quiero** que me asignen el turno si se libera **para** no perder la oportunidad.
**RN**: RN31, RN32, RN33, RN35
```
Dado que soy 1ro en lista para (Pádel 1, 2025-01-20, 20:00)
Y se cancela la reserva de ese slot
Cuando el sistema procesa la liberación
Entonces mi entrada pasa a estado "en_espera_confirmacion"
Y recibo email "¡Tu turno está disponible! Tienes 30 min para confirmar"
Y tengo 30 min para PUT /listas-espera/:id/confirmar
```

#### HU18: Confirmar desde lista
**Como** usuario notificado **quiero** confirmar mi turno **para** quedármelo.
**RN**: RN32, RN33
```
Dado que estoy en "en_espera_confirmacion" para un slot
Y tengo cupo semanal disponible
Cuando envío PUT /listas-espera/:id/confirmar dentro de 30 min
Entonces mi reserva se crea en estado "confirmada"
Y mi cupo semanal disminuye
Y salgo de la lista
```

#### HU19: Expiración ventana confirmación
**Como** sistema **quiero** pasar al siguiente si no confirman **para** no bloquear el slot.
**RN**: RN32
```
Dado que fui notificado y no confirmé en 30 min
Cuando expira la ventana
Entonces mi entrada en lista se elimina
Y el siguiente en lista es notificado (nueva ventana 30 min)
Y el slot queda libre si no hay más en lista
```

---

### 5.7 Administración

#### HU20: Admin crea cancha
**Como** admin **quiero** dar de alta canchas **para** que estén disponibles.
**RN**: RN03, RN06
```
Dado que soy admin autenticado
Cuando envío POST /admin/canchas con {tipo, nombre, precio_base, activa: true}
Entonces recibo 201 con cancha creada y puede recibir reservas
```

#### HU21: Admin configura feriados
**Como** admin **quiero** cargar feriados **para** que apliquen recargo.
**RN**: RN10
```
Dado que soy admin
Cuando envío POST /admin/feriados con {fecha, nombre, recurrencia_anual: true}
Entonces el feriado aplica recargo fds (+30%) a reservas nuevas en esa fecha
Y no afecta reservas ya creadas (precio histórico)
```

#### HU22: Admin configura franjas pico
**Como** admin **quiero** definir horarios pico **para** maximizar ingresos.
**RN**: RN11
```
Dado que soy admin
Cuando envío POST /admin/franjas-pico con {dias_semana: [1-5], hora_inicio: "18:00", hora_fin: "22:00"}
Entonces las reservas nuevas en esas franjas tienen +30% recargo
```

#### HU23: Admin bloqueo mantenimiento
**Como** admin **quiero** bloquear canchas por mantenimiento **para** que no se reserven.
**RN**: RN05
```
Dado que soy admin
Cuando envío POST /admin/bloqueos con {cancha_id, fecha_inicio, fecha_fin, hora_inicio, hora_fin, recurrencia: "semanal"}
Entonces esos slots muestran disponible=false en público
Y no se pueden reservar (ni admin override sin auditoría)
```

#### HU24: Admin override reserva
**Como** admin **quiero** hacer reservas especiales **para** atender casos excepcionales.
**RN**: RN36, RN37
```
Dado que soy admin
Cuando envío POST /admin/reservas-override con {usuario_id, cancha_id, fecha, hora_inicio, precio_override: 0, motivo: "Evento club"}
Entonces se crea reserva "confirmada" sin validar cupo/anticipación/horario
Y se registra en audit_log con mis datos y motivo
```

#### HU25: Admin ve auditoría
**Como** admin **quiero** ver log de acciones **para** trazabilidad.
**RN**: RN37
```
Dado que soy admin
Cuando consulto GET /admin/auditoria?desde=2025-01-01&hasta=2025-01-31
Entonces recibo lista paginada de acciones con admin_id, accion, entidad, timestamp, motivo
```

---

### 5.8 Reportes (Alcance Mínimo MVP)

#### HU26: Reporte ocupación
**Como** admin **quiero** ver ocupación por cancha/horario **para** optimizar recursos.
**RN**: RN07 (parcial - ver PA07)
```
Dado que soy admin
Cuando consulto GET /admin/reportes/ocupacion?desde=2025-01-01&hasta=2025-01-31
Entonces recibo % ocupación por cancha y franja horaria
```

---

## 6. Casos Borde (Edge Cases)

| ID | Caso | Comportamiento Esperado | RN Relacionadas |
|----|------|------------------------|-----------------|
| EC01 | Reserva cruza medianoche (ej: 23:30-01:00) | **Prohibido**: horario operación 08:00-24:00. Último inicio 23:00 (futbol) / 22:30 (pádel/tenis) | RN02 |
| EC02 | Feriado cargado después de reserva | Precio histórico respetado (no recalcula) | RN10, RN19, RN20 |
| EC03 | Usuario socio → no socio (cuota vence) entre reserva y turno | Al crear reserva se verifica cuota vigente. Si vence después, reserva se mantiene (no se cancela auto). Próximas reservas verán rol actualizado. | RN09, PA06 |
| EC04 | Cambio de precio base entre reserva y turno | Precio histórico inmutable (RN19, RN20) | RN19, RN20 |
| EC05 | Usuario en lista de espera ya tiene reserva en mismo slot | Imposible por RN04 (slot único). Si bug → validación en promoción salta al siguiente (RN33) | RN04, RN33 |
| EC06 | Usuario confirma lista de espera pero excede cupo semanal | Se salta al siguiente en lista (RN33). Usuario notificado "cupo excedido, perdiste turno" | RN14, RN33 |
| EC07 | Cancelación admin de reserva en lista de espera | Admin puede cancelar entrada en lista → pasa al siguiente. Auditado. | RN36, RN37 |
| EC08 | Bloqueo mantenimiento recurrente en feriado | Mantenimiento tiene prioridad: slot no disponible aunque sea feriado | RN05 |
| EC09 | Check-in attempt después de inasistencia marcada | Rechazo 409 {error: "RESERVA_INASISTENCIA", mensaje: "Ya se marcó inasistencia"} | RN25 |
| EC10 | Refresh token robado / reutilizado | Rotación: cada uso invalida el anterior. Reuso → revocación cadena completa + logout forzado | RN39 |
| EC11 | Concurrencia: 2 admins modifican misma cancha | Optimistic locking en entidad cancha (version). 2do recibe 409 "CONFLICTO_VERSION" | RN34 (extendido) |
| EC12 | Usuario bloqueado por inasistencias intenta unirse a lista | Permitido (lista ≠ reserva activa). Pero al promocionar, si sigue bloqueado → salta al siguiente | RN28, RN33 |
| EC13 | Reserva de 90 min (pádel) - siguiente slot | Slot 20:00-21:30 → siguiente disponible 21:30 (no 21:00). Respeta duración exacta | RN03, RN04 |
| EC14 | DST / cambio horario verano-invierno | Zona horaria fija America/Argentina/Buenos_Aires (no hay DST en ARG desde 2009). Si camba legislación → actualizar TZ en config. | RN01 |
| EC15 | Email notificación falla (simulado) | Log de error, reintento job nocturno. No bloquea flujo. | RN31, RN32 |

---

## 7. Sección de Pendientes

> **REGLA DE ORO**: La IA **NO DEBE INVENTAR LÓGICA**. Cada pendiente aquí debe resolverse en `decisions.md` ANTES de codificar.

**ESTADO ACTUAL: 0 PENDIENTES** ✅

Todas las dudas de la auditoría funcional (Clase 2-3) fueron resueltas y volcadas a `decisions.md` (D01-D11). Las preguntas abiertas que requieren cliente (PA01-PA11) están documentadas en `preguntas_abiertas.md` y **no bloquean el desarrollo del MVP** (son mejoras v2+ o decisiones de alcance).

---

## Anexo: Matriz Trazabilidad HU ↔ RN

| HU | RN Principales |
|----|----------------|
| HU01-HU04 | RN39, RN40, RN41, RN42, RN43, RN44 |
| HU05 | RN01-RN05, RN07-RN11 |
| HU06-HU10 | RN04, RN06-RN09, RN13-RN15, RN17-RN19, RN34 |
| HU11-HU12 | RN16, RN21, RN22 |
| HU13-HU15 | RN24-RN26, RN27, RN28 |
| HU16-HU19 | RN29-RN33, RN35 |
| HU20-HU25 | RN03, RN05, RN06, RN10, RN11, RN36, RN37 |
| HU26 | RN07 (parcial) |

---

**Fin del spec.md** — Aprobado para desarrollo. Próximo paso: `plan.md` (Arquitecto) → `tasks.md` (Arquitecto) → Inicialización Git + AGENTS.md + Subagentes.