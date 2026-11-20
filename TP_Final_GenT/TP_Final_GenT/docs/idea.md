# Idea Inicial - Reserva Club (Club Atlético Villanorte)

## Contexto
Sistema web de reservas para canchas deportivas que resuelve la gestión manual actual por WhatsApp, eliminando solapamientos, pérdidas económicas y errores humanos.

## Actores
- **Administrador**: Gestión total del sistema (canchas, horarios, precios, usuarios, mantenimiento, reportes)
- **Socio**: Usuario con cuota al día, beneficios preferenciales
- **No Socio**: Usuario ocasional sin cuota, condiciones estándar
- **Invitado**: Navega disponibilidad sin autenticar (solo lectura)

## Inventario y Duración de Turnos
- **2 canchas de Fútbol 5**: turnos de 60 minutos
- **3 canchas de Pádel**: turnos de 90 minutos
- **1 cancha de Tenis**: turnos de 90 minutos
- **Horario de operación**: 08:00 a 24:00 (último inicio según duración de cada cancha)

## Tarifas y Usuarios
- **Recargo horario pico**: +30% en franjas definidas
- **Recargo fin de semana**: +30% sábados, domingos y feriados
- **Socios**: 20% descuento base, anticipación 7 días, hasta 2 reservas activas simultáneas
- **No Socios**: precio base, anticipación 3 días, 1 reserva activa

## Penalidades y Casos Complejos
- **Cancelación gratuita**: > 24 horas de antelación
- **Cancelación con cargo**: ≤ 24 horas → 50% del turno
- **Inasistencia (no-show)**: 3 en 30 días → bloqueo automático 30 días
- **Tolerancia llegada**: 15 minutos tras hora inicio → se marca inasistencia
- **Listas de espera**: Automáticas por coincidencia exacta (cancha + fecha + hora), notificación email, ventana confirmación 30 min
- **Concurrencia**: Control estricto ante reservas simultáneas mismo slot
- **Mantenimiento**: Bloqueos administrativos de canchas/horarios
- **Precios históricos**: Respeto precio al momento de reserva ante cambios posteriores

## Alcance Fuera de Sistema (v1)
- Pagos online / pasarelas
- App móvil nativa
- Notificaciones push / WhatsApp
- Multi-club / franquicias
- Torneo / ligas