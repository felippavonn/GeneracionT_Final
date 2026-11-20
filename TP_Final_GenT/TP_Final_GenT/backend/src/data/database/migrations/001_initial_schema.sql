-- ============================================
-- Migración 001: Esquema Inicial Completo
-- Reserva Club - Club Atlético Villanorte
-- ============================================

-- Extensiones
CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- para gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- para búsquedas texto

-- ============================================
-- ENUMS (como tipos nativos PostgreSQL)
-- ============================================

CREATE TYPE cancha_tipo AS ENUM ('futbol5', 'padel', 'tenis');
CREATE TYPE user_rol AS ENUM ('admin', 'socio', 'no_socio');
CREATE TYPE reserva_estado AS ENUM (
  'pendiente_pago',
  'confirmada',
  'en_espera_confirmacion',
  'cancelada_gratis',
  'cancelada_con_cargo',
  'completada',
  'inasistencia'
);
CREATE TYPE lista_espera_estado AS ENUM (
  'esperando',
  'en_espera_confirmacion',
  'confirmada',
  'expirada',
  'cancelada'
);
CREATE TYPE recurrencia_bloqueo AS ENUM ('ninguna', 'semanal', 'quincenal', 'mensual');

-- ============================================
-- TABLA: usuario
-- ============================================

CREATE TABLE usuario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  rol user_rol NOT NULL DEFAULT 'no_socio',
  cuota_vigente_hasta DATE,
  bloqueado_hasta TIMESTAMPTZ,
  deuda_pendiente INTEGER NOT NULL DEFAULT 0, -- centavos
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_usuario_email ON usuario (email);
CREATE INDEX idx_usuario_rol ON usuario (rol);
CREATE INDEX idx_usuario_bloqueado_hasta ON usuario (bloqueado_hasta) WHERE bloqueado_hasta IS NOT NULL;

-- Trigger para actualizado_en
CREATE OR REPLACE FUNCTION update_actualizado_en()
RETURNS TRIGGER AS $$
BEGIN
  NEW.actualizado_en = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_usuario_actualizado_en
  BEFORE UPDATE ON usuario
  FOR EACH ROW EXECUTE FUNCTION update_actualizado_en();

-- ============================================
-- TABLA: cancha
-- ============================================

CREATE TABLE cancha (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  tipo cancha_tipo NOT NULL,
  duracion_minutos INTEGER NOT NULL,
  precio_base INTEGER NOT NULL, -- centavos
  activa BOOLEAN NOT NULL DEFAULT true,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_cancha_tipo_activa ON cancha (tipo, activa);
CREATE INDEX idx_cancha_activa ON cancha (activa) WHERE activa = true;

CREATE TRIGGER trigger_cancha_actualizado_en
  BEFORE UPDATE ON cancha
  FOR EACH ROW EXECUTE FUNCTION update_actualizado_en();

-- ============================================
-- TABLA: reserva
-- ============================================

CREATE TABLE reserva (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES usuario(id) ON DELETE RESTRICT,
  cancha_id UUID NOT NULL REFERENCES cancha(id) ON DELETE RESTRICT,
  fecha DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  duracion_minutos INTEGER NOT NULL,
  estado reserva_estado NOT NULL DEFAULT 'confirmada',
  precio_final INTEGER NOT NULL, -- centavos
  historial_precios JSONB NOT NULL,
  checkin_en TIMESTAMPTZ,
  checkout_en TIMESTAMPTZ,
  cancelada_en TIMESTAMPTZ,
  cancelacion_motivo TEXT,
  version INTEGER NOT NULL DEFAULT 1, -- optimistic locking
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índice único para concurrencia: un solo slot activo por cancha/fecha/hora
CREATE UNIQUE INDEX uq_slot_activo ON reserva (cancha_id, fecha, hora_inicio)
WHERE estado IN ('confirmada', 'en_espera_confirmacion');

-- Índices para consultas frecuentes
CREATE INDEX idx_reserva_usuario_fecha ON reserva (usuario_id, fecha);
CREATE INDEX idx_reserva_usuario_estado ON reserva (usuario_id, estado) WHERE estado IN ('confirmada', 'en_espera_confirmacion');
CREATE INDEX idx_reserva_cancha_fecha ON reserva (cancha_id, fecha);
CREATE INDEX idx_reserva_fecha_hora ON reserva (fecha, hora_inicio);
CREATE INDEX idx_reserva_inasistencias ON reserva (usuario_id, fecha) WHERE estado = 'inasistencia';
CREATE INDEX idx_reserva_cupo_semanal ON reserva (usuario_id, fecha, estado) WHERE estado IN ('confirmada', 'en_espera_confirmacion');

CREATE TRIGGER trigger_reserva_actualizado_en
  BEFORE UPDATE ON reserva
  FOR EACH ROW EXECUTE FUNCTION update_actualizado_en();

-- ============================================
-- TABLA: lista_espera
-- ============================================

CREATE TABLE lista_espera (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
  cancha_id UUID NOT NULL REFERENCES cancha(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  estado lista_espera_estado NOT NULL DEFAULT 'esperando',
  posicion INTEGER NOT NULL,
  notificado_en TIMESTAMPTZ,
  confirmado_en TIMESTAMPTZ,
  expirado_en TIMESTAMPTZ,
  version INTEGER NOT NULL DEFAULT 1,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Un usuario solo puede estar una vez en la lista para un slot específico
CREATE UNIQUE INDEX uq_lista_usuario_slot ON lista_espera (usuario_id, cancha_id, fecha, hora_inicio)
WHERE estado IN ('esperando', 'en_espera_confirmacion');

-- FIFO por slot: orden por creado_en
CREATE INDEX idx_lista_espera_slot_fifo ON lista_espera (cancha_id, fecha, hora_inicio, creado_en)
WHERE estado = 'esperando';

CREATE INDEX idx_lista_espera_usuario ON lista_espera (usuario_id);
CREATE INDEX idx_lista_espera_en_espera ON lista_espera (notificado_en) WHERE estado = 'en_espera_confirmacion';

-- ============================================
-- TABLA: bloqueo_mantenimiento
-- ============================================

CREATE TABLE bloqueo_mantenimiento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cancha_id UUID NOT NULL REFERENCES cancha(id) ON DELETE CASCADE,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  recurrencia recurrencia_bloqueo NOT NULL DEFAULT 'ninguna',
  descripcion TEXT,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_bloqueo_cancha_rango ON bloqueo_mantenimiento (cancha_id, fecha_inicio, fecha_fin);
CREATE INDEX idx_bloqueo_fecha_hora ON bloqueo_mantenimiento (fecha_inicio, fecha_fin, hora_inicio, hora_fin);

-- ============================================
-- TABLA: feriado
-- ============================================

CREATE TABLE feriado (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha DATE NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  recurrencia_anual BOOLEAN NOT NULL DEFAULT false,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_feriado_fecha ON feriado (fecha);

-- ============================================
-- TABLA: franja_pico
-- ============================================

CREATE TABLE franja_pico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dia_semana INTEGER NOT NULL CHECK (dia_semana BETWEEN 0 AND 6), -- 0=Domingo
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL CHECK (hora_fin > hora_inicio),
  activa BOOLEAN NOT NULL DEFAULT true,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_franja_pico_dia_activa ON franja_pico (dia_semana, activa) WHERE activa = true;

-- ============================================
-- TABLA: audit_log
-- ============================================

CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES usuario(id) ON DELETE SET NULL,
  accion TEXT NOT NULL,
  entidad TEXT NOT NULL,
  entidad_id UUID,
  detalle JSONB NOT NULL DEFAULT '{}',
  motivo TEXT,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_admin_fecha ON audit_log (admin_id, creado_en DESC);
CREATE INDEX idx_audit_entidad_fecha ON audit_log (entidad, creado_en DESC);
CREATE INDEX idx_audit_accion ON audit_log (accion);

-- ============================================
-- FUNCIONES AUXILIARES
-- ============================================

-- Hash para advisory lock (slot -> integer)
CREATE OR REPLACE FUNCTION hash_slot(cancha_id UUID, fecha DATE, hora_inicio TIME)
RETURNS BIGINT AS $$
DECLARE
  hash_text TEXT;
BEGIN
  hash_text := cancha_id::text || fecha::text || hora_inicio::text;
  RETURN (hashtext(hash_text))::bigint;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Verificar si una fecha es feriado (considera recurrencia anual)
CREATE OR REPLACE FUNCTION es_feriado(fecha DATE)
RETURNS BOOLEAN AS $$
DECLARE
  resultado BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM feriado
    WHERE fecha = $1
       OR (recurrencia_anual AND EXTRACT(MONTH FROM fecha)::int = EXTRACT(MONTH FROM $1)::int
                              AND EXTRACT(DAY FROM fecha)::int = EXTRACT(DAY FROM $1)::int)
  ) INTO resultado;
  RETURN resultado;
END;
$$ LANGUAGE plpgsql STABLE;

-- Verificar si una fecha/hora cae en franja pico
CREATE OR REPLACE FUNCTION es_hora_pico(fecha DATE, hora_inicio TIME)
RETURNS BOOLEAN AS $$
DECLARE
  dia_semana INTEGER;
  resultado BOOLEAN;
BEGIN
  -- 0=Domingo en PostgreSQL, ajustar si necesario
  dia_semana := EXTRACT(DOW FROM fecha)::int;
  SELECT EXISTS (
    SELECT 1 FROM franja_pico
    WHERE dia_semana = $2
      AND activa = true
      AND hora_inicio <= $1
      AND hora_fin > $1
  ) INTO resultado;
  RETURN resultado;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- COMENTARIOS
-- ============================================

COMMENT ON TABLE usuario IS 'Usuarios del sistema (admin, socio, no_socio)';
COMMENT ON TABLE cancha IS 'Canchas deportivas disponibles para reserva';
COMMENT ON TABLE reserva IS 'Reservas de turnos con estado y precio histórico';
COMMENT ON TABLE lista_espera IS 'Lista de espera FIFO por slot exacto';
COMMENT ON TABLE bloqueo_mantenimiento IS 'Bloqueos de canchas por mantenimiento';
COMMENT ON TABLE feriado IS 'Feriados para recargo fin de semana';
COMMENT ON TABLE franja_pico IS 'Franjas horarias pico para recargo +30%';
COMMENT ON TABLE audit_log IS 'Log de auditoría de acciones administrativas';

COMMENT ON COLUMN reserva.historial_precios IS 'Snapshot inmutable del precio al crear la reserva';
COMMENT ON COLUMN reserva.version IS 'Optimistic locking para updates concurrentes';
COMMENT ON COLUMN lista_espera.posicion IS 'Posición 1-based en FIFO por slot';