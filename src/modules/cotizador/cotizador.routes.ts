import { Router } from 'express';
import { cotizadorController } from './cotizador.controller';

const router = Router();

// Rutas Públicas (utilizadas por el Simulador Demo de la Landing)
router.get('/marcas', cotizadorController.getMarcas);
router.get('/modelos', cotizadorController.getModelos);
router.post('/calcular', cotizadorController.calcular);

// Rutas de Mantenimiento / Sincronización
router.post('/sync', cotizadorController.sync);
router.get('/sync-status', cotizadorController.getSyncStatus);

export { router as cotizadorRouter };
