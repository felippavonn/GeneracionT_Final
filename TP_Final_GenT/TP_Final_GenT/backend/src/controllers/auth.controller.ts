/**
 * Auth Controller - HTTP handlers para autenticación
 * Reserva Club - Club Atlético Villanorte
 */

import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { getEnv } from '../config/env';
import { ERROR_CODES } from '../utils/errors';

const env = getEnv();

// Cookie options para HttpOnly Secure cookies
const cookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días para refresh
};

const accessCookieOptions = {
  ...cookieOptions,
  maxAge: 15 * 60 * 1000, // 15 min para access
};

export class AuthController {
  // POST /api/auth/register
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      const result = await authService.register(email, password);

      // Set cookies
      res.cookie('access_token', result.tokens.accessToken, accessCookieOptions);
      res.cookie('refresh_token', result.tokens.refreshToken, cookieOptions);

      res.status(201).json({
        user: result.user,
        message: 'Usuario registrado correctamente',
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/auth/login
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);

      res.cookie('access_token', result.tokens.accessToken, accessCookieOptions);
      res.cookie('refresh_token', result.tokens.refreshToken, cookieOptions);

      res.json({
        user: result.user,
        message: 'Inicio de sesión exitoso',
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/auth/refresh
  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = req.cookies?.refresh_token;

      if (!refreshToken) {
        res.status(401).json({
          error: ERROR_CODES.TOKEN_INVALID,
          message: 'Refresh token requerido',
        });
        return;
      }

      const tokens = await authService.refresh(refreshToken);

      res.cookie('access_token', tokens.accessToken, accessCookieOptions);
      res.cookie('refresh_token', tokens.refreshToken, cookieOptions);

      res.json({ message: 'Token renovado' });
    } catch (error) {
      // Limpiar cookies en error de auth
      res.clearCookie('access_token', accessCookieOptions);
      res.clearCookie('refresh_token', cookieOptions);
      next(error);
    }
  }

  // POST /api/auth/logout
  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = req.cookies?.refresh_token;
      if (refreshToken) {
        await authService.logout(refreshToken);
      }

      res.clearCookie('access_token', accessCookieOptions);
      res.clearCookie('refresh_token', cookieOptions);

      res.json({ message: 'Sesión cerrada' });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/auth/me
  async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          error: ERROR_CODES.TOKEN_INVALID,
          message: 'No autenticado',
        });
        return;
      }

      const profile = await authService.me(req.user.id);

      res.json({
        id: profile.id,
        email: profile.email,
        rol: profile.rol,
        cuotaVigenteHasta: profile.cuotaVigenteHasta,
        bloqueadoHasta: profile.bloqueadoHasta,
        deudaPendiente: profile.deudaPendiente,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();