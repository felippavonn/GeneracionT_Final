import { z } from 'zod';

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url('DATABASE_URL debe ser una URL válida de PostgreSQL'),

  // JWT
  JWT_SECRET: z.string().min(32, 'JWT_SECRET debe tener al menos 32 caracteres'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET debe tener al menos 32 caracteres'),

  // URLs
  FRONTEND_URL: z.string().url('FRONTEND_URL debe ser una URL válida'),
  BACKEND_URL: z.string().url('BACKEND_URL debe ser una URL válida'),
  PORT: z.coerce.number().int().positive().default(3000),

  // Email
  EMAIL_ADAPTER: z.enum(['ethereal', 'console', 'sendgrid', 'resend']).default('console'),
  SENDGRID_API_KEY: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),

  // Environment
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  TZ: z.string().default('America/Argentina/Buenos_Aires'),

  // Rate Limiting
  RATE_LIMIT_AUTH_MAX: z.coerce.number().int().positive().default(10),
  RATE_LIMIT_AUTH_WINDOW_MS: z.coerce.number().int().positive().default(60000),
  RATE_LIMIT_API_MAX: z.coerce.number().int().positive().default(100),
  RATE_LIMIT_API_WINDOW_MS: z.coerce.number().int().positive().default(60000),
});

export type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | null = null;

export function getEnv(): Env {
  if (cachedEnv) return cachedEnv;

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('❌ Variables de entorno inválidas:');
    console.error(JSON.stringify(result.error.flatten().fieldErrors, null, 2));
    process.exit(1);
  }

  cachedEnv = result.data;
  return cachedEnv;
}

export function validateEnv(): void {
  getEnv(); // Throws if invalid
}