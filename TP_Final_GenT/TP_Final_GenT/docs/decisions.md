# Decisiones de Negocio - Reserva Club

> Historial de preguntas formuladas durante la auditoría funcional y sus resoluciones acordadas (simulando validación del cliente).

---

## D01: ¿Qué ocurre si un usuario intenta reservar en un horario que ya tiene una reserva activa en otra cancha?
**Resolución**: Se permite. No hay restricción cross-court. Un socio puede tener reserva en fútbol 5 a las 19:00 y en pádel a las 19:30 simultáneamente. El límite de "reservas activas" (2 socios / 1 no socio) cuenta total por usuario, no por cancha.
**Fecha**: Clase 2
**Impacto**: RN15, RN16

---

## D02: ¿La lista de espera es por cancha específica o por tipo de cancha (cualquier pádel)?
**Resolución**: **Por cancha específica + fecha + hora exacta**. El usuario se anota en "Cancha Pádel 2 - Martes 20/01 - 20:00". Si libera Pádel 1 mismo horario, **no** salta la lista. Esto simplifica la notificación y evita confusiones.
**Fecha**: Clase 2
**Impacto**: RN25-RN29

---

## D03: ¿Qué sucede si el usuario en lista de espera no confirma en 30 minutos?
**Resolución**: Se pasa al siguiente en la lista automáticamente. La reserva queda libre para cualquiera. El usuario que no confirmó vuelve al final de la lista si quiere reingresar (no pierde su posición original, pero no tiene prioridad).
**Fecha**: Clase 2
**Impacto**: RN27, RN28

---

## D04: ¿Cómo se computa "3 inasistencias en 30 días" para el bloqueo? ¿Ventana deslizante o calendario fijo?
**Resolución**: **Ventana deslizante de 30 días corridos** (rolling window). Cada inasistencia suma 1; a la 3ra → bloqueo 30 días desde esa 3ra inasistencia. Las inasistencias mayores a 30 días no cuentan.
**Fecha**: Clase 3
**Impacto**: RN32, RN33

---

## D05: ¿La tolerancia de 15 minutos para inasistencia es desde la hora exacta de inicio o desde el final del slot anterior?
**Resolución**: Desde la **hora exacta de inicio del turno reservado**. Si reserva 20:00-21:00 (fútbol), a las 20:15:01 se marca inasistencia si no hizo check-in. El botón "Cancelar" se desactiva en frontend a la hora de inicio.
**Fecha**: Clase 3
**Impacto**: RN30, RN31

---

## D06: ¿Los feriados se cargan manualmente o hay calendario automático (Argentina)?
**Resolución**: **Carga manual por administrador**. Lista editable en panel admin (fecha + nombre + recurrencia opcional). No hay API externa. Los feriados cargados **después** de una reserva **no** recalculan el precio de esa reserva (precio histórico respetado).
**Fecha**: Clase 3
**Impacto**: RN10, RN11, RN12

---

## D07: ¿Qué pasa con el cupo semanal de reservas activas al cancelar? ¿Se libera inmediato?
**Resolución**: **Sí, inmediato**. Al cancelar (gratuita o con cargo), el cupo semanal se libera al instante. Lo mismo al completar el turno (check-out) o marcar inasistencia. La ventana semanal es lunes-domingo.
**Fecha**: Clase 3
**Impacto**: RN17, RN18

---

## D08: ¿El bloqueo por mantenimiento lo hace el admin cancha por cancha o masivo?
**Resolución**: **Cancha por cancha + rango horario + recurrencia opcional** (ej: "Cancha Pádel 1, todos los lunes 08:00-10:00, mantenimiento semanal"). Se visualiza en calendario admin y bloquea reservas en ese rango.
**Fecha**: Clase 3
**Impacto**: RN34, RN35

---

## D09: ¿Cómo se maneja el cambio de precio de una cancha? ¿Afecta reservas futuras ya hechas?
**Resolución**: **No afecta reservas existentes**. El precio se "congela" al momento de crear la reserva. Cambios de tarifa base / recargos aplican solo a reservas nuevas. Historial de precios se guarda en la reserva.
**Fecha**: Clase 3
**Impacto**: RN13, RN14

---

## D10: ¿El administrador puede hacer overrides (reservar fuera de horario, sin cupo, gratis)?
**Resolución**: **Sí, con auditoría**. Admin puede: reservar en horario cerrado, exceder cupos, setear precio $0, saltar lista de espera. Todo queda en log de auditoría con admin_id, acción, timestamp, motivo opcional.
**Fecha**: Clase 3
**Impacto**: RN36, RN37

---

## D11: ¿Cómo se define "horario pico"? ¿Franjas fijas o configurables?
**Resolución**: **Franjas configurables por admin** (ej: Lunes-Viernes 18:00-22:00, Sábados 10:00-14:00 y 18:00-22:00). Por defecto: días laborables 18:00-22:00. Se guarda en BD y se evalúa al calcular precio.
**Fecha**: Clase 3
**Impacto**: RN08, RN09