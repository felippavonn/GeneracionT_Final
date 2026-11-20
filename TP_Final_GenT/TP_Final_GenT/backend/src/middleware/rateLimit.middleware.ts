/**
 * Rate Limiting Middleware - Reserva Club
 * Usa express-rate-limit con store en memoria (suficiente para free tier Render)
 */

import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { getEnv } from '../config/env';

const env = getEnv();

// ============================================
// Configuración por tipo de endpoint
// ============================================

const createLimiter = (windowMs: number, max: number, message: string, keyPrefix: string) => {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true, // X-RateLimit-* headers
    legacyHeaders: false,  // No X-RateLimit-Limit/Remaining deprecated
    keyGenerator: (req: Request) => {
      // Por IP para auth, por user_id para API autenticada
      if (keyPrefix === 'auth') {
        return req.ip || 'unknown';
      }
      // Para API, intentar obtener user_id del token (se adjunta en auth middleware)
      const userId = (req as any).user?.id;
      return userId ? `user:${userId}` : req.ip || 'unknown';
    },
    handler: (_req: Request, res: Response) => {
      res.status(429).json({
        error: 'RATE_LIMIT_EXCEEDED',
        message,
        details: { retryAfter: Math.ceil(windowMs / 1000) },
      });
    },
    skip: (req: Request) => {
      // Saltar health check
      return req.path === '/health';
    },
  });
};

// Rate limit para endpoints de auth (login, register, refresh)
export const authRateLimit = createLimiter(
  env.RATE_LIMIT_AUTH_WINDOW_MS,
  env.RATE_LIMIT_AUTH_MAX,
  'Demasiados intentos de autenticación. Intenta de nuevo en un minuto.',
  'auth'
);

// Rate limit general para API autenticada
export const apiRateLimit = createLimiter(
  env.RATE_LIMIT_API_WINDOW_MS,
  env.RATE_LIMIT_API_MAX,
  'Límite de peticiones excedido. Intenta de nuevo más tarde.',
  'api'
);

// Exportar ambos como objeto para fácil importación en app.ts
export const rateLimitMiddleware = {
  auth: authRateLimit,
  api: apiRateLimit,
};