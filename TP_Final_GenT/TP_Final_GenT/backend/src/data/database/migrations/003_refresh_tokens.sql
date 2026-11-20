-- ============================================
-- Migración 003: Tabla refresh_token para rotación JWT
-- Reserva Club - Club Atlético Villanorte
-- ============================================

CREATE TABLE refresh_token (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expira_en TIMESTAMPTZ NOT NULL,
  revocado_en TIMESTAMPTZ,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_refresh_token_usuario ON refresh_token (usuario_id);
CREATE INDEX idx_refresh_token_hash ON refresh_token (token_hash);
CREATE INDEX idx_refresh_token_expira ON refresh_token (expira_en) WHERE revocado_en IS NULL;

COMMENT ON TABLE refresh_token IS 'Refresh tokens para rotación y revocación JWT';
COMMENT ON COLUMN refresh_token.token_hash IS 'SHA256 del token (no bcrypt, solo lookup)';
COMMENT ON COLUMN refresh_token.revocado_en IS 'Null = activo, timestamp = revocado/expirado';