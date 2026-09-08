import { Router } from 'express';
import { authController } from './auth.controller';
import { registerSchema, loginSchema, refreshTokenSchema } from './auth.validation';
import { validateBody } from '../../middlewares/validate.middleware';
import { authenticate } from '../../middlewares/auth.middleware';

export const authRouter = Router();

// Rutas públicas
authRouter.post('/register', validateBody(registerSchema), authController.register);
authRouter.post('/login', validateBody(loginSchema), authController.login);
authRouter.post('/refresh', validateBody(refreshTokenSchema), authController.refreshToken);

// Rutas protegidas por autenticación Bearer JWT
authRouter.get('/me', authenticate, authController.getMe);
