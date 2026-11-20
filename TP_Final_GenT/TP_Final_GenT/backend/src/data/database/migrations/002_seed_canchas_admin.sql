-- ============================================
-- Migración 002: Datos Iniciales (Seeds)
-- Reserva Club - Club Atlético Villanorte
-- ============================================

-- ============================================
-- CANCHAS (6 canchas: 2 futbol5, 3 padel, 1 tenis)
-- Precios base en centavos (ej: 12000 = $120.00)
-- ============================================

INSERT INTO cancha (id, nombre, tipo, duracion_minutos, precio_base, activa) VALUES
  -- Fútbol 5 (2 canchas, 60 min)
  (gen_random_uuid(), 'Cancha Fútbol 5 - 1', 'futbol5', 60, 12000, true),
  (gen_random_uuid(), 'Cancha Fútbol 5 - 2', 'futbol5', 60, 12000, true),

  -- Pádel (3 canchas, 90 min)
  (gen_random_uuid(), 'Cancha Pádel - 1', 'padel', 90, 15000, true),
  (gen_random_uuid(), 'Cancha Pádel - 2', 'padel', 90, 15000, true),
  (gen_random_uuid(), 'Cancha Pádel - 3', 'padel', 90, 15000, true),

  -- Tenis (1 cancha, 90 min)
  (gen_random_uuid(), 'Cancha Tenis - 1', 'tenis', 90, 18000, true)
ON CONFLICT DO NOTHING;

-- ============================================
-- USUARIO ADMIN POR DEFECTO
-- Email: admin@club.com
-- Password: Admin123! (bcrypt cost 12)
-- ============================================

INSERT INTO usuario (id, email, password_hash, rol, cuota_vigente_hasta, deuda_pendiente) VALUES
  (
    gen_random_uuid(),
    'admin@club.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.PZvO.S', -- Admin123!
    'admin',
    NULL,
    0
  )
ON CONFLICT (email) DO NOTHING;

-- ============================================
-- FRANJAS PICO POR DEFECTO
-- Lunes a Viernes 18:00-22:00
-- ============================================

INSERT INTO franja_pico (dia_semana, hora_inicio, hora_fin, activa) VALUES
  (1, '18:00', '22:00', true),  -- Lunes
  (2, '18:00', '22:00', true),  -- Martes
  (3, '18:00', '22:00', true),  -- Miércoles
  (4, '18:00', '22:00', true),  -- Jueves
  (5, '18:00', '22:00', true)   -- Viernes
ON CONFLICT DO NOTHING;

-- ============================================
-- FERIADOS 2025 ARGENTINA (ejemplos, admin puede agregar más)
-- ============================================

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
-- VERIFICACIÓN
-- ============================================

-- SELECT 'Canchas:' as tabla, count(*) FROM cancha WHERE activa = true
-- UNION ALL SELECT 'Usuarios:', count(*) FROM usuario
-- UNION ALL SELECT 'Franjas pico:', count(*) FROM franja_pico WHERE activa = true
-- UNION ALL SELECT 'Feriados:', count(*) FROM feriado;