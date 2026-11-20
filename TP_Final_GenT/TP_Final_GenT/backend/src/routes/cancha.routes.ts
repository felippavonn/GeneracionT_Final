/**
 * Cancha Routes - Rutas de canchas
 * Reserva Club - Club Atlético Villanorte
 */

import { Router } from 'express';
import { canchaController } from '../controllers/cancha.controller';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Rutas públicas (con auth opcional para precios)
router.get('/', optionalAuthMiddleware, canchaController.todas.bind(canchaController));
router.get('/:id', optionalAuthMiddleware, canchaController.porId.bind(canchaController));
router.get('/:id/disponibilidad', canchaController.disponibilidad.bind(canchaController));

export const canchaRoutes = router;