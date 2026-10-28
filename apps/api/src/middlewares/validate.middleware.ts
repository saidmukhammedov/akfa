import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from '@akfa/shared';

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const issues = error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        const primaryMessage = issues.map((i) => i.message).filter(Boolean).join('. ') || "Ma'lumotlar to'g'ri to'ldirilmadi";
        return res.status(400).json({
          success: false,
          error: primaryMessage,
          issues,
        });
      }
      next(error);
    }
  };
}
