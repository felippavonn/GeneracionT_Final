/**
 * Auth Integration Tests - Supertest
 * Reserva Club Backend
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { getDb, truncateAllTables, seedBaseData, closeDb } from './setup';

// ============================================
// Setup
// ============================================

const app = createApp();

beforeEach(async () => {
  await truncateAllTables();
  await seedBaseData();
});

afterEach(async () => {
  // cleanup if needed
});

// ============================================
// Tests
// ============================================

describe('POST /api/auth/register', () => {
  it('debe registrar usuario y devolver 201 con cookies', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'nuevo@test.com', password: 'password123' })
      .expect(201);

    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe('nuevo@test.com');
    expect(res.body.user.rol).toBe('no_socio');
    expect(res.headers['set-cookie']).toBeDefined();

    // Verificar cookies
    const cookies = res.headers['set-cookie'] || [];
    expect(cookies.some(c => c.startsWith('access_token='))).toBe(true);
    expect(cookies.some(c => c.startsWith('refresh_token='))).toBe(true);
  });

  it('debe fallar 409 si email ya existe', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'dup@test.com', password: 'password123' })
      .expect(201);

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'dup@test.com', password: 'password123' })
      .expect(409);

    expect(res.body.error).toBe('EMAIL_ALREADY_EXISTS');
  });

  it('debe fallar 400 si password muy corto', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'short@test.com', password: '123' })
      .expect(400);

    expect(res.body.error).toBe('VALIDATION_ERROR');
  });
});

describe('POST /api/auth/login', () => {
  it('debe loguear usuario existente', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'login@test.com', password: 'password123' })
      .expect(201);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@test.com', password: 'password123' })
      .expect(200);

    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe('login@test.com');
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('debe fallar 401 con password incorrecto', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'fail@test.com', password: 'password123' })
      .expect(201);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'fail@test.com', password: 'wrong' })
      .expect(401);

    expect(res.body.error).toBe('INVALID_CREDENTIALS');
  });
});

describe('POST /api/auth/refresh', () => {
  it('debe rotar tokens con refresh token válido', async () => {
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({ email: 'refresh@test.com', password: 'password123' })
      .expect(201);

    const cookies = registerRes.headers['set-cookie'] || [];
    const refreshCookie = cookies.find(c => c.startsWith('refresh_token='));
    const refreshToken = refreshCookie?.split(';')[0].split('=')[1];

    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', [`refresh_token=${refreshToken}`])
      .expect(200);

    expect(res.body.message).toBe('Token renovado');
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('debe fallar 401 sin refresh token', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .expect(401);

    expect(res.body.error).toBe('TOKEN_INVALID');
  });
});

describe('POST /api/auth/logout', () => {
  it('debe cerrar sesión y limpiar cookies', async () => {
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({ email: 'logout@test.com', password: 'password123' })
      .expect(201);

    const cookies = registerRes.headers['set-cookie'] || [];
    const accessCookie = cookies.find(c => c.startsWith('access_token='));
    const accessToken = accessCookie?.split(';')[0].split('=')[1];

    const res = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', [`access_token=${accessToken}`])
      .expect(200);

    expect(res.body.message).toBe('Sesión cerrada');
    expect(res.headers['set-cookie']).toBeDefined();
    // Cookies deben estar limpiadas (expires en pasado)
    const clearedCookies = res.headers['set-cookie'] || [];
    expect(clearedCookies.some(c => c.includes('Max-Age=0') || c.includes('Expires='))).toBe(true);
  });
});

describe('GET /api/auth/me', () => {
  it('debe devolver perfil con token válido', async () => {
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({ email: 'me@test.com', password: 'password123' })
      .expect(201);

    const cookies = registerRes.headers['set-cookie'] || [];
    const accessCookie = cookies.find(c => c.startsWith('access_token='));
    const accessToken = accessCookie?.split(';')[0].split('=')[1];

    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', [`access_token=${accessToken}`])
      .expect(200);

    expect(res.body.id).toBeDefined();
    expect(res.body.email).toBe('me@test.com');
    expect(res.body.rol).toBe('no_socio');
  });

  it('debe fallar 401 sin token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .expect(401);

    expect(res.body.error).toBe('TOKEN_INVALID');
  });
});

describe('GET /health', () => {
  it('debe responder ok sin auth', async () => {
    const res = await request(app)
      .get('/health')
      .expect(200);

    expect(res.body.status).toBe('ok');
    expect(res.body.timestamp).toBeDefined();
  });
});