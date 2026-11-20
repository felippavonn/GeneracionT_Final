# Preguntas Abiertas - Reserva Club

> Dudas críticas que escapan al criterio interno y requieren validación formal con el cliente (Club Atlético Villanorte). Ordenadas por impacto sistémico (Alto → Medio → Bajo).

---

## ALTO IMPACTO - Bloquean arquitectura / modelo de datos

### PA01: Autenticación y recuperación de cuenta
**Pregunta**: ¿El sistema maneja registro autogestionado (email + password) o el admin crea usuarios? ¿Hay "Olvidé contraseña" (reset por email) o el admin resetea manualmente?
**Impacto**: Define flujo de auth, tabla usuarios, endpoints públicos, servicio de email real vs simulado.
**Estado**: Pendiente validación cliente

### PA02: Pagos y facturación
**Pregunta**: ¿Se requiere integración con pasarela de pagos (MercadoPago, Stripe) para cobrar reservas / cancelaciones con cargo / deudas? ¿O es solo registro contable y el club cobra presencialmente?
**Impacto**: Define si hay módulo de pagos, webhooks, estados `pendiente_pago`, conciliación, facturas.
**Estado**: Pendiente validación cliente

### PA03: Multisede / Multi-club
**Pregunta**: ¿El club tiene una sola sede o planea expandirse a múltiples sedes con inventario compartido o separado?
**Impacto**: Afecta modelo de datos (agregar `sede_id` a canchas, usuarios, reservas), permisos admin por sede, reportes.
**Estado**: Pendiente validación cliente

---

## MEDIO IMPACTO - Afectan reglas de negocio / UX

### PA04: Check-in obligatorio vs opcional
**Pregunta**: ¿El check-in es obligatorio (usuario debe hacerlo en app) o lo hace el recepcionista del club? ¿Hay código QR / NFC en cancha?
**Impacto**: Define si hay endpoint `POST /reservas/:id/checkin` público (usuario) o solo admin/recepcionista. Afecta frontend (botón visible para usuario).
**Estado**: Pendiente validación cliente

### PA05: Notificaciones: ¿Solo email o también WhatsApp/SMS?
**Pregunta**: El spec actual contempla email simulado. ¿El cliente quiere WhatsApp Business API / Twilio SMS para recordatorios y lista de espera?
**Impacto**: Cambia servicio de notificaciones, templates, proveedores, costos, fallback.
**Estado**: Pendiente validación cliente

### PA06: Gestión de cuotas de socios
**Pregunta**: ¿El sistema controla vencimiento de cuota mensual? ¿Al vencer, el socio pasa automáticamente a "no socio" o hay período de gracia? ¿Admin actualiza manual o hay integración contable?
**Impacto**: Afecta campo `cuota_vigente_hasta`, job nocturno de verificación, lógica al crear reserva (verificar vigencia).
**Estado**: Pendiente validación cliente

### PA07: Reportes y métricas requeridos
**Pregunta**: ¿Qué reportes necesita el admin? (Ocupación por cancha/horario, ingresos, morosidad, inasistencias, lista de espera). ¿Exportación Excel/PDF?
**Impacto**: Define endpoints de reportes, consultas agregadas, posible materialized views, permisos.
**Estado**: Pendiente validación cliente

### PA08: Edición de reserva existente
**Pregunta**: ¿Permitir cambiar fecha/hora/cancha de una reserva confirmada? ¿Con qué restricciones (anticipación, cupo, precio histórico)?
**Impacto**: Nuevo flujo: cancelar original + crear nueva (con reglas) vs modificar in-place. Afecta historial precios, auditoría.
**Estado**: Pendiente validación cliente

---

## BAJO IMPACTO - Detalles de UX / configuración

### PA09: Idiomas y moneda
**Pregunta**: ¿Solo español / ARS? ¿Se prevé inglés o portugués (turistas)? ¿Formato de fecha DD/MM/AAAA confirmado?
**Impacto**: i18n en frontend, formateo moneda, locale en backend.
**Estado**: Pendiente validación cliente (probable: solo ES/ARS)

### PA10: Accesibilidad y dispositivos
**Pregunta**: ¿El frontend debe ser responsive mobile-first? ¿Hay requerimientos de accesibilidad (WCAG AA)?
**Impacto**: Decisiones de UI, testing, componentes.
**Estado**: Pendiente validación cliente

### PA11: Backup y retención de datos
**Pregunta**: ¿Política de retención de reservas históricas? ¿Backup automático diario? ¿LGPD / datos personales?
**Impacto**: Jobs de limpieza, anonimización, configuración BD gestionada (Neon/Render).
**Estado**: Pendiente validación cliente

---

## RESUELTAS (movidas a decisions.md)
- D01-D11: Ver `decisions.md` — ya validadas en Clase 3.