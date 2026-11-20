# Glosario de Términos - Reserva Club

> Definiciones precisas para blindar el contexto de la IA y evitar dobles interpretaciones.

---

## A

**Administrador**: Usuario con rol `admin`. Acceso total al panel de gestión: CRUD canchas, horarios, tarifas, feriados, mantenimiento, usuarios, reportes, auditoría. No está sujeto a cupos ni anticipación.

**Anticipación máxima**: Días de adelanto permitidos para crear una reserva. Socios: 7 días. No socios: 3 días. Se cuenta desde la fecha actual (día 0) hasta la fecha del turno inclusive.

---

## B

**Bloqueo por mantenimiento**: Intervalos de tiempo en que una cancha no está disponible para reservas, definidos por admin. Pueden ser puntuales o recurrentes (semanal/mensual). Se visualizan en calendario con color distintivo.

**Bloqueo por inasistencias**: Suspensión automática de 30 días para reservar, activada al acumular 3 inasistencias en ventana deslizante de 30 días. El usuario ve mensaje de bloqueo al intentar reservar; admin puede revertir manualmente con auditoría.

---

## C

**Cancha**: Recurso reservable identificado por `cancha_id`, con tipo (Fútbol 5 / Pádel / Tenis), nombre visible ("Cancha Pádel 2"), duración de turno fija (60 o 90 min), precio base por turno, y estado (activa / mantenimiento / inactiva).

**Check-in**: Acción de registrar presencia al inicio del turno. Disponible desde 15 min antes hasta 15 min después de la hora de inicio. Si no hay check-in a los 15 min → inasistencia automática.

**Check-out**: Acción opcional al finalizar el turno. Libera la cancha antes de tiempo si el usuario se va temprano. No afecta facturación.

**Concurrencia (control de)**: Mecanismo que previene que dos usuarios reserven el mismo slot (cancha + fecha + hora inicio) simultáneamente. Implementado con transacción BD + lock optimista (versionado) o pesimista (SELECT FOR UPDATE).

**Cupo semanal activo**: Número máximo de reservas con estado `confirmada` o `en_espera_confirmacion` que un usuario puede tener simultáneamente en una semana calendario (lunes-domingo). Socio: 2. No socio: 1. Al cancelar/completar/no-show, el cupo se libera inmediato.

---

## D

**Deuda**: Monto pendiente de pago por cancelaciones con cargo (50% del turno) o inasistencias según política del club. Se registra en cuenta del usuario. Bloquea nuevas reservas si supera umbral configurable (default: $0 = no bloquea por defecto).

**Duración de turno**: Tiempo fijo por tipo de cancha. Fútbol 5: 60 min. Pádel: 90 min. Tenis: 90 min. No configurable por reserva individual.

---

## E

**Estado de reserva**:
- `pendiente_pago` → creada, esperando confirmación (solo no socios si se requiere prepago)
- `confirmada` → activa, cuenta para cupo semanal
- `en_espera_confirmacion` → asignada desde lista de espera, ventana 30 min para confirmar
- `cancelada_gratis` → cancelada >24h, sin cargo
- `cancelada_con_cargo` → cancelada ≤24h, 50% cargo
- `completada` → check-in + check-out (o fin horario)
- `inasistencia` → no check-in a los 15 min de tolerancia

---

## F

**Feriado**: Fecha no laborable definida por admin (fecha + nombre + opcional recurrencia anual). Aplica recargo fin de semana (+30%) para reservas en ese día. **No recalcula** precios de reservas ya hechas (precio histórico).

**Franja horaria pico**: Rango de horas configurables por admin donde aplica recargo +30%. Por defecto: Lunes-Viernes 18:00-22:00. Se evalúa al momento de calcular precio de la reserva.

---

## H

**Historial de precios**: Registro inmutable del precio unitario, recargos aplicados, descuentos y total final al momento de crear la reserva. Permite auditoría y respeta precio acordado aunque cambien tarifas después.

---

## I

**Inasistencia (no-show)**: Falta de check-in dentro de los 15 minutos posteriores a la hora de inicio del turno. Genera: (1) marca `inasistencia` en reserva, (2) libera cancha para lista de espera / público, (3) suma 1 al contador rolling 30 días, (4) si llega a 3 → bloqueo 30 días.

**Invitado**: Usuario no autenticado. Solo puede ver disponibilidad (calendario público). No puede reservar, unirse a listas de espera ni ver historial.

---

## L

**Lista de espera**: Cola FIFO por **(cancha_id, fecha, hora_inicio)** exactos. Cuando se libera un slot (cancelación o no-show), se notifica al primero por email. Tiene 30 min para confirmar → pasa a `en_espera_confirmacion` → `confirmada`. Si no confirma → pasa al siguiente. Un usuario puede estar en múltiples listas (distintas canchas/horarios).

---

## M

**Mantenimiento (bloqueo por)**: Ver "Bloqueo por mantenimiento".

---

## N

**No Socio**: Usuario registrado sin cuota al día. Condiciones: precio base (sin 20% descuento), anticipación 3 días, cupo 1 reserva activa, sin beneficios de socio. Puede asociarse (cambio de rol) tras pago de cuota → admin actualiza rol.

**Notificación email**: Envío automático (simulado en dev) para: confirmación reserva, recordatorio 24h antes, aviso lista de espera (30 min para confirmar), cancelación, inasistencia, bloqueo por inasistencias. Template configurable.

---

## P

**Precio base**: Valor por turno de una cancha sin recargos ni descuentos. Configurable por admin por cancha.

**Precio final**: `precio_base × (1 + recargo_pico_si_aplica + recargo_fin_semana_si_aplica) × (1 - descuento_socio_si_aplica)`. Redondeo a 2 decimales. Se guarda en historial de precios.

**Pendiente (sección de)**: Espacio en `spec.md` donde la IA registra lagunas detectadas durante redacción. **Prohibido inventar lógica**; cada pendiente debe resolverse en `decisions.md` antes de codificar.

---

## R

**Recargo horario pico**: +30% sobre precio base si la hora de inicio del turno cae dentro de franja pico configurada. Se evalúa solo la hora de inicio, no la duración completa.

**Recargo fin de semana / feriado**: +30% sobre precio base (sumable con pico) si la fecha del turno es sábado, domingo o feriado cargado. Aplica a toda la reserva.

**Reserva**: Entidad central que vincula: usuario, cancha, fecha, hora_inicio, duracion (derivada de cancha), precio_final, estado, timestamps (creación, check-in, check-out/cancelación), historial_precios.

**Reserva activa**: Reserva en estado `confirmada` o `en_espera_confirmacion`. Cuenta para cupo semanal.

**Rolling window (ventana deslizante)**: Período de 30 días corridos hacia atrás desde la fecha actual, usado para contar inasistencias. Cada día la ventana "se mueve"; inasistencias >30 días expiran del conteo.

---

## S

**Socio**: Usuario con cuota al día (rol `socio`). Beneficios: 20% descuento sobre precio final, anticipación 7 días, cupo 2 reservas activas. Verificado al crear reserva (cuota vigente).

**Slot (ranura)**: Combinación única de (cancha_id, fecha, hora_inicio). Un slot = una reserva posible. Duración implícita por tipo de cancha.

---

## T

**Tolerancia de llegada**: 15 minutos posterior a hora_inicio. Ventana para check-in. Pasado ese tiempo → inasistencia automática. Botón "Cancelar" se deshabilita en frontend a la hora_inicio exacta.

**Turno**: Sinónimo de "slot reservado" o "reserva confirmada". Duración fija según cancha.

---

## U

**Usuario**: Entidad con auth (email + password hash + rol). Roles: `admin`, `socio`, `no_socio`. Campos: id, email, password_hash, rol, cuota_vigente_hasta (para socios), bloqueado_hasta (para bloqueo inasistencias), deuda_pendiente, creado_en.

---

## Z

**Zona horaria**: **America/Argentina/Buenos_Aires (UTC-3)**. Todo el sistema opera en esta TZ. Base de datos guarda timestamps en UTC (convención), pero lógica de negocio (días, medianoches, franjas, tolerancias) se calcula en TZ local. Reloj simulado (`Clock`) desacopla hora real para tests.