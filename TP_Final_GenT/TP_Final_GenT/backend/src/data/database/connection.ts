/**
 * Database Connection - Kysely con PostgreSQL (Neon)
 * Reserva Club - Club Atlético Villanorte
 */

import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';
import { getEnv } from '../../config/env';
import type { DB } from './types';

let dbInstance: Kysely<DB> | null = null;

/**
 * Obtiene la instancia singleton de Kysely
 */
export function getDb(): Kysely<DB> {
  if (dbInstance) return dbInstance;

  const env = getEnv();
  const pool = new Pool({
    connectionString: env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  // Test connection on startup
  pool.query('SELECT 1')
    .then(() => console.log('✅ Database connected'))
    .catch(err => {
      console.error('❌ Database connection failed:', err.message);
      process.exit(1);
    });

  dbInstance = new Kysely<DB>({
    dialect: new PostgresDialect({ pool }),
    log: process.env.NODE_ENV === 'development' ? [
      { level: 'query', duration: true },
      { level: 'error' },
    ] : ['error'],
  });

  return dbInstance;
}

/**
 * Cierra la conexión (para tests y shutdown)
 */
export async function closeDb(): Promise<void> {
  if (dbInstance) {
    await dbInstance.destroy();
    dbInstance = null;
  }
}

/**
 * Helper para transacciones con tipado
 */
export async function withTransaction<T>(
  fn: (trx: Kysely<DB>) => Promise<T>
): Promise<T> {
  const db = getDb();
  return await db.transaction().execute(fn);
}

/**
 * Ejecuta migraciones SQL desde archivo
 */
export async function runMigration(sql: string): Promise<void> {
  const db = getDb();
  await db.executeQuery(sql);
}