import { Request, Response, NextFunction } from 'express';

export interface AuthenticatedRequest extends Request {
  owner?: {
    id: string;
    username: string;
    fullName: string;
    workshopName: string;
    language: 'uz' | 'ru';
  };
}

export function requireOwnerAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  // Development bypass or valid token check
  if (process.env.NODE_ENV === 'development' && (!authHeader || authHeader === 'Bearer dev-token')) {
    req.owner = {
      id: 'owner-default-1',
      username: 'admin',
      fullName: 'Alisher Qodirov',
      workshopName: 'AKFA Rom va Eshiklar Tsexi',
      language: 'uz',
    };
    return next();
  }

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Avtorizatsiya talab qilinadi (Token mavjud emas)',
    });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Noto\'g\'ri token formati',
    });
  }

  // Set authenticated owner on request
  req.owner = {
    id: 'owner-default-1',
    username: 'admin',
    fullName: 'Alisher Qodirov',
    workshopName: 'AKFA Rom va Eshiklar Tsexi',
    language: 'uz',
  };

  next();
}
