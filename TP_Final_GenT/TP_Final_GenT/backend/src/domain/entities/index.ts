/**
 * Entidades de dominio - Reserva Club
 * Tipos TypeScript puros (sin dependencias de framework/BD)
 */

import { CanchaTipo, UserRole, ReservaEstado, ListaEsperaEstado, RecurrenciaBloqueo } from '../enums';

// ============================================
// Tipos base
// ============================================

export type UUID = string & { readonly __brand: unique symbol };
export type Email = string & { readonly __brand: unique symbol };
export type Timestamp = Date & { readonly __brand: unique symbol };

function uuid(): UUID { return '' as UUID; }
function email(): Email { return '' as Email; }
function timestamp(): Timestamp { return new Date() as Timestamp; }

// ============================================
// Usuario
// ============================================

export interface Usuario {
  id: UUID;
  email: Email;
  passwordHash: string;
  rol: UserRole;
  cuotaVigenteHasta: Date | null;    // null = no aplica (admin/no_socio) o sin vencimiento
  bloqueadoHasta: Date | null;       // null = no bloqueado
  deudaPendiente: number;            // centavos (evita float)
  creadoEn: Timestamp;
  actualizadoEn: Timestamp;
}

// Para responses (sin password)
export interface UsuarioPublico {
  id: UUID;
  email: Email;
  rol: UserRole;
  cuotaVigenteHasta: Date | null;
  bloqueadoHasta: Date | null;
  deudaPendiente: number;
  creadoEn: Timestamp;
}

// ============================================
// Cancha
// ============================================

export interface Cancha {
  id: UUID;
  nombre: string;
  tipo: CanchaTipo;
  duracionMinutos: number;
  precioBase: number;           // centavos
  activa: boolean;
  creadoEn: Timestamp;
  actualizadoEn: Timestamp;
}

// ============================================
// Reserva
// ============================================

export interface Reserva {
  id: UUID;
  usuarioId: UUID;
  canchaId: UUID;
  fecha: Date;                  // solo fecha (YYYY-MM-DD) en TZ local
  horaInicio: string;           // HH:mm en TZ local
  duracionMinutos: number;      // derivado de cancha al crear
  estado: ReservaEstado;
  precioFinal: number;          // centavos
  historialPrecios: HistorialPrecios; // snapshot inmutable
  checkinEn: Timestamp | null;
  checkoutEn: Timestamp | null;
  canceladaEn: Timestamp | null;
  cancelacionMotivo: string | null;
  version: number;              // optimistic locking
  creadoEn: Timestamp;
  actualizadoEn: Timestamp;
}

// Snapshot de precio al momento de crear la reserva
export interface HistorialPrecios {
  precioBase: number;
  recargoPicoPct: number;
  recargoFdsFeriadoPct: number;
  descuentoSocioPct: number;
  totalFinal: number;
  calculadoEn: Timestamp;
}

// Para crear reserva (input)
export interface CrearReservaInput {
  usuarioId: UUID;
  canchaId: UUID;
  fecha: Date;
  horaInicio: string; // HH:mm
}

// Para disponibilidad (output)
export interface SlotDisponibilidad {
  horaInicio: string;     // HH:mm
  horaFin: string;        // HH:mm
  precioFinal: number;    // centavos
  disponible: boolean;
  motivoNoDisponible?: string;
}

// ============================================
// Lista de Espera
// ============================================

export interface ListaEspera {
  id: UUID;
  usuarioId: UUID;
  canchaId: UUID;
  fecha: Date;
  horaInicio: string;           // HH:mm
  estado: ListaEsperaEstado;
  posicion: number;             // 1-based en FIFO
  notificadoEn: Timestamp | null;
  confirmadoEn: Timestamp | null;
  expiradoEn: Timestamp | null;
  version: number;
  creadoEn: Timestamp;
}

// ============================================
// Bloqueo Mantenimiento
// ============================================

export interface BloqueoMantenimiento {
  id: UUID;
  canchaId: UUID;
  fechaInicio: Date;
  fechaFin: Date;
  horaInicio: string;           // HH:mm
  horaFin: string;              // HH:mm
  recurrencia: RecurrenciaBloqueo;
  descripcion: string | null;
  creadoEn: Timestamp;
}

// ============================================
// Feriado
// ============================================

export interface Feriado {
  id: UUID;
  fecha: Date;
  nombre: string;
  recurrenciaAnual: boolean;
  creadoEn: Timestamp;
}

// ============================================
// Franja Pico
// ============================================

export interface FranjaPico {
  id: UUID;
  diaSemana: number;            // 0=Domingo ... 6=Sábado
  horaInicio: string;           // HH:mm
  horaFin: string;              // HH:mm
  activa: boolean;
  creadoEn: Timestamp;
}

// ============================================
// Audit Log
// ============================================

export interface AuditLog {
  id: UUID;
  adminId: UUID | null;         // null para acciones de sistema
  accion: string;               // AuditAccion enum value
  entidad: string;              // AuditEntidad enum value
  entidadId: UUID | null;
  detalle: Record<string, unknown>;
  motivo: string | null;
  creadoEn: Timestamp;
}