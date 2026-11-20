/**
 * Error Middleware Centralizado - Reserva Club
 * Mapea errores de dominio a responses HTTP estandarizados
 */

import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { DomainError, ERROR_CODES } from '../utils/errors';
import { getEnv } from '../config/env';

export interface ApiErrorResponse {
  error: string;
  message: string;
  details?: Record<string, unknown>;
}

export function errorMiddleware(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const env = getEnv();
  const isDev = env.NODE_ENV === 'development';

  // Log del error (en prod solo error, en dev stack trace)
  if (isDev) {
    console.error('❌ Error:', err.message);
    console.error(err.stack);
  } else {
    console.error('❌ Error:', err.message, '| Code:', (err as any).code || 'UNKNOWN');
  }

  // Zod validation errors
  if (err instanceof ZodError) {
    const details: Record<string, unknown> = {};
    err.errors.forEach(e => {
      const path = e.path.join('.');
      details[path] = e.message;
    });

    res.status(400).json({
      error: ERROR_CODES.VALIDATION_ERROR,
      message: 'Datos de entrada inválidos',
      details,
    } as ApiErrorResponse);
    return;
  }

  // Domain errors (nuestros errores tipados)
  if (err instanceof DomainError) {
    const statusCode = getStatusCodeForError(err.code);
    res.status(statusCode).json({
      error: err.code,
      message: err.message,
      details: err.details,
    } as ApiErrorResponse);
    return;
  }

  // Errores de PostgreSQL / Kysely
  if (err.message.includes('duplicate key') || err.message.includes('unique constraint')) {
    res.status(409).json({
      error: ERROR_CODES.SLOT_OCUPADO,
      message: 'El recurso ya existe',
      details: { originalError: isDev ? err.message : undefined },
    } as ApiErrorResponse);
    return;
  }

  if (err.message.includes('foreign key constraint')) {
    res.status(400).json({
      error: ERROR_CODES.VALIDATION_ERROR,
      message: 'Referencia a recurso inexistente',
      details: { originalError: isDev ? err.message : undefined },
    } as ApiErrorResponse);
    return;
  }

  // Error genérico
  res.status(500).json({
    error: 'INTERNAL_ERROR',
    message: isDev ? err.message : 'Error interno del servidor',
    details: isDev ? { stack: err.stack } : undefined,
  } as ApiErrorResponse);
}

function getStatusCodeForError(code: string): number {
  const statusMap: Record<string, number> = {
    // 400 - Bad Request
    [ERROR_CODES.VALIDATION_ERROR]: 400,
    [ERROR_CODES.WEAK_PASSWORD]: 400,
    [ERROR_CODES.FRANJA_PICO_INVALIDA]: 400,
    [ERROR_CODES.BLOQUEO_CONFLICTO]: 400,

    // 401 - Unauthorized
    [ERROR_CODES.INVALID_CREDENTIALS]: 401,
    [ERROR_CODES.TOKEN_EXPIRED]: 401,
    [ERROR_CODES.TOKEN_INVALID]: 401,
    [ERROR_CODES.REFRESH_TOKEN_REVOKED]: 401,
    [ERROR_CODES.REFRESH_TOKEN_REUSED]: 401,

    // 403 - Forbidden
    [ERROR_CODES.NO_SE_PUEDE_BLOQUEAR_ADMIN]: 403,

    // 404 - Not Found
    [ERROR_CODES.RESERVA_NO_ENCONTRADA]: 404,
    [ERROR_CODES.CANCHA_NO_ENCONTRADA]: 404,
    [ERROR_CODES.LISTA_NO_ENCONTRADA]: 404,
    [ERROR_CODES.FERIADO_YA_EXISTE]: 404,
    [ERROR_CODES.USUARIO_NO_ENCONTRADO]: 404,

    // 409 - Conflict
    [ERROR_CODES.SLOT_OCUPADO]: 409,
    [ERROR_CODES.EMAIL_ALREADY_EXISTS]: 409,
    [ERROR_CODES.CONFLICTO_VERSION]: 409,
    [ERROR_CODES.YA_EN_LISTA]: 409,
    [ERROR_CODES.YA_CONFIRMADO]: 409,

    // 422 - Unprocessable Entity (Business Rules)
    [ERROR_CODES.CUPO_SEMANAL_EXCEDIDO]: 422,
    [ERROR_CODES.ANTICIPACION_EXCEDIDA]: 422,
    [ERROR_CODES.RESERVA_YA_CANCELADA]: 422,
    [ERROR_CODES.RESERVA_YA_COMPLETADA]: 422,
    [ERROR_CODES.RESERVA_INASISTENCIA]: 422,
    [ERROR_CODES.FUERA_VENTANA_CHECKIN]: 422,
    [ERROR_CODES.CANCHA_EN_MANTENIMIENTO]: 422,
    [ERROR_CODES.HORARIO_FUERA_OPERACION]: 422,
    [ERROR_CODES.USUARIO_BLOQUEADO]: 422,
    [ERROR_CODES.CUOTA_VENCIDA]: 422,
    [ERROR_CODES.VENTANA_CONFIRMACION_EXPIRADA]: 422,
    [ERROR_CODES.CUPO_EXCEDIDO_AL_CONFIRMAR]: 422,
  };

  return statusMap[code] ?? 500;
}

// Clase helper para errores HTTP genéricos en controllers
export class HttpError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details: Record<string, unknown> = {}
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export function badRequest(code: string, message: string, details?: Record<string, unknown>): HttpError {
  return new HttpError(400, code, message, details);
}

export function unauthorized(code: string, message: string, details?: Record<string, unknown>): HttpError {
  return new HttpError(401, code, message, details);
}

export function forbidden(code: string, message: string, details?: Record<string, unknown>): HttpError {
  return new HttpError(403, code, message, details);
}

export function notFound(code: string, message: string, details?: Record<string, unknown>): HttpError {
  return new HttpError(404, code, message, details);
}

export function conflict(code: string, message: string, details?: Record<string, unknown>): HttpError {
  return new HttpError(409, code, message, details);
}

export function unprocessable(code: string, message: string, details?: Record<string, unknown>): HttpError {
  return new HttpError(422, code, message, details);
}