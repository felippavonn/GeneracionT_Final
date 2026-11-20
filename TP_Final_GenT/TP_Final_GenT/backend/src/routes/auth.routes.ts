/**
 * Auth Routes - Rutas de autenticación
 * Reserva Club - Club Atlético Villanorte
 */

import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authMiddleware, cookieParserMiddleware } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validation.middleware';
import { registerBodySchema, loginBodySchema } from '../middleware/validation.middleware';

const router = Router();

// Cookie parser para todas las rutas auth
router.use(cookieParserMiddleware);

// Rutas públicas
router.post('/register', validateBody(registerBodySchema), authController.register.bind(authController));
router.post('/login', validateBody(loginBodySchema), authController.login.bind(authController));
router.post('/refresh', authController.refresh.bind(authController));

// Rutas protegidas (requieren access token válido)
router.post('/logout', authMiddleware, authController.logout.bind(authController));
router.get('/me', authMiddleware, authController.me.bind(authController));

export const authRoutes = router;