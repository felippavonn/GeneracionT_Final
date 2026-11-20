/**
 * Vitest Global Setup - Reserva Club Backend
 * Configura clock fijo, base de datos de test, limpieza
 */

import { beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import { FixedClock } from '../src/services/clock';
import { getDb, closeDb, withTransaction } from '../src/data/database/connection';
import type { DB } from '../src/data/database/types';

// ============================================
// Clock Fijo Global para Tests
// ============================================

// Fecha base para tests: 2025-01-13 10:00:00 Argentina (UTC-3)
const TEST_BASE_DATE = new Date('2025-01-13T13:00:00.000Z'); // 10:00 en Argentina

export const testClock = new FixedClock(TEST_BASE_DATE);

// Sobrescribir getClock para que devuelva el clock fijo en tests
vi.mock('../src/services/clock', () => ({
  ...vi.requireActual('../src/services/clock'),
  getClock: () => testClock,
  fixedClock: testClock,
  systemClockInstance: new (vi.requireActual('../src/services/clock').SystemClock)(),
}));

// ============================================
// Base de Datos de Test
// ============================================

let testDb: ReturnType<typeof getDb> | null = null;

export async function getTestDb(): Promise<ReturnType<typeof getDb>> {
  if (!testDb) {
    // En tests, usamos la misma DB pero con transacciones que hacemos rollback
    // O idealmente una branch de Neon para tests
    testDb = getDb();
  }
  return testDb;
}

export async function closeTestDb(): Promise<void> {
  if (testDb) {
    await closeDb();
    testDb = null;
  }
}

// ============================================
// Limpieza entre tests (truncate tables)
// ============================================

const TABLES_TO_TRUNCATE = [
  'audit_log',
  'lista_espera',
  'reserva',
  'bloqueo_mantenimiento',
  'franja_pico',
  'feriado',
  'cancha',
  'usuario',
];

export async function truncateAllTables(): Promise<void> {
  const db = await getTestDb();
  await withTransaction(async (trx) => {
    for (const table of TABLES_TO_TRUNCATE) {
      await trx.executeQuery(`TRUNCATE TABLE ${table} RESTART IDENTITY CASCADE`);
    }
  });
}

export async function seedBaseData(): Promise<void> {
  const db = await getTestDb();
  // Re-ejecutar seeds mínimos para tests
  await withTransaction(async (trx) => {
    // Canchas
    await trx.executeQuery(`
      INSERT INTO cancha (id, nombre, tipo, duracion_minutos, precio_base, activa) VALUES
        (gen_random_uuid(), 'Cancha Fútbol 5 - 1', 'futbol5', 60, 12000, true),
        (gen_random_uuid(), 'Cancha Fútbol 5 - 2', 'futbol5', 60, 12000, true),
        (gen_random_uuid(), 'Cancha Pádel - 1', 'padel', 90, 15000, true),
        (gen_random_uuid(), 'Cancha Pádel - 2', 'padel', 90, 15000, true),
        (gen_random_uuid(), 'Cancha Pádel - 3', 'padel', 90, 15000, true),
        (gen_random_uuid(), 'Cancha Tenis - 1', 'tenis', 90, 18000, true)
    `);

    // Admin user
    await trx.executeQuery(`
      INSERT INTO usuario (id, email, password_hash, rol, deuda_pendiente) VALUES
        (gen_random_uuid(), 'admin@club.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.PZvO.S', 'admin', 0)
    `);

    // Franjas pico default
    await trx.executeQuery(`
      INSERT INTO franja_pico (dia_semana, hora_inicio, hora_fin, activa) VALUES
        (1, '18:00', '22:00', true), (2, '18:00', '22:00', true),
        (3, '18:00', '22:00', true), (4, '18:00', '22:00', true), (5, '18:00', '22:00', true)
    `);

    // Feriados básicos
    await trx.executeQuery(`
      INSERT INTO feriado (fecha, nombre, recurrencia_anual) VALUES
        ('2025-01-01', 'Año Nuevo', true),
        ('2025-05-01', 'Día del Trabajador', true),
        ('2025-12-25', 'Navidad', true)
    `);
  });
}

// ============================================
// Vitest Hooks Globales
// ============================================

beforeAll(async () => {
  console.log('🧪 Test setup: initializing...');
  await getTestDb();
  await seedBaseData();
  console.log('✅ Test setup complete');
});

afterAll(async () => {
  console.log('🧪 Test teardown: closing...');
  await closeTestDb();
  console.log('✅ Test teardown complete');
});

beforeEach(async () => {
  // Reset clock to base date before each test
  testClock.set(TEST_BASE_DATE);
  await truncateAllTables();
  await seedBaseData();
});

afterEach(async () => {
  // Cleanup if needed
  vi.clearAllMocks();
});

// ============================================
// Helpers para Tests
// ============================================

export async function createTestUsuario(
  overrides: Partial<DB['usuario']> = {}
): Promise<DB['usuario']> {
  const db = await getTestDb();
  const email = overrides.email || `test${Date.now()}@example.com`;
  const passwordHash = overrides.password_hash || '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.PZvO.S';

  const [user] = await db.insertInto('usuario')
    .values({
      email,
      password_hash: passwordHash,
      rol: overrides.rol || 'no_socio',
      cuota_vigente_hasta: overrides.cuota_vigente_hasta || null,
      bloqueado_hasta: overrides.bloqueado_hasta || null,
      deuda_pendiente: overrides.deuda_pendiente || 0,
    })
    .returningAll()
    .execute();

  return user;
}

export async function createTestSocio(
  overrides: Partial<DB['usuario']> = {}
): Promise<DB['usuario']> {
  return createTestUsuario({
    ...overrides,
    rol: 'socio',
    cuota_vigente_hasta: overrides.cuota_vigente_hasta || new Date('2025-12-31'),
  });
}

export async function createTestCancha(
  overrides: Partial<DB['cancha']> = {}
): Promise<DB['cancha']> {
  const db = await getTestDb();
  const [cancha] = await db.insertInto('cancha')
    .values({
      nombre: overrides.nombre || `Cancha Test ${Date.now()}`,
      tipo: overrides.tipo || 'padel',
      duracion_minutos: overrides.duracion_minutos || 90,
      precio_base: overrides.precio_base || 15000,
      activa: overrides.activa ?? true,
    })
    .returningAll()
    .execute();
  return cancha;
}

export async function loginAsUser(email: string, password: string = 'Admin123!'): Promise<{ token: string; refreshToken: string }> {
  // Helper para tests de integración - hacer login real
  const { default: request } = await import('supertest');
  const { app } = await import('../src/app');

  const res = await request(app)
    .post('/api/auth/login')
    .send({ email, password });

  if (res.status !== 200) {
    throw new Error(`Login failed: ${res.status} ${JSON.stringify(res.body)}`);
  }

  // Extraer cookies
  const cookies = res.headers['set-cookie'] || [];
  const accessCookie = cookies.find(c => c.startsWith('access_token='));
  const refreshCookie = cookies.find(c => c.startsWith('refresh_token='));

  return {
    token: accessCookie?.split(';')[0].split('=')[1] || '',
    refreshToken: refreshCookie?.split(';')[0].split('=')[1] || '',
  };
}