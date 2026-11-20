/**
 * Database Types para Kysely - Reserva Club
 * Mapeo 1:1 con tablas PostgreSQL
 */

import { CanchaTipo, UserRole, ReservaEstado, ListaEsperaEstado, RecurrenciaBloqueo } from '../../domain/enums';

export interface UsuarioTable {
  id: string;
  email: string;
  password_hash: string;
  rol: UserRole;
  cuota_vigente_hasta: Date | null;
  bloqueado_hasta: Date | null;
  deuda_pendiente: number;
  creado_en: Date;
  actualizado_en: Date;
}

export interface CanchaTable {
  id: string;
  nombre: string;
  tipo: CanchaTipo;
  duracion_minutos: number;
  precio_base: number;
  activa: boolean;
  creado_en: Date;
  actualizado_en: Date;
}

export interface ReservaTable {
  id: string;
  usuario_id: string;
  cancha_id: string;
  fecha: Date;
  hora_inicio: string;
  duracion_minutos: number;
  estado: ReservaEstado;
  precio_final: number;
  historial_precios: HistorialPreciosJson;
  checkin_en: Date | null;
  checkout_en: Date | null;
  cancelada_en: Date | null;
  cancelacion_motivo: string | null;
  version: number;
  creado_en: Date;
  actualizado_en: Date;
}

export interface HistorialPreciosJson {
  precio_base: number;
  recargo_pico_pct: number;
  recargo_fds_feriado_pct: number;
  descuento_socio_pct: number;
  total_final: number;
  calculado_en: string;
}

export interface ListaEsperaTable {
  id: string;
  usuario_id: string;
  cancha_id: string;
  fecha: Date;
  hora_inicio: string;
  estado: ListaEsperaEstado;
  posicion: number;
  notificado_en: Date | null;
  confirmado_en: Date | null;
  expirado_en: Date | null;
  version: number;
  creado_en: Date;
}

export interface BloqueoMantenimientoTable {
  id: string;
  cancha_id: string;
  fecha_inicio: Date;
  fecha_fin: Date;
  hora_inicio: string;
  hora_fin: string;
  recurrencia: RecurrenciaBloqueo;
  descripcion: string | null;
  creado_en: Date;
}

export interface FeriadoTable {
  id: string;
  fecha: Date;
  nombre: string;
  recurrencia_anual: boolean;
  creado_en: Date;
}

export interface FranjaPicoTable {
  id: string;
  dia_semana: number;
  hora_inicio: string;
  hora_fin: string;
  activa: boolean;
  creado_en: Date;
}

export interface AuditLogTable {
  id: string;
  admin_id: string | null;
  accion: string;
  entidad: string;
  entidad_id: string | null;
  detalle: Record<string, unknown>;
  motivo: string | null;
  creado_en: Date;
}

// ============================================
// Kysely Database Interface
// ============================================

export interface DB {
  usuario: UsuarioTable;
  cancha: CanchaTable;
  reserva: ReservaTable;
  lista_espera: ListaEsperaTable;
  bloqueo_mantenimiento: BloqueoMantenimientoTable;
  feriado: FeriadoTable;
  franja_pico: FranjaPicoTable;
  audit_log: AuditLogTable;
}