/**
 * Express App Factory - Reserva Club
 * Para tests: createApp() retorna app sin listen()
 * Para prod: server.ts llama createApp() + listen()
 */

import express, { Application, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { getEnv } from './config/env';
import { errorMiddleware } from './middleware/error.middleware';
import { rateLimitMiddleware } from './middleware/rateLimit.middleware';

import { authRoutes } from './routes/auth.routes';
import { canchaRoutes } from './routes/cancha.routes';

export function createApp(): Application {
  const env = getEnv();
  const app = express();

  // ============================================
  // Middlewares Globales
  // ============================================

  // Security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    frameguard: { action: 'deny' },
    xssFilter: true,
    noSniff: true,
  }));

  // CORS - solo origen frontend permitido
  app.use(cors({
    origin: env.FRONTEND_URL,
    credentials: true, // Para cookies HttpOnly
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Retry-After', 'X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
  }));

  // Body parsing
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));

  // Rate limiting global (API)
  app.use(rateLimitMiddleware.api);

  // Trust proxy (para rate limit detrás de proxy como Render)
  app.set('trust proxy', 1);

  // ============================================
  // Health Check (sin auth, sin rate limit estricto)
  // ============================================

  app.get('/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '0.0.1',
      environment: env.NODE_ENV,
    });
  });

  // ============================================
  // Rutas de la API (prefijo /api)
  // ============================================

  // app.use('/api/auth', authRoutes);
  // app.use('/api/canchas', canchaRoutes);
  // app.use('/api/reservas', reservaRoutes);
  // app.use('/api/listas-espera', listaEsperaRoutes);
  // app.use('/api/admin', adminRoutes);

  // Rutas de la API
  app.use('/api/auth', authRoutes);

  // Placeholder para rutas futuras
  app.use('/api', (_req: Request, res: Response) => {
    res.json({
      message: 'Reserva Club API',
      version: '0.0.1',
      endpoints: {
        auth: '/api/auth (register, login, refresh, logout, me) ✅ IMPLEMENTADO',
        canchas: '/api/canchas (pendiente)',
        reservas: '/api/reservas (pendiente)',
        listasEspera: '/api/listas-espera (pendiente)',
        admin: '/api/admin (pendiente)',
      },
    });
  });

  // ============================================
  // 404 Handler
  // ============================================

  app.use((_req: Request, _res: Response, next: NextFunction) => {
    const error = new Error('Ruta no encontrada') as any;
    error.statusCode = 404;
    error.code = 'NOT_FOUND';
    next(error);
  });

  // ============================================
  // Error Handler Centralizado (debe ser último)
  // ============================================

  app.use(errorMiddleware);

  return app;
}