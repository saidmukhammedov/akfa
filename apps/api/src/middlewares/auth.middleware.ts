import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../services/auth.service.js';
import { prisma } from '../services/prisma.js';

export interface AuthenticatedRequest extends Request {
  owner?: {
    id: string;
    username: string;
    fullName: string;
    workshopName: string;
    language: string;
  };
}

export async function requireOwnerAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

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
      error: "Noto'g'ri token formati",
    });
  }

  try {
    const payload = verifyAccessToken(token);

    const owner = await prisma.owner.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        username: true,
        fullName: true,
        workshopName: true,
        language: true,
      },
    });

    if (!owner) {
      return res.status(401).json({
        success: false,
        error: "Foydalanuvchi hisobi topilmadi yoki o'chirilgan",
      });
    }

    req.owner = owner;
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Sessiya muddati tugagan (Token expired)',
        code: 'TOKEN_EXPIRED',
      });
    }
    return res.status(401).json({
      success: false,
      error: "Yaroqsiz avtorizatsiya tokeni",
      code: 'INVALID_TOKEN',
    });
  }
}
