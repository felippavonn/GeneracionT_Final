/**
 * Cancha Service - Lógica de negocio
 * Reserva Club - Club Atlético Villanorte
 */

import { CanchaRepository } from '../data/repositories/cancha.repository';
import { getDb } from '../data/database/connection';
import type { Cancha, SlotDisponibilidad } from '../../domain/entities';

export class CanchaService {
  private repository: CanchaRepository;

  constructor() {
    this.repository = new CanchaRepository(getDb());
  }

  async todasCanchas(): Promise<Cancha[]> {
    return this.repository.findAll();
  }

  async canchasActivas(): Promise<Cancha[]> {
    return this.repository.findActivas();
  }

  async canchaPorId(id: string): Promise<Cancha | null> {
    return this.repository.findById(id);
  }

  async disponibilidad(canchaId: string, fecha: string): Promise<SlotDisponibilidad[]> {
    const cancha = await this.repository.findById(canchaId);
    if (!cancha) return [];

    const db = getDb();
    const slots: SlotDisponibilidad[] = [];
    const duracion = cancha.duracionMinutos;

    // Generar slots desde 08:00 hasta 24:00
    for (let minutos = 8 * 60; minutos < 24 * 60; minutos += duracion) {
      const hora = Math.floor(minutos / 60);
      const min = minutos % 60;
      const horaStr = `${String(hora).padStart(2, '0')}:${String(min).padStart(2, '0')}`;

      // Verificar si el slot completo encaja dentro del horario
      const finMinutos = minutos + duracion;
      if (finMinutos > 24 * 60) break;

      const horaFin = Math.floor(finMinutos / 60);
      const minFin = finMinutos % 60;
      const horaFinStr = `${String(horaFin).padStart(2, '0')}:${String(minFin).padStart(2, '0')}`;

      // Verificar si hay reserva activa en este slot
      const ocupado = await db.selectFrom('reserva')
        .select('id')
        .where('cancha_id', '=', canchaId)
        .where('fecha', '=', new Date(fecha))
        .where('hora_incio', '=', horaStr)
        .where('estado', 'in', ['confirmada', 'en_espera_confirmacion'])
        .executeTakeFirst();

      // Verificar bloqueos de mantenimiento
      const bloqueado = await db.selectFrom('bloqueo_mantenimiento')
        .select('id')
        .where('cancha_id', '=', canchaId)
        .where('fecha_fin', '>=', new Date(fecha))
        .where('fecha_incio', '<=', new Date(fecha))
        .executeTakeFirst();

      if (bloqueado) {
        slots.push({
          horaIncio: horaStr,
          horaFin: horaFinStr,
          precioFinal: cancha.precioBase,
          disponible: false,
          motivoNoDisponible: 'mantenimiento',
        });
      } else if (ocupado) {
        slots.push({
          horaIncio: horaStr,
          horaFin: horaFinStr,
          precioFinal: cancha.precioBase,
          disponible: false,
          motivoNoDisponible: 'ocupado',
        });
      } else {
        slots.push({
          horaIncio: horaStr,
          horaFin: horaFinStr,
          precioFinal: cancha.precioBase,
          disponible: true,
        });
      }
    }

    return slots;
  }

  async crearCancha(data: Omit<Cancha, 'id'>): Promise<Cancha> {
    return this.repository.create(data);
  }

  async actualizarCancha(id: string, data: Partial<Omit<Cancha, 'id'>>): Promise<Cancha> {
    return this.repository.update(id, data);
  }
}