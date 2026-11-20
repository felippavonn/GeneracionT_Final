/**
 * Clock Service - Abstracción del reloj para tests determinísticos
 * Reserva Club - Club Atlético Villanorte
 */

import { SYSTEM_TZ } from '../config/constants';

export interface Clock {
  /** Fecha y hora actual (Date object) */
  now(): Date;
  /** ISO string de la fecha actual */
  nowISO(): string;
  /** Fecha de "hoy" en la zona horaria del sistema (sin hora) */
  today(): Date;
  /** Avanza el reloj fijo (solo para test clock) */
  advance?(ms: number): void;
  /** Fija el reloj a una fecha específica (solo para test clock) */
  set?(date: Date): void;
}

/**
 * Reloj de producción - usa la hora real del sistema en TZ Argentina
 */
export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }

  nowISO(): string {
    return new Date().toISOString();
  }

  today(): Date {
    const now = new Date();
    // Convertir a TZ Argentina y obtener solo la fecha
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: SYSTEM_TZ,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const parts = formatter.formatToParts(now);
    const year = parts.find(p => p.type === 'year')?.value;
    const month = parts.find(p => p.type === 'month')?.value;
    const day = parts.find(p => p.type === 'day')?.value;
    return new Date(`${year}-${month}-${day}T00:00:00`);
  }
}

/**
 * Reloj fijo para tests - controlable programáticamente
 */
export class FixedClock implements Clock {
  private _now: Date;

  constructor(initialDate: Date | string = new Date()) {
    this._now = initialDate instanceof Date ? initialDate : new Date(initialDate);
  }

  now(): Date {
    return new Date(this._now.getTime());
  }

  nowISO(): string {
    return this._now.toISOString();
  }

  today(): Date {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: SYSTEM_TZ,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const parts = formatter.formatToParts(this._now);
    const year = parts.find(p => p.type === 'year')?.value;
    const month = parts.find(p => p.type === 'month')?.value;
    const day = parts.find(p => p.type === 'day')?.value;
    return new Date(`${year}-${month}-${day}T00:00:00`);
  }

  advance(ms: number): void {
    this._now = new Date(this._now.getTime() + ms);
  }

  set(date: Date | string): void {
    this._now = date instanceof Date ? date : new Date(date);
  }

  get fixedDate(): Date {
    return new Date(this._now.getTime());
  }
}

// Instancia singleton para producción
const systemClock = new SystemClock();

// Factory que devuelve el reloj apropiado según entorno
export function getClock(): Clock {
  if (process.env.NODE_ENV === 'test') {
    // En tests, se debe inyectar explícitamente via fixedClock
    // Esta es una fallback, pero los tests DEBEN inyectar su propio FixedClock
    return new FixedClock();
  }
  return systemClock;
}

// Exportar instancias para uso directo en tests
export const fixedClock = new FixedClock();
export const systemClockInstance = systemClock;