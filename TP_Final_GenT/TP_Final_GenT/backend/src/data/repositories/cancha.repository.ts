/**
 * Cancha Repository - Acceso a datos
 * Reserva Club - Club Atlético Villanorte
 */

import { Kysely } from 'kysely';
import { DB } from '../database/types';
import type { Cancha } from '../../domain/entities';

export class CanchaRepository {
  constructor(private db: Kysely<DB>) {}

  async findAll(): Promise<Cancha[]> {
    const rows = await this.db.selectFrom('cancha')
      .select(['id', 'nombre', 'tipo', 'duracion_minutos', 'precio_base', 'activa'])
      .orderBy('nombre')
      .execute();
    return rows.map(this.toDomain);
  }

  async findActivas(): Promise<Cancha[]> {
    const rows = await this.db.selectFrom('cancha')
      .select(['id', 'nombre', 'tipo', 'duracion_minutos', 'precio_base', 'activa'])
      .where('activa', '=', true)
      .orderBy('nombre')
      .execute();
    return rows.map(this.toDomain);
  }

  async findById(id: string): Promise<Cancha | null> {
    const row = await this.db.selectFrom('cancha')
      .select(['id', 'nombre', 'tipo', 'duracion_minutos', 'precio_base', 'activa'])
      .where('id', '=', id)
      .executeTakeFirst();
    return row ? this.toDomain(row) : null;
  }

  async create(data: Omit<Cancha, 'id'>): Promise<Cancha> {
    const [row] = await this.db.insertInto('cancha')
      .values({
        nombre: data.nombre,
        tipo: data.tipo,
        duracion_minutos: data.duracionMinutos,
        precio_base: data.precioBase,
        activa: data.activa,
      })
      .returningAll()
      .execute();
    return this.toDomain(row);
  }

  async update(id: string, data: Partial<Omit<Cancha, 'id'>>): Promise<Cancha> {
    const values: Record<string, unknown> = {};
    if (data.nombre !== undefined) values.nombre = data.nombre;
    if (data.precioBase !== undefined) values.precio_base = data.precioBase;
    if (data.activa !== undefined) values.activa = data.activa;

    const [row] = await this.db.updateTable('cancha')
      .set(values)
      .where('id', '=', id)
      .returningAll()
      .execute();
    return this.toDomain(row);
  }

  private toDomain(row: {
    id: string;
    nombre: string;
    tipo: string;
    duracion_minutos: number;
    precio_base: number;
    activa: boolean;
  }): Cancha {
    return {
      id: row.id as Cancha['id'],
      nombre: row.nombre,
      tipo: row.tipo as Cancha['tipo'],
      duracionMinutos: row.duracion_minutos,
      precioBase: row.precio_base,
      activa: row.activa,
    };
  }
}