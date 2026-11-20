/**
 * Validation Middleware - Zod Schema Validation
 * Reserva Club - Club Atlético Villanorte
 */

import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError, ZodSchema } from 'zod';
import { ERROR_CODES, ValidationError } from '../utils/errors';

/**
 * Middleware factory para validar body, query, params con Zod
 */
export function validate(schema: {
  body?: AnyZodObject;
  query?: AnyZodObject;
  params?: AnyZodObject;
}) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (schema.body) {
        req.body = schema.body.parse(req.body);
      }
      if (schema.query) {
        req.query = schema.query.parse(req.query);
      }
      if (schema.params) {
        req.params = schema.params.parse(req.params);
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details: Record<string, unknown> = {};
        error.errors.forEach(e => {
          const path = e.path.join('.');
          details[path] = e.message;
        });
        throw new ValidationError(ERROR_CODES.VALIDATION_ERROR, details, 'Datos de entrada inválidos');
      }
      throw error;
    }
  };
}

/**
 * Helper para validar solo body
 */
export function validateBody(schema: AnyZodObject) {
  return validate({ body: schema });
}

/**
 * Helper para validar solo query
 */
export function validateQuery(schema: AnyZodObject) {
  return validate({ query: schema });
}

/**
 * Helper para validar solo params
 */
export function validateParams(schema: AnyZodObject) {
  return validate({ params: schema });
}

/**
 * Schemas comunes reutilizables
 */
import { z } from 'zod';

// UUID param
export const uuidParamSchema = z.object({
  id: z.string().uuid('ID debe ser un UUID válido'),
});

// Pagination query
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
});

// Date query (YYYY-MM-DD)
export const dateQuerySchema = z.object({
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato fecha YYYY-MM-DD'),
});

// Fecha rango query
export const dateRangeQuerySchema = z.object({
  desde: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato fecha YYYY-MM-DD'),
  hasta: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato fecha YYYY-MM-DD'),
}).refine(data => new Date(data.desde) <= new Date(data.hasta), {
  message: 'Fecha desde debe ser anterior o igual a fecha hasta',
  path: ['hasta'],
});

// Time query (HH:mm)
export const timeQuerySchema = z.object({
  hora_inicio: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Formato hora HH:mm'),
  hora_fin: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Formato hora HH:mm'),
}).refine(data => data.hora_inicio < data.hora_fin, {
  message: 'Hora inicio debe ser anterior a hora fin',
  path: ['hora_fin'],
});

// Auth schemas
export const registerBodySchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Password mínimo 8 caracteres').max(128),
});

export const loginBodySchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1),
});

// Reserva schemas
export const crearReservaBodySchema = z.object({
  cancha_id: z.string().uuid('Cancha ID inválido'),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato fecha YYYY-MM-DD'),
  hora_inicio: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Formato hora HH:mm'),
});

// Lista espera schemas
export const unirseListaBodySchema = z.object({
  cancha_id: z.string().uuid('Cancha ID inválido'),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato fecha YYYY-MM-DD'),
  hora_inicio: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Formato hora HH:mm'),
});

// Admin schemas
export const crearCanchaBodySchema = z.object({
  nombre: z.string().min(1).max(100),
  tipo: z.enum(['futbol5', 'padel', 'tenis']),
  precio_base: z.number().int().positive('Precio base en centavos, debe ser positivo'),
  duracion_minutos: z.number().int().positive().optional(),
  activa: z.boolean().default(true),
});

export const actualizarCanchaBodySchema = z.object({
  nombre: z.string().min(1).max(100).optional(),
  precio_base: z.number().int().positive().optional(),
  activa: z.boolean().optional(),
});

export const crearFeriadoBodySchema = z.object({
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato fecha YYYY-MM-DD'),
  nombre: z.string().min(1).max(100),
  recurrencia_anual: z.boolean().default(false),
});

export const crearFranjaPicoBodySchema = z.object({
  dia_semana: z.number().int().min(0).max(6),
  hora_inicio: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Formato hora HH:mm'),
  hora_fin: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Formato hora HH:mm'),
}).refine(data => data.hora_inicio < data.hora_fin, {
  message: 'Hora inicio debe ser anterior a hora fin',
  path: ['hora_fin'],
});

export const crearBloqueoBodySchema = z.object({
  cancha_id: z.string().uuid('Cancha ID inválido'),
  fecha_inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato fecha YYYY-MM-DD'),
  fecha_fin: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato fecha YYYY-MM-DD'),
  hora_inicio: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Formato hora HH:mm'),
  hora_fin: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Formato hora HH:mm'),
  recurrencia: z.enum(['ninguna', 'semanal', 'quincenal', 'mensual']).default('ninguna'),
  descripcion: z.string().max(500).optional(),
}).refine(data => data.fecha_inicio <= data.fecha_fin, {
  message: 'Fecha inicio debe ser anterior o igual a fecha fin',
  path: ['fecha_fin'],
}).refine(data => data.hora_inicio < data.hora_fin, {
  message: 'Hora inicio debe ser anterior a hora fin',
  path: ['hora_fin'],
});

export const actualizarUsuarioBodySchema = z.object({
  rol: z.enum(['admin', 'socio', 'no_socio']).optional(),
  cuota_vigente_hasta: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato fecha YYYY-MM-DD').nullable().optional(),
  bloqueado_hasta: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato fecha YYYY-MM-DD').nullable().optional(),
  deuda_pendiente: z.number().int().optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: 'Debe proporcionar al menos un campo para actualizar',
});

export const crearReservaOverrideBodySchema = z.object({
  usuario_id: z.string().uuid('Usuario ID inválido'),
  cancha_id: z.string().uuid('Cancha ID inválido'),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato fecha YYYY-MM-DD'),
  hora_inicio: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Formato hora HH:mm'),
  precio_override: z.number().int().nonnegative().optional(),
  motivo: z.string().min(1).max(500),
});