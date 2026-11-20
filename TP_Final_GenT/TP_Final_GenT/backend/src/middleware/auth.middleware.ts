/**
 * Auth Middleware - JWT Validation y Role Guards
 * Reserva Club - Club Atlético Villanorte
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getEnv } from '../config/env';
import { getDb } from '../data/database/connection';
import { UserRole } from '../domain/enums';
import { ERROR_CODES, UnauthorizedError, ForbiddenError } from '../utils/errors';

const env = getEnv();

// Extender Request para incluir usuario autenticado
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        rol: UserRole;
      };
    }
  }
}

/**
 * Extrae y valida Access Token del header Authorization o cookie
 */
export async function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = extractToken(req);

    if (!token) {
      throw new UnauthorizedError(ERROR_CODES.TOKEN_INVALID, {}, 'Token de acceso requerido');
    }

    // Verificar y decodificar token
    let payload: { userId: string; email: string; rol: UserRole; type: 'access' };
    try {
      payload = jwt.verify(token, env.JWT_SECRET) as any;
    } catch (jwtErr) {
      if (jwtErr instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedError(ERROR_CODES.TOKEN_EXPIRED, {}, 'Token expirado');
      }
      throw new UnauthorizedError(ERROR_CODES.TOKEN_INVALID, {}, 'Token inválido');
    }

    // Verificar que sea access token (no refresh)
    if (payload.type !== 'access') {
      throw new UnauthorizedError(ERROR_CODES.TOKEN_INVALID, {}, 'Tipo de token incorrecto');
    }

    // Verificar que usuario existe y está activo (opcional: cache en prod)
    const db = getDb();
    const user = await db.selectFrom('usuario')
      .select(['id', 'email', 'rol', 'bloqueado_hasta', 'cuota_vigente_hasta'])
      .where('id', '=', payload.userId)
      .executeTakeFirst();

    if (!user) {
      throw new UnauthorizedError(ERROR_CODES.TOKEN_INVALID, {}, 'Usuario no encontrado');
    }

    // Adjuntar usuario al request
    req.user = {
      id: user.id,
      email: user.email,
      rol: user.rol,
    };

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Middleware opcional: adjunta usuario si hay token válido, pero no falla si no hay
 */
export async function optionalAuthMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = extractToken(req);
    if (!token) {
      return next();
    }

    const payload = jwt.verify(token, env.JWT_SECRET) as any;
    if (payload.type !== 'access') {
      return next();
    }

    const db = getDb();
    const user = await db.selectFrom('usuario')
      .select(['id', 'email', 'rol'])
      .where('id', '=', payload.userId)
      .executeTakeFirst();

    if (user) {
      req.user = {
        id: user.id,
        email: user.email,
        rol: user.rol,
      };
    }
    next();
  } catch {
    // Silenciosamente continúa sin usuario
    next();
  }
}

/**
 * Guard de roles - requiere uno de los roles permitidos
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError(ERROR_CODES.TOKEN_INVALID, {}, 'Autenticación requerida');
    }

    if (!allowedRoles.includes(req.user.rol)) {
      throw new ForbiddenError(
        ERROR_CODES.NO_SE_PUEDE_BLOQUEAR_ADMIN,
        { required: allowedRoles, current: req.user.rol },
        `Se requiere rol: ${allowedRoles.join(' o ')}`
      );
    }

    next();
  };
}

/**
 * Requiere rol admin
 */
export const requireAdmin = requireRole(UserRole.ADMIN);

/**
 * Requiere rol socio o admin
 */
export const requireSocioOrAdmin = requireRole(UserRole.SOCIO, UserRole.ADMIN);

/**
 * Requiere usuario autenticado (cualquier rol)
 */
export const requireAuth = requireRole(UserRole.ADMIN, UserRole.SOCIO, UserRole.NO_SOCIO);

// ============================================
// Helpers
// ============================================

function extractToken(req: Request): string | null {
  // 1. Cookie HttpOnly (preferido para navegadores)
  const cookieToken = req.cookies?.access_token;
  if (cookieToken) return cookieToken;

  // 2. Header Authorization: Bearer <token>
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  return null;
}

// Cookie parser simple (para no depender de cookie-parser package)
export function cookieParserMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    req.cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [key, ...valParts] = cookie.trim().split('=');
      if (key && valParts.length) {
        acc[key] = valParts.join('=');
      }
      return acc;
    }, {} as Record<string, string>);
  } else {
    req.cookies = {};
  }
  next();
}