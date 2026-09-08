import { Request, Response, NextFunction } from 'express';
import { AuthService, authService } from './auth.service';
import { RegisterInput, LoginInput, RefreshTokenInput } from './auth.validation';

export class AuthController {
  constructor(private readonly service: AuthService = authService) {}

  /**
   * Maneja el registro de nuevos usuarios en la plataforma
   * POST /api/v1/auth/register
   */
  public register = async (
    req: Request<unknown, unknown, RegisterInput>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const response = await this.service.register(req.body);
      res.status(201).json({
        status: 'success',
        data: response,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Maneja el inicio de sesión y emisión de tokens
   * POST /api/v1/auth/login
   */
  public login = async (
    req: Request<unknown, unknown, LoginInput>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const response = await this.service.login(req.body);
      res.status(200).json({
        status: 'success',
        data: response,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Maneja la rotación y renovación de tokens
   * POST /api/v1/auth/refresh
   */
  public refreshToken = async (
    req: Request<unknown, unknown, RefreshTokenInput>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const tokens = await this.service.refreshToken(req.body.refreshToken);
      res.status(200).json({
        status: 'success',
        data: tokens,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Obtiene el perfil completo del usuario actualmente autenticado
   * GET /api/v1/auth/me
   */
  public getMe = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const user = await this.service.getCurrentUser(userId);
      res.status(200).json({
        status: 'success',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  };
}

export const authController = new AuthController();
