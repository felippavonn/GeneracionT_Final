-- ============================================
-- Reserva Club - Database Schema Completo
-- Club Atlético Villanorte
-- Ejecutar en orden: este archivo contiene todo
-- ============================================

-- Extensiones
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================
-- ENUMS
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
-- TABLAS
-- ============================================

-- Usuario
CREATE TABLE usuario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  rol user_rol NOT NULL DEFAULT 'no_socio',
  cuota_vigente_hasta DATE,
  bloqueado_hasta TIMESTAMPTZ,
  deuda_pendiente INTEGER NOT NULL DEFAULT 0,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Refresh Token (para rotación JWT)
CREATE TABLE refresh_token (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expira_en TIMESTAMPTZ NOT NULL,
  revocado_en TIMESTAMPTZ,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Cancha
CREATE TABLE cancha (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  tipo cancha_tipo NOT NULL,
  duracion_minutos INTEGER NOT NULL,
  precio_base INTEGER NOT NULL,
  activa BOOLEAN NOT NULL DEFAULT true,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Reserva
CREATE TABLE reserva (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES usuario(id) ON DELETE RESTRICT,
  cancha_id UUID NOT NULL REFERENCES cancha(id) ON DELETE RESTRICT,
  fecha DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  duracion_minutos INTEGER NOT NULL,
  estado reserva_estado NOT NULL DEFAULT 'confirmada',
  precio_final INTEGER NOT NULL,
  historial_precios JSONB NOT NULL,
  checkin_en TIMESTAMPTZ,
  checkout_en TIMESTAMPTZ,
  cancelada_en TIMESTAMPTZ,
  cancelacion_motivo TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Lista de Espera
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

-- Bloqueo Mantenimiento
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

-- Feriado
CREATE TABLE feriado (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha DATE NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  recurrencia_anual BOOLEAN NOT NULL DEFAULT false,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Franja Pico
CREATE TABLE franja_pico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dia_semana INTEGER NOT NULL CHECK (dia_semana BETWEEN 0 AND 6),
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL CHECK (hora_fin > hora_inicio),
  activa BOOLEAN NOT NULL DEFAULT true,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Audit Log
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

-- ============================================
-- ÍNDICES
-- ============================================

-- Usuario
CREATE INDEX idx_usuario_email ON usuario (email);
CREATE INDEX idx_usuario_rol ON usuario (rol);
CREATE INDEX idx_usuario_bloqueado_hasta ON usuario (bloqueado_hasta) WHERE bloqueado_hasta IS NOT NULL;

-- Refresh Token
CREATE INDEX idx_refresh_token_usuario ON refresh_token (usuario_id);
CREATE INDEX idx_refresh_token_hash ON refresh_token (token_hash);
CREATE INDEX idx_refresh_token_expira ON refresh_token (expira_en) WHERE revocado_en IS NULL;

-- Cancha
CREATE INDEX idx_cancha_tipo_activa ON cancha (tipo, activa);
CREATE INDEX idx_cancha_activa ON cancha (activa) WHERE activa = true;

-- Reserva - Críticos para concurrencia
CREATE UNIQUE INDEX uq_slot_activo ON reserva (cancha_id, fecha, hora_inicio)
WHERE estado IN ('confirmada', 'en_espera_confirmacion');

CREATE INDEX idx_reserva_usuario_fecha ON reserva (usuario_id, fecha);
CREATE INDEX idx_reserva_usuario_estado ON reserva (usuario_id, estado) WHERE estado IN ('confirmada', 'en_espera_confirmacion');
CREATE INDEX idx_reserva_cancha_fecha ON reserva (cancha_id, fecha);
CREATE INDEX idx_reserva_fecha_hora ON reserva (fecha, hora_inicio);
CREATE INDEX idx_reserva_inasistencias ON reserva (usuario_id, fecha) WHERE estado = 'inasistencia';
CREATE INDEX idx_reserva_cupo_semanal ON reserva (usuario_id, fecha, estado) WHERE estado IN ('confirmada', 'en_espera_confirmacion');

-- Lista de Espera
CREATE UNIQUE INDEX uq_lista_usuario_slot ON lista_espera (usuario_id, cancha_id, fecha, hora_inicio)
WHERE estado IN ('esperando', 'en_espera_confirmacion');

CREATE INDEX idx_lista_espera_slot_fifo ON lista_espera (cancha_id, fecha, hora_inicio, creado_en)
WHERE estado = 'esperando';

CREATE INDEX idx_lista_espera_usuario ON lista_espera (usuario_id);
CREATE INDEX idx_lista_espera_en_espera ON lista_espera (notificado_en) WHERE estado = 'en_espera_confirmacion';

-- Bloqueo Mantenimiento
CREATE INDEX idx_bloqueo_cancha_rango ON bloqueo_mantenimiento (cancha_id, fecha_inicio, fecha_fin);
CREATE INDEX idx_bloqueo_fecha_hora ON bloqueo_mantenimiento (fecha_inicio, fecha_fin, hora_inicio, hora_fin);

-- Feriado
CREATE INDEX idx_feriado_fecha ON feriado (fecha);

-- Franja Pico
CREATE INDEX idx_franja_pico_dia_activa ON franja_pico (dia_semana, activa) WHERE activa = true;

-- Audit Log
CREATE INDEX idx_audit_admin_fecha ON audit_log (admin_id, creado_en DESC);
CREATE INDEX idx_audit_entidad_fecha ON audit_log (entidad, creado_en DESC);
CREATE INDEX idx_audit_accion ON audit_log (accion);

-- ============================================
-- TRIGGERS updated_en
-- ============================================

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

CREATE TRIGGER trigger_cancha_actualizado_en
  BEFORE UPDATE ON cancha
  FOR EACH ROW EXECUTE FUNCTION update_actualizado_en();

CREATE TRIGGER trigger_reserva_actualizado_en
  BEFORE UPDATE ON reserva
  FOR EACH ROW EXECUTE FUNCTION update_actualizado_en();

-- ============================================
-- FUNCIONES AUXILIARES
-- ============================================

-- Hash para advisory lock
CREATE OR REPLACE FUNCTION hash_slot(cancha_id UUID, fecha DATE, hora_inicio TIME)
RETURNS BIGINT AS $$
DECLARE
  hash_text TEXT;
BEGIN
  hash_text := cancha_id::text || fecha::text || hora_inicio::text;
  RETURN (hashtext(hash_text))::bigint;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Verificar feriado
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

-- Verificar hora pico
CREATE OR REPLACE FUNCTION es_hora_pico(fecha DATE, hora_inicio TIME)
RETURNS BOOLEAN AS $$
DECLARE
  dia_semana INTEGER;
  resultado BOOLEAN;
BEGIN
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
-- SEEDS INICIALES
-- ============================================

-- Canchas (6 total)
INSERT INTO cancha (id, nombre, tipo, duracion_minutos, precio_base, activa) VALUES
  (gen_random_uuid(), 'Cancha Fútbol 5 - 1', 'futbol5', 60, 12000, true),
  (gen_random_uuid(), 'Cancha Fútbol 5 - 2', 'futbol5', 60, 12000, true),
  (gen_random_uuid(), 'Cancha Pádel - 1', 'padel', 90, 15000, true),
  (gen_random_uuid(), 'Cancha Pádel - 2', 'padel', 90, 15000, true),
  (gen_random_uuid(), 'Cancha Pádel - 3', 'padel', 90, 15000, true),
  (gen_random_uuid(), 'Cancha Tenis - 1', 'tenis', 90, 18000, true)
ON CONFLICT DO NOTHING;

-- Usuario Admin (password: Admin123!)
INSERT INTO usuario (id, email, password_hash, rol, deuda_pendiente) VALUES
  (
    gen_random_uuid(),
    'admin@club.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.PZvO.S',
    'admin',
    0
  )
ON CONFLICT (email) DO NOTHING;

-- Franjas Pico Default (Lun-Vie 18-22)
INSERT INTO franja_pico (dia_semana, hora_inicio, hora_fin, activa) VALUES
  (1, '18:00', '22:00', true),
  (2, '18:00', '22:00', true),
  (3, '18:00', '22:00', true),
  (4, '18:00', '22:00', true),
  (5, '18:00', '22:00', true)
ON CONFLICT DO NOTHING;

-- Feriados 2025 Argentina
INSERT INTO feriado (fecha, nombre, recurrencia_anual) VALUES
  ('2025-01-01', 'Año Nuevo', true),
  ('2025-03-24', 'Día de la Memoria', true),
  ('2025-04-02', 'Día del Veterano y Caídos en Malvinas', true),
  ('2025-05-01', 'Día del Trabajador', true),
  ('2025-05-25', 'Día de la Revolución de Mayo', true),
  ('2025-06-20', 'Día de la Bandera', true),
  ('2025-07-09', 'Día de la Independencia', true),
  ('2025-08-17', 'Paso a la Inmortalidad del Gral. San Martín', true),
  ('2025-10-12', 'Día del Respeto a la Diversidad Cultural', true),
  ('2025-11-20', 'Día de la Soberanía Nacional', true),
  ('2025-12-08', 'Día de la Inmaculada Concepción', true),
  ('2025-12-25', 'Navidad', true)
ON CONFLICT (fecha) DO NOTHING;

-- ============================================
-- COMENTARIOS
-- ============================================

COMMENT ON TABLE usuario IS 'Usuarios del sistema (admin, socio, no_socio)';
COMMENT ON TABLE refresh_token IS 'Refresh tokens para rotación y revocación JWT';
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