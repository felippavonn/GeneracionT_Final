/**
 * Migration Runner - Ejecuta migraciones SQL numeradas
 * Reserva Club - Club Atlético Villanorte
 */

import { getDb } from './connection';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

interface MigrationRecord {
  nombre: string;
  ejecutada_en: Date;
}

async function ensureMigrationsTable(db: ReturnType<typeof getDb>): Promise<void> {
  await db.schema
    .createTable('migrations')
    .ifNotExists()
    .addColumn('nombre', 'text', col => col.primaryKey())
    .addColumn('ejecutada_en', 'timestamp', col => col.defaultTo('now()').notNull())
    .execute();
}

async function getExecutedMigrations(db: ReturnType<typeof getDb>): Promise<string[]> {
  const rows = await db.selectFrom('migrations')
    .select('nombre')
    .orderBy('nombre')
    .execute();
  return rows.map(r => r.nombre);
}

function getMigrationFiles(): string[] {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    console.log('📁 Directorio de migraciones no existe:', MIGRATIONS_DIR);
    return [];
  }

  return fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort(); // Orden alfabético = orden numérico (001, 002, ...)
}

async function runMigrations(): Promise<void> {
  console.log('🔄 Ejecutando migraciones...');

  const db = getDb();
  await ensureMigrationsTable(db);

  const executed = await getExecutedMigrations(db);
  const files = getMigrationFiles();

  if (files.length === 0) {
    console.log('📭 No hay archivos de migración');
    return;
  }

  for (const file of files) {
    if (executed.includes(file)) {
      console.log(`⏭️  Saltando ${file} (ya ejecutada)`);
      continue;
    }

    console.log(`▶️  Ejecutando ${file}...`);
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf-8');

    try {
      await db.transaction().execute(async (trx) => {
        await trx.executeQuery(sql);
        await trx.insertInto('migrations').values({ nombre: file }).execute();
      });
      console.log(`✅ ${file} completada`);
    } catch (error) {
      console.error(`❌ Error en ${file}:`, error);
      process.exit(1);
    }
  }

  console.log('🎉 Todas las migraciones ejecutadas');
  await db.destroy();
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations().catch(console.error);
}

export { runMigrations };