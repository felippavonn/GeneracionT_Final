/**
 * Constantes de negocio - Reserva Club
 * Valores derivados del spec.md, centralizados para consistencia
 */

// Zona horaria oficial del sistema
export const SYSTEM_TZ = 'America/Argentina/Buenos_Aires';

// Horario de operación
export const OPERATION_HOURS = {
  OPEN: 8,    // 08:00
  CLOSE: 24,  // 24:00 (medianoche)
} as const;

// Duración de turnos por tipo de cancha (minutos)
export const TURNO_DURATION_MINUTES = {
  futbol5: 60,
  padel: 90,
  tenis: 90,
} as const;

// Tipos de cancha
export const CANCHA_TIPOS = ['futbol5', 'padel', 'tenis'] as const;
export type CanchaTipo = (typeof CANCHA_TIPOS)[number];

// Recargos y descuentos (porcentajes)
export const RECARGO_PICO_PCT = 30;
export const RECARGO_FDS_FERIADO_PCT = 30;
export const DESCUENTO_SOCIO_PCT = 20;

// Anticipación máxima (días)
export const ANTICIPACION_MAXIMA = {
  socio: 7,
  no_socio: 3,
} as const;

// Cupo semanal de reservas activas
export const CUPO_SEMANAL = {
  socio: 2,
  no_socio: 1,
} as const;

// Cancelación
export const CANCELACION_HORAS_GRATIS = 24;
export const CANCELACION_CARGO_PCT = 50;

// Inasistencia
export const TOLERANCIA_LLEGADA_MINUTOS = 15;
export const INASISTENCIAS_PARA_BLOQUEO = 3;
export const BLOQUEO_INASISTENCIAS_DIAS = 30;
export const VENTANA_INASISTENCIAS_DIAS = 30; // Rolling window

// Lista de espera
export const VENTANA_CONFIRMACION_LISTA_MINUTOS = 30;

// Roles de usuario
export const USER_ROLES = ['admin', 'socio', 'no_socio'] as const;
export type UserRole = (typeof USER_ROLES)[number];

// Estados de reserva
export const RESERVA_ESTADOS = [
  'pendiente_pago',
  'confirmada',
  'en_espera_confirmacion',
  'cancelada_gratis',
  'cancelada_con_cargo',
  'completada',
  'inasistencia',
] as const;
export type ReservaEstado = (typeof RESERVA_ESTADOS)[number];

// Estados de lista de espera
export const LISTA_ESPERA_ESTADOS = [
  'esperando',
  'en_espera_confirmacion',
  'confirmada',
  'expirada',
  'cancelada',
] as const;
export type ListaEsperaEstado = (typeof LISTA_ESPERA_ESTADOS)[number];

// Recurrencia bloqueos mantenimiento
export const RECURRENCIA_BLOQUEO = ['ninguna', 'semanal', 'quincenal', 'mensual'] as const;
export type RecurrenciaBloqueo = (typeof RECURRENCIA_BLOQUEO)[number];

// JWT
export const JWT_ACCESS_EXPIRES_IN = '15m';
export const JWT_REFRESH_EXPIRES_IN = '7d';

// bcrypt
export const BCRYPT_COST = 12;

// Paginación default
export const PAGINATION_DEFAULT_LIMIT = 20;
export const PAGINATION_MAX_LIMIT = 100;

// Rate limiting defaults (sobrescribibles por env)
export const RATE_LIMIT_DEFAULTS = {
  auth: { max: 10, windowMs: 60_000 },
  api: { max: 100, windowMs: 60_000 },
} as const;