/**
 * Tests de configuración base - Reserva Club Backend
 * Verifica que env, constants, clock, email se cargan correctamente
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getEnv } from '../src/config/env';
import { SYSTEM_TZ, TURNO_DURATION_MINUTES, CANCHA_TIPOS } from '../src/config/constants';
import { SystemClock, FixedClock, getClock } from '../src/services/clock';
import { getEmailAdapter, ConsoleEmailAdapter, EtherealEmailAdapter } from '../src/services/email.service';
import { ERROR_CODES } from '../src/utils/errors';

// ============================================
// Config / Env
// ============================================

describe('Config', () => {
  it('debe cargar variables de entorno con valores por defecto', () => {
    // Mock process.env para test
    vi.stubEnv('DATABASE_URL', 'postgresql://test:test@localhost:5432/test');
    vi.stubEnv('JWT_SECRET', 'a'.repeat(32));
    vi.stubEnv('JWT_REFRESH_SECRET', 'b'.repeat(32));
    vi.stubEnv('FRONTEND_URL', 'http://localhost:5173');
    vi.stubEnv('BACKEND_URL', 'http://localhost:3000');

    const env = getEnv();

    expect(env.DATABASE_URL).toBe('postgresql://test:test@localhost:5432/test');
    expect(env.JWT_SECRET.length).toBeGreaterThanOrEqual(32);
    expect(env.FRONTEND_URL).toBe('http://localhost:5173');
    expect(env.PORT).toBe(3000);
    expect(env.NODE_ENV).toBe('development');
    expect(env.EMAIL_ADAPTER).toBe('console');
  });

  it('debe fallar si faltan variables requeridas', () => {
    vi.stubEnv('DATABASE_URL', '');
    vi.stubEnv('JWT_SECRET', 'short');
    vi.stubEnv('JWT_REFRESH_SECRET', 'short');
    vi.stubEnv('FRONTEND_URL', 'invalid');

    expect(() => getEnv()).toThrow();
  });
});

// ============================================
// Constants
// ============================================

describe('Constants', () => {
  it('debe tener zona horaria correcta', () => {
    expect(SYSTEM_TZ).toBe('America/Argentina/Buenos_Aires');
  });

  it('debe tener duraciones de turno correctas', () => {
    expect(TURNO_DURATION_MINUTES.futbol5).toBe(60);
    expect(TURNO_DURATION_MINUTES.padel).toBe(90);
    expect(TURNO_DURATION_MINUTES.tenis).toBe(90);
  });

  it('debe tener tipos de cancha definidos', () => {
    expect(CANCHA_TIPOS).toEqual(['futbol5', 'padel', 'tenis']);
  });

  it('debe tener recargos y descuentos correctos', () => {
    const { RECARGO_PICO_PCT, RECARGO_FDS_FERIADO_PCT, DESCUENTO_SOCIO_PCT } = await import('../src/config/constants');
    expect(RECARGO_PICO_PCT).toBe(30);
    expect(RECARGO_FDS_FERIADO_PCT).toBe(30);
    expect(DESCUENTO_SOCIO_PCT).toBe(20);
  });
});

// ============================================
// Clock Service
// ============================================

describe('Clock Service', () => {
  let fixedClock: FixedClock;

  beforeEach(() => {
    fixedClock = new FixedClock('2025-01-13T13:00:00.000Z'); // 10:00 Argentina
  });

  it('SystemClock.now() devuelve fecha actual', () => {
    const sysClock = new SystemClock();
    const now = sysClock.now();
    expect(now).toBeInstanceOf(Date);
    expect(now.getTime()).toBeGreaterThan(0);
  });

  it('FixedClock.now() devuelve fecha fijada', () => {
    const now = fixedClock.now();
    expect(now.toISOString()).toBe('2025-01-13T13:00:00.000Z');
  });

  it('FixedClock.advance() avanza el tiempo', () => {
    fixedClock.advance(60_000); // +1 minuto
    const now = fixedClock.now();
    expect(now.toISOString()).toBe('2025-01-13T13:01:00.000Z');
  });

  it('FixedClock.set() cambia la fecha', () => {
    fixedClock.set('2025-06-15T18:30:00.000Z');
    const now = fixedClock.now();
    expect(now.toISOString()).toBe('2025-06-15T18:30:00.000Z');
  });

  it('today() devuelve fecha sin hora en TZ Argentina', () => {
    fixedClock.set('2025-01-13T13:00:00.000Z'); // 10:00 Argentina
    const today = fixedClock.today();
    expect(today.getHours()).toBe(0);
    expect(today.getMinutes()).toBe(0);
    // En TZ Argentina, 13:00 UTC = 10:00 AR, así que today = 2025-01-13
    expect(today.toISOString().startsWith('2025-01-13')).toBe(true);
  });

  it('getClock() devuelve FixedClock en test env', () => {
    vi.stubEnv('NODE_ENV', 'test');
    // Re-importar para que coja el mock
    const clock = getClock();
    expect(clock).toBeInstanceOf(FixedClock);
  });
});

// ============================================
// Email Service
// ============================================

describe('Email Service', () => {
  it('getEmailAdapter() devuelve ConsoleEmailAdapter por defecto', () => {
    vi.stubEnv('EMAIL_ADAPTER', 'console');
    const adapter = getEmailAdapter();
    expect(adapter).toBeInstanceOf(ConsoleEmailAdapter);
  });

  it('getEmailAdapter() devuelve EtherealEmailAdapter si configurado', () => {
    vi.stubEnv('EMAIL_ADAPTER', 'ethereal');
    const adapter = getEmailAdapter();
    expect(adapter).toBeInstanceOf(EtherealEmailAdapter);
  });

  it('ConsoleEmailAdapter.send() no lanza error', async () => {
    const adapter = new ConsoleEmailAdapter();
    await expect(adapter.send('test@test.com', 'Subject', '<html>Body</html>')).resolves.not.toThrow();
  });
});

// ============================================
// Errors
// ============================================

describe('Error Codes', () => {
  it('debe tener todos los códigos definidos', () => {
    expect(ERROR_CODES.SLOT_OCUPADO).toBe('SLOT_OCUPADO');
    expect(ERROR_CODES.CUPO_SEMANAL_EXCEDIDO).toBe('CUPO_SEMANAL_EXCEDIDO');
    expect(ERROR_CODES.ANTICIPACION_EXCEDIDA).toBe('ANTICIPACION_EXCEDIDA');
    expect(ERROR_CODES.INVALID_CREDENTIALS).toBe('INVALID_CREDENTIALS');
    expect(ERROR_CODES.TOKEN_EXPIRED).toBe('TOKEN_EXPIRED');
  });
});