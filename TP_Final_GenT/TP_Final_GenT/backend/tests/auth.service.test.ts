/**
 * Auth Service Tests - TDD
 * Reserva Club Backend
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AuthService } from '../src/services/auth.service';
import { getDb, closeDb, truncateAllTables, seedBaseData, createTestUsuario } from './setup';
import { ERROR_CODES } from '../src/utils/errors';
import bcrypt from 'bcryptjs';

// ============================================
// Setup
// ============================================

let authService: AuthService;

beforeEach(async () => {
  await truncateAllTables();
  await seedBaseData();
  authService = new AuthService();
});

afterEach(async () => {
  vi.clearAllMocks();
});

// ============================================
// Tests
// ============================================

describe('AuthService', () => {
  describe('register', () => {
    it('debe registrar un usuario nuevo y devolver tokens', async () => {
      const result = await authService.register('nuevo@test.com', 'password123');

      expect(result.user).toBeDefined();
      expect(result.user.email).toBe('nuevo@test.com');
      expect(result.user.rol).toBe('no_socio');
      expect(result.tokens.accessToken).toBeDefined();
      expect(result.tokens.refreshToken).toBeDefined();
    });

    it('debe fallar si email ya existe', async () => {
      await authService.register('existente@test.com', 'password123');

      await expect(authService.register('existente@test.com', 'password123'))
        .rejects.toThrow(ERROR_CODES.EMAIL_ALREADY_EXISTS);
    });

    it('debe fallar si password muy corto', async () => {
      await expect(authService.register('test@test.com', '123'))
        .rejects.toThrow(ERROR_CODES.WEAK_PASSWORD);
    });

    it('debe hashear password con bcrypt cost 12', async () => {
      const result = await authService.register('hash@test.com', 'password123');

      const db = getDb();
      const user = await db.selectFrom('usuario')
        .select('password_hash')
        .where('email', '=', 'hash@test.com')
        .executeTakeFirst();

      expect(user).toBeDefined();
      const valid = await bcrypt.compare('password123', user!.password_hash);
      expect(valid).toBe(true);
    });
  });

  describe('login', () => {
    it('debe loguear usuario existente con credenciales correctas', async () => {
      await authService.register('login@test.com', 'password123');

      const result = await authService.login('login@test.com', 'password123');

      expect(result.user).toBeDefined();
      expect(result.user.email).toBe('login@test.com');
      expect(result.tokens.accessToken).toBeDefined();
      expect(result.tokens.refreshToken).toBeDefined();
    });

    it('debe fallar con password incorrecto', async () => {
      await authService.register('fail@test.com', 'password123');

      await expect(authService.login('fail@test.com', 'wrongpassword'))
        .rejects.toThrow(ERROR_CODES.INVALID_CREDENTIALS);
    });

    it('debe fallar con usuario inexistente', async () => {
      await expect(authService.login('noexiste@test.com', 'password123'))
        .rejects.toThrow(ERROR_CODES.INVALID_CREDENTIALS);
    });
  });

  describe('refresh', () => {
    it('debe rotar refresh token y devolver nuevos tokens', async () => {
      const { tokens } = await authService.register('refresh@test.com', 'password123');

      const newTokens = await authService.refresh(tokens.refreshToken);

      expect(newTokens.accessToken).toBeDefined();
      expect(newTokens.refreshToken).toBeDefined();
      expect(newTokens.accessToken).not.toBe(tokens.accessToken);
      expect(newTokens.refreshToken).not.toBe(tokens.refreshToken);
    });

    it('debe fallar con refresh token revocado', async () => {
      const { tokens } = await authService.register('revoked@test.com', 'password123');

      // Usar una vez
      await authService.refresh(tokens.refreshToken);

      // Intentar usar de nuevo (debe fallar por rotación)
      await expect(authService.refresh(tokens.refreshToken))
        .rejects.toThrow(ERROR_CODES.REFRESH_TOKEN_REUSED);
    });

    it('debe fallar con refresh token inexistente', async () => {
      await expect(authService.refresh('token.inexistente.invalido'))
        .rejects.toThrow(ERROR_CODES.REFRESH_TOKEN_REVOKED);
    });
  });

  describe('logout', () => {
    it('debe revocar refresh token', async () => {
      const { tokens } = await authService.register('logout@test.com', 'password123');

      await authService.logout(tokens.refreshToken);

      // Intentar usar token revocado
      await expect(authService.refresh(tokens.refreshToken))
        .rejects.toThrow(ERROR_CODES.REFRESH_TOKEN_REVOKED);
    });
  });

  describe('me', () => {
    it('debe devolver perfil de usuario', async () => {
      const { user } = await authService.register('me@test.com', 'password123');

      const profile = await authService.me(user.id);

      expect(profile.id).toBe(user.id);
      expect(profile.email).toBe('me@test.com');
      expect(profile.rol).toBe('no_socio');
      expect(profile.deudaPendiente).toBe(0);
    });

    it('debe fallar con usuario inexistente', async () => {
      await expect(authService.me('00000000-0000-0000-0000-000000000000'))
        .rejects.toThrow(ERROR_CODES.TOKEN_INVALID);
    });
  });
});