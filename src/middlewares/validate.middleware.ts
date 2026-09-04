import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export const validateBody = <T>(schema: ZodSchema<T>) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const issues = error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));

        res.status(422).json({
          status: 'fail',
          error: 'Validation Error',
          details: issues,
        });
        return;
      }
      next(error);
    }
  };
};
