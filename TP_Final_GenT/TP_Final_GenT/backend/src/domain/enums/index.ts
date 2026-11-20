/**
 * Enums de dominio - Reserva Club
 * Definiciones tipadas para TypeScript y Kysely
 */

export enum CanchaTipo {
  FUTBOL5 = 'futbol5',
  PADEL = 'padel',
  TENIS = 'tenis',
}

export enum UserRole {
  ADMIN = 'admin',
  SOCIO = 'socio',
  NO_SOCIO = 'no_socio',
}

export enum ReservaEstado {
  PENDIENTE_PAGO = 'pendiente_pago',
  CONFIRMADA = 'confirmada',
  EN_ESPERA_CONFIRMACION = 'en_espera_confirmacion',
  CANCELADA_GRATIS = 'cancelada_gratis',
  CANCELADA_CON_CARGO = 'cancelada_con_cargo',
  COMPLETADA = 'completada',
  INASISTENCIA = 'inasistencia',
}

export enum ListaEsperaEstado {
  ESPERANDO = 'esperando',
  EN_ESPERA_CONFIRMACION = 'en_espera_confirmacion',
  CONFIRMADA = 'confirmada',
  EXPIRADA = 'expirada',
  CANCELADA = 'cancelada',
}

export enum RecurrenciaBloqueo {
  NINGUNA = 'ninguna',
  SEMANAL = 'semanal',
  QUINCENAL = 'quincenal',
  MENSUAL = 'mensual',
}

export enum AuditAccion {
  // Auth
  USER_REGISTER = 'user_register',
  USER_LOGIN = 'user_login',
  USER_LOGIN_FAILED = 'user_login_failed',
  USER_LOGOUT = 'user_logout',
  TOKEN_REFRESH = 'token_refresh',

  // Reservas
  RESERVA_CREAR = 'reserva_crear',
  RESERVA_CANCELAR = 'reserva_cancelar',
  RESERVA_CHECKIN = 'reserva_checkin',
  RESERVA_OVERRIDE_CREAR = 'reserva_override_crear',
  RESERVA_OVERRIDE_CANCELAR = 'reserva_override_cancelar',

  // Lista espera
  LISTA_UNIRSE = 'lista_unirse',
  LISTA_CONFIRMAR = 'lista_confirmar',
  LISTA_CANCELAR = 'lista_cancelar',
  LISTA_PROMOVER = 'lista_promover',
  LISTA_EXPIRAR = 'lista_expirar',

  // Admin entidades
  CANCHA_CREAR = 'cancha_crear',
  CANCHA_ACTUALIZAR = 'cancha_actualizar',
  CANCHA_DESACTIVAR = 'cancha_desactivar',
  FERIADO_CREAR = 'feriado_crear',
  FERIADO_ELIMINAR = 'feriado_eliminar',
  FRANJA_PICO_CREAR = 'franja_pico_crear',
  FRANJA_PICO_ACTUALIZAR = 'franja_pico_actualizar',
  FRANJA_PICO_ELIMINAR = 'franja_pico_eliminar',
  BLOQUEO_CREAR = 'bloqueo_crear',
  BLOQUEO_ELIMINAR = 'bloqueo_eliminar',
  USUARIO_CAMBIAR_ROL = 'usuario_cambiar_rol',
  USUARIO_ACTUALIZAR_CUOTA = 'usuario_actualizar_cuota',
  USUARIO_BLOQUEAR = 'usuario_bloquear',
  USUARIO_AJUSTAR_DEUDA = 'usuario_ajustar_deuda',
  INASISTENCIA_PROCESAR = 'inasistencia_procesar',
  INASISTENCIA_REVERTIR_BLOQUEO = 'inasistencia_revertir_bloqueo',
}

export enum AuditEntidad {
  USUARIO = 'usuario',
  CANCHA = 'cancha',
  RESERVA = 'reserva',
  LISTA_ESPERA = 'lista_espera',
  FERIADO = 'feriado',
  FRANJA_PICO = 'franja_pico',
  BLOQUEO_MANTENIMIENTO = 'bloqueo_mantenimiento',
  AUTH = 'auth',
}