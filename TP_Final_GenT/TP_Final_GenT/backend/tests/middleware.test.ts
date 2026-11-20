/**
 * Tests de Middlewares - Reserva Club Backend
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { errorMiddleware, HttpError, badRequest, unauthorized, forbidden, notFound, conflict, unprocessable } from '../src/middleware/error.middleware';
import { authRateLimit, apiRateLimit } from '../src/middleware/rateLimit.middleware';
import { validate, validateBody, validateQuery, validateParams, uuidParamSchema, paginationQuerySchema, registerBodySchema, loginBodySchema } from '../src/middleware/validation.middleware';
import { ERROR_CODES } from '../src/utils/errors';
import { ZodError } from 'zod';

// ============================================
// Error Middleware
// ============================================

describe('Error Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: ReturnType<typeof vi.fn>;
  let statusMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    jsonMock = vi.fn();
    statusMock = vi.fn().mockReturnValue({ json: jsonMock });
    mockReq = {};
    mockRes = { status: statusMock, json: jsonMock };
    mockNext = vi.fn();
  });

  it('maneja ZodError como 400 VALIDATION_ERROR', () => {
    const zodError = new ZodError([
      { code: 'too_small', minimum: 8, type: 'string', inclusive: true, exact: false, message: 'Password muy corto', path: ['password'] }
    ]);

    errorMiddleware(zodError, mockReq as Request, mockRes as Response, mockNext);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
      error: ERROR_CODES.VALIDATION_ERROR,
      message: 'Datos de entrada inválidos',
      details: { password: 'Password muy corto' },
    }));
  });

  it('maneja DomainError con código conocido', () => {
    const { ConflictError } = require('../src/utils/errors');
    const domainError = new ConflictError(ERROR_CODES.SLOT_OCUPADO, { canchaId: 'abc' });

    errorMiddleware(domainError, mockReq as Request, mockRes as Response, mockNext);

    expect(statusMock).toHaveBeenCalledWith(409);
    expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
      error: ERROR_CODES.SLOT_OCUPADO,
    }));
  });

  it('maneja HttpError helpers', () => {
    errorMiddleware(badRequest('TEST_CODE', 'Bad request', { field: 'test' }), mockReq as Request, mockRes as Response, mockNext);
    expect(statusMock).toHaveBeenCalledWith(400);

    errorMiddleware(unauthorized('TEST_CODE', 'Unauthorized'), mockReq as Request, mockRes as Response, mockNext);
    expect(statusMock).toHaveBeenCalledWith(401);

    errorMiddleware(forbidden('TEST_CODE', 'Forbidden'), mockReq as Request, mockRes as Response, mockNext);
    expect(statusMock).toHaveBeenCalledWith(403);

    errorMiddleware(notFound('TEST_CODE', 'Not found'), mockReq as Request, mockRes as Response, mockNext);
    expect(statusMock).toHaveBeenCalledWith(404);

    errorMiddleware(conflict('TEST_CODE', 'Conflict'), mockReq as Request, mockRes as Response, mockNext);
    expect(statusMock).toHaveBeenCalledWith(409);

    errorMiddleware(unprocessable('TEST_CODE', 'Unprocessable'), mockReq as Request, mockRes as Response, mockNext);
    expect(statusMock).toHaveBeenCalledWith(422);
  });

  it('error genérico devuelve 500', () => {
    errorMiddleware(new Error('Random error'), mockReq as Request, mockRes as Response, mockNext);
    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
      error: 'INTERNAL_ERROR',
    }));
  });
});

// ============================================
// Validation Middleware
// ============================================

describe('Validation Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = { body: {}, query: {}, params: {} };
    mockRes = {};
    mockNext = vi.fn();
  });

  it('validateBody() acepta body válido', () => {
    mockReq.body = { email: 'test@test.com', password: 'password123' };
    const middleware = validateBody(registerBodySchema);
    middleware(mockReq as Request, mockRes as Response, mockNext);
    expect(mockNext).toHaveBeenCalled();
    expect(mockReq.body.email).toBe('test@test.com');
  });

  it('validateBody() rechaza body inválido', () => {
    mockReq.body = { email: 'invalid', password: '123' };
    const middleware = validateBody(registerBodySchema);
    expect(() => middleware(mockReq as Request, mockRes as Response, mockNext)).toThrow();
  });

  it('validateQuery() parsea y valida query params', () => {
    mockReq.query = { page: '2', limit: '50' };
    const middleware = validateQuery(paginationQuerySchema);
    middleware(mockReq as Request, mockRes as Response, mockNext);
    expect(mockNext).toHaveBeenCalled();
    expect(mockReq.query.page).toBe(2); // coerce to number
    expect(mockReq.query.limit).toBe(50);
  });

  it('validateParams() valida UUID', () => {
    mockReq.params = { id: '123e4567-e89b-12d3-a456-426614174000' };
    const middleware = validateParams(uuidParamSchema);
    middleware(mockReq as Request, mockRes as Response, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });

  it('validateParams() rechaza UUID inválido', () => {
    mockReq.params = { id: 'not-a-uuid' };
    const middleware = validateParams(uuidParamSchema);
    expect(() => middleware(mockReq as Request, mockRes as Response, mockNext)).toThrow();
  });

  it('validate() combina body + query + params', () => {
    mockReq.body = { email: 'test@test.com', password: 'password123' };
    mockReq.query = { page: '1' };
    mockReq.params = { id: '123e4567-e89b-12d3-a456-426614174000' };

    const middleware = validate({
      body: registerBodySchema,
      query: paginationQuerySchema,
      params: uuidParamSchema,
    });

    middleware(mockReq as Request, mockRes as Response, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });
});

// ============================================
// Rate Limit Middleware (unit - solo configuración)
// ============================================

describe('Rate Limit Middleware Config', () => {
  it('authRateLimit tiene configuración correcta', () => {
    expect(authRateLimit).toBeDefined();
    // Verificar que es una función middleware
    expect(typeof authRateLimit).toBe('function');
  });

  it('apiRateLimit tiene configuración correcta', () => {
    expect(apiRateLimit).toBeDefined();
    expect(typeof apiRateLimit).toBe('function');
  });
});