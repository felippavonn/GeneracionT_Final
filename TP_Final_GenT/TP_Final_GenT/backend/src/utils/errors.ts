/**
 * Errores de dominio tipados - Reserva Club
 * Usados en services para lanzar errores de negocio claros
 */

export class DomainError extends Error {
  constructor(
    public readonly code: string,
    public readonly message: string,
    public readonly details: Record<string, unknown> = {}
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

export class ConflictError extends DomainError {
  constructor(code: string, details: Record<string, unknown> = {}, message?: string) {
    super(code, message ?? 'Conflicto de recurso', details);
  }
}

export class BusinessRuleError extends DomainError {
  constructor(code: string, details: Record<string, unknown> = {}, message?: string) {
    super(code, message ?? 'Regla de negocio violada', details);
  }
}

export class NotFoundError extends DomainError {
  constructor(code: string, details: Record<string, unknown> = {}, message?: string) {
    super(code, message ?? 'Recurso no encontrado', details);
  }
}

export class UnauthorizedError extends DomainError {
  constructor(code: string, details: Record<string, unknown> = {}, message?: string) {
    super(code, message ?? 'No autenticado', details);
  }
}

export class ForbiddenError extends DomainError {
  constructor(code: string, details: Record<string, unknown> = {}, message?: string) {
    super(code, message ?? 'Acceso prohibido', details);
  }
}

export class ValidationError extends DomainError {
  constructor(code: string, details: Record<string, unknown> = {}, message?: string) {
    super(code, message ?? 'Error de validación', details);
  }
}

// Códigos de error estandarizados
export const ERROR_CODES = {
  // Auth
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  REFRESH_TOKEN_REVOKED: 'REFRESH_TOKEN_REVOKED',
  REFRESH_TOKEN_REUSED: 'REFRESH_TOKEN_REUSED',
  EMAIL_ALREADY_EXISTS: 'EMAIL_ALREADY_EXISTS',
  WEAK_PASSWORD: 'WEAK_PASSWORD',

  // Reservas
  SLOT_OCUPADO: 'SLOT_OCUPADO',
  CUPO_SEMANAL_EXCEDIDO: 'CUPO_SEMANAL_EXCEDIDO',
  ANTICIPACION_EXCEDIDA: 'ANTICIPACION_EXCEDIDA',
  RESERVA_NO_ENCONTRADA: 'RESERVA_NO_ENCONTRADA',
  RESERVA_NO_PERTENECE_USUARIO: 'RESERVA_NO_PERTENECE_USUARIO',
  RESERVA_YA_CANCELADA: 'RESERVA_YA_CANCELADA',
  RESERVA_YA_COMPLETADA: 'RESERVA_YA_COMPLETADA',
  RESERVA_INASISTENCIA: 'RESERVA_INASISTENCIA',
  FUERA_VENTANA_CHECKIN: 'FUERA_VENTANA_CHECKIN',
  CANCHA_EN_MANTENIMIENTO: 'CANCHA_EN_MANTENIMIENTO',
  HORARIO_FUERA_OPERACION: 'HORARIO_FUERA_OPERACION',
  USUARIO_BLOQUEADO: 'USUARIO_BLOQUEADO',
  CUOTA_VENCIDA: 'CUOTA_VENCIDA',

  // Lista de espera
  YA_EN_LISTA: 'YA_EN_LISTA',
  LISTA_NO_ENCONTRADA: 'LISTA_NO_ENCONTRADA',
  VENTANA_CONFIRMACION_EXPIRADA: 'VENTANA_CONFIRMACION_EXPIRADA',
  YA_CONFIRMADO: 'YA_CONFIRMADO',
  CUPO_EXCEDIDO_AL_CONFIRMAR: 'CUPO_EXCEDIDO_AL_CONFIRMAR',

  // Concurrencia
  CONFLICTO_VERSION: 'CONFLICTO_VERSION',

  // Admin
  CANCHA_NO_ENCONTRADA: 'CANCHA_NO_ENCONTRADA',
  FERIADO_YA_EXISTE: 'FERIADO_YA_EXISTE',
  FRANJA_PICO_INVALIDA: 'FRANJA_PICO_INVALIDA',
  BLOQUEO_CONFLICTO: 'BLOQUEO_CONFLICTO',
  USUARIO_NO_ENCONTRADO: 'USUARIO_NO_ENCONTRADO',
  NO_SE_PUEDE_BLOQUEAR_ADMIN: 'NO_SE_PUEDE_BLOQUEAR_ADMIN',

  // Validación genérica
  VALIDATION_ERROR: 'VALIDATION_ERROR',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];