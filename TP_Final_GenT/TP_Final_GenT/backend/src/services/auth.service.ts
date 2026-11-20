/**
 * Auth Service - Registro, Login, Refresh, Logout, JWT, Bcrypt
 * Reserva Club - Club Atlético Villanorte
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb } from '../data/database/connection';
import { getEnv } from '../config/env';
import { UserRole } from '../domain/enums';
import { ERROR_CODES, ConflictError, UnauthorizedError, BusinessRuleError } from '../utils/errors';
import { Clock, getClock } from './clock';

const env = getEnv();

interface TokenPayload {
  userId: string;
  email: string;
  rol: UserRole;
  type: 'access' | 'refresh';
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface RegisterResult {
  user: {
    id: string;
    email: string;
    rol: UserRole;
  };
  tokens: AuthTokens;
}

interface LoginResult extends RegisterResult {}

interface UserProfile {
  id: string;
  email: string;
  rol: UserRole;
  cuotaVigenteHasta: Date | null;
  bloqueadoHasta: Date | null;
  deudaPendiente: number;
}

export class AuthService {
  private clock: Clock;

  constructor(clock?: Clock) {
    this.clock = clock || getClock();
  }

  // ============================================
  // Registro
  // ============================================
  async register(email: string, password: string): Promise<RegisterResult> {
    const db = getDb();

    // Verificar email único
    const existing = await db.selectFrom('usuario')
      .select('id')
      .where('email', '=', email.toLowerCase())
      .executeTakeFirst();

    if (existing) {
      throw new ConflictError(ERROR_CODES.EMAIL_ALREADY_EXISTS, { email }, 'El email ya está registrado');
    }

    // Validar password
    if (password.length < 8) {
      throw new BusinessRuleError(ERROR_CODES.WEAK_PASSWORD, { minLength: 8 }, 'La contraseña debe tener al menos 8 caracteres');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Crear usuario (por defecto no_socio)
    const [user] = await db.insertInto('usuario')
      .values({
        email: email.toLowerCase(),
        password_hash: passwordHash,
        rol: UserRole.NO_SOCIO,
        deuda_pendiente: 0,
      })
      .returning(['id', 'email', 'rol'])
      .execute();

    // Generar tokens
    const tokens = this.generateTokens(user.id, user.email, user.rol);

    // Guardar refresh token hash en BD (para rotación/revocación)
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return {
      user: { id: user.id, email: user.email, rol: user.rol },
      tokens,
    };
  }

  // ============================================
  // Login
  // ============================================
  async login(email: string, password: string): Promise<LoginResult> {
    const db = getDb();

    const user = await db.selectFrom('usuario')
      .select(['id', 'email', 'password_hash', 'rol', 'bloqueado_hasta', 'cuota_vigente_hasta', 'deuda_pendiente'])
      .where('email', '=', email.toLowerCase())
      .executeTakeFirst();

    if (!user) {
      throw new UnauthorizedError(ERROR_CODES.INVALID_CREDENTIALS, {}, 'Credenciales inválidas');
    }

    // Verificar password
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      throw new UnauthorizedError(ERROR_CODES.INVALID_CREDENTIALS, {}, 'Credenciales inválidas');
    }

    // Generar tokens
    const tokens = this.generateTokens(user.id, user.email, user.rol);

    // Guardar refresh token hash
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return {
      user: { id: user.id, email: user.email, rol: user.rol },
      tokens,
    };
  }

  // ============================================
  // Refresh Token (rotación)
  // ============================================
  async refresh(refreshToken: string): Promise<AuthTokens> {
    const db = getDb();

    // Buscar el hash del refresh token en BD
    const tokenRecord = await db.selectFrom('refresh_token')
      .select(['id', 'usuario_id', 'token_hash', 'expira_en', 'revocado_en'])
      .where('token_hash', '=', this.hashToken(refreshToken))
      .executeTakeFirst();

    if (!tokenRecord) {
      throw new UnauthorizedError(ERROR_CODES.REFRESH_TOKEN_REVOKED, {}, 'Refresh token inválido');
    }

    if (tokenRecord.revocado_en) {
      // Token reutilizado → revocar toda la cadena del usuario
      await this.revokeAllUserTokens(tokenRecord.usuario_id);
      throw new UnauthorizedError(ERROR_CODES.REFRESH_TOKEN_REUSED, {}, 'Refresh token reutilizado - sesión invalidada');
    }

    if (new Date(tokenRecord.expira_en) < this.clock.now()) {
      throw new UnauthorizedError(ERROR_CODES.TOKEN_EXPIRED, {}, 'Refresh token expirado');
    }

    // Obtener usuario
    const user = await db.selectFrom('usuario')
      .select(['id', 'email', 'rol'])
      .where('id', '=', tokenRecord.usuario_id)
      .executeTakeFirst();

    if (!user) {
      throw new UnauthorizedError(ERROR_CODES.TOKEN_INVALID, {}, 'Usuario no encontrado');
    }

    // Revocar token actual (rotación)
    await db.updateTable('refresh_token')
      .set({ revocado_en: this.clock.now() })
      .where('id', '=', tokenRecord.id)
      .execute();

    // Generar nuevos tokens
    const tokens = this.generateTokens(user.id, user.email, user.rol);
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }

  // ============================================
  // Logout (revoca refresh token)
  // ============================================
  async logout(refreshToken: string): Promise<void> {
    const db = getDb();

    await db.updateTable('refresh_token')
      .set({ revocado_en: this.clock.now() })
      .where('token_hash', '=', this.hashToken(refreshToken))
      .execute();
  }

  // ============================================
  // Obtener perfil (para /auth/me)
  // ============================================
  async me(userId: string): Promise<UserProfile> {
    const db = getDb();

    const user = await db.selectFrom('usuario')
      .select(['id', 'email', 'rol', 'cuota_vigente_hasta', 'bloqueado_hasta', 'deuda_pendiente'])
      .where('id', '=', userId)
      .executeTakeFirst();

    if (!user) {
      throw new UnauthorizedError(ERROR_CODES.TOKEN_INVALID, {}, 'Usuario no encontrado');
    }

    return user;
  }

  // ============================================
  // Helpers privados
  // ============================================

  private generateTokens(userId: string, email: string, rol: UserRole): AuthTokens {
    const accessPayload: TokenPayload = { userId, email, rol, type: 'access' };
    const refreshPayload: TokenPayload = { userId, email, rol, type: 'refresh' };

    const accessToken = jwt.sign(accessPayload, env.JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign(refreshPayload, env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

    return { accessToken, refreshToken };
  }

  private async storeRefreshToken(userId: string, refreshToken: string): Promise<void> {
    const db = getDb();
    const tokenHash = this.hashToken(refreshToken);
    const expiraEn = new Date(this.clock.now().getTime() + 7 * 24 * 60 * 60 * 1000); // 7 días

    await db.insertInto('refresh_token')
      .values({
        usuario_id: userId,
        token_hash: tokenHash,
        expira_en: expiraEn,
      })
      .execute();
  }

  private hashToken(token: string): string {
    // Hash simple para almacenar (no bcrypt, es solo lookup)
    const crypto = await import('crypto');
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private async revokeAllUserTokens(userId: string): Promise<void> {
    const db = getDb();
    await db.updateTable('refresh_token')
      .set({ revocado_en: this.clock.now() })
      .where('usuario_id', '=', userId)
      .where('revocado_en', 'is', null)
      .execute();
  }
}

// Exportar instancia singleton para uso en controllers
export const authService = new AuthService();