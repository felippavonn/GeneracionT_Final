/**
 * Cancha Controller - HTTP handlers
 * Reserva Club - Club Atlético Villanorte
 */

import { Request, Response, NextFunction } from 'express';
import { CanchaService } from '../services/cancha.service';
import { ERROR_CODES } from '../utils/errors';

export class CanchaController {
  private service: CanchaService;

  constructor() {
    this.service = new CanchaService();
  }

  async todas(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const canchas = await this.service.canchasActivas();
      res.json({ canchas, total: canchas.length });
    } catch (error) {
      next(error);
    }
  }

  async porId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const cancha = await this.service.canchaPorId(req.params.id);
      if (!cancha) {
        res.status(404).json({ error: ERROR_CODES.CANCHA_NO_ENCONTRADA, message: 'Cancha no encontrada' });
        return;
      }
      res.json({ cancha });
    } catch (error) {
      next(error);
    }
  }

  async disponibilidad(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { fecha } = req.query;
      const fechaStr = (fecha as string) || new Date().toISOString().split('T')[0];
      const slots = await this.service.disponibilidad(req.params.id, fechaStr);
      res.json({ cancha_id: req.params.id, fecha: fechaStr, slots });
    } catch (error) {
      next(error);
    }
  }

  async crear(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const cancha = await this.service.crearCancha(req.body);
      res.status(201).json({ cancha });
    } catch (error) {
      next(error);
    }
  }

  async actualizar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const cancha = await this.service.actualizarCancha(req.params.id, req.body);
      res.json({ cancha });
    } catch (error) {
      next(error);
    }
  }
}

export const canchaController = new CanchaController();