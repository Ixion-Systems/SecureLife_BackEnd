import { Router } from 'express';
import { dashboardController } from './dashboard.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { validateBody } from '../../middlewares/validate.middleware';
import { requestAssistanceSchema } from './dashboard.schema';

const router = Router();

// Todas las rutas del dashboard requieren autenticación JWT válida
router.use(authenticate);

router.get('/summary', dashboardController.getSummary);
router.get('/policies', dashboardController.getPolicies);
router.get('/activity', dashboardController.getActivity);
router.post('/assistance', validateBody(requestAssistanceSchema), dashboardController.requestAssistance);

export const dashboardRouter = router;
