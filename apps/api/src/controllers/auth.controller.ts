import { Response, Request } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware.js';
import { prisma } from '../services/prisma.js';
import {
  comparePassword,
  generateAccessToken,
  createRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
  hashPassword,
  setupInitialOwner,
  countOwners,
} from '../services/auth.service.js';

export async function login(req: Request, res: Response) {
  const { username, password } = req.body;

  const owner = await prisma.owner.findUnique({
    where: { username },
  });

  // Defend against timing attacks with constant-time dummy compare
  const passwordHash = owner ? owner.passwordHash : '$2a$12$e8vK1mU0d.Lw2j4K7N/JcOUVp4G2iU4z5j4lG8bW3V8l6Y3x2e3b6';
  const isValid = await comparePassword(password, passwordHash);

  if (!owner || !isValid) {
    return res.status(401).json({
      success: false,
      error: "Foydalanuvchi nomi yoki parol noto'g'ri",
    });
  }

  const accessToken = generateAccessToken({ id: owner.id, username: owner.username });
  const refreshToken = await createRefreshToken(owner.id);

  return res.json({
    success: true,
    data: {
      accessToken,
      refreshToken,
      user: {
        id: owner.id,
        username: owner.username,
        fullName: owner.fullName,
        workshopName: owner.workshopName,
        language: owner.language,
      },
    },
  });
}

export async function refresh(req: Request, res: Response) {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({
      success: false,
      error: 'Refresh token taqdim etilmagan',
    });
  }

  try {
    const result = await rotateRefreshToken(refreshToken);
    return res.json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    return res.status(401).json({
      success: false,
      error: err.message || "Yaroqsiz yoki muddati o'tgan refresh token",
    });
  }
}

export async function logout(req: Request, res: Response) {
  const { refreshToken } = req.body;
  if (refreshToken) {
    await revokeRefreshToken(refreshToken);
  }
  return res.json({
    success: true,
    message: 'Muvaffaqiyatli chiqildi',
  });
}

export async function getSession(req: Request, res: Response) {
  const owner = await prisma.owner.findFirst({
    select: {
      id: true,
      username: true,
      fullName: true,
      workshopName: true,
      language: true,
    },
  });

  if (!owner) {
    return res.status(404).json({
      success: false,
      error: 'Ustaxona egasi hisobi topilmadi',
    });
  }

  const accessToken = generateAccessToken(owner);
  const refreshToken = await createRefreshToken(owner.id);

  return res.json({
    success: true,
    data: {
      owner,
      accessToken,
      refreshToken,
    },
  });
}

export async function getProfile(req: AuthenticatedRequest, res: Response) {
  return res.json({
    success: true,
    data: req.owner,
  });
}

export async function updateProfile(req: AuthenticatedRequest, res: Response) {
  const ownerId = req.owner!.id;
  const { username, fullName, workshopName, language, currentPassword, newPassword } = req.body;

  const owner = await prisma.owner.findUnique({ where: { id: ownerId } });
  if (!owner) {
    return res.status(404).json({ success: false, error: 'Egasi topilmadi' });
  }

  const updateData: any = {};
  if (username !== undefined && username !== owner.username) {
    const existing = await prisma.owner.findUnique({ where: { username } });
    if (existing && existing.id !== ownerId) {
      return res.status(400).json({
        success: false,
        error: "Bu foydalanuvchi nomi allaqachon band",
      });
    }
    updateData.username = username;
  }

  if (fullName !== undefined) updateData.fullName = fullName;
  if (workshopName !== undefined) updateData.workshopName = workshopName;
  if (language !== undefined) updateData.language = language;

  if (newPassword) {
    if (!currentPassword) {
      return res.status(400).json({
        success: false,
        error: "Yangi parol o'rnatish uchun joriy parolni kiritish shart",
      });
    }

    const matches = await comparePassword(currentPassword, owner.passwordHash);
    if (!matches) {
      return res.status(400).json({
        success: false,
        error: "Joriy parol noto'g'ri kiritildi",
      });
    }

    updateData.passwordHash = await hashPassword(newPassword);
  }

  const updated = await prisma.owner.update({
    where: { id: ownerId },
    data: updateData,
    select: {
      id: true,
      username: true,
      fullName: true,
      workshopName: true,
      language: true,
      updatedAt: true,
    },
  });

  return res.json({
    success: true,
    data: updated,
    message: 'Profil muvaffaqiyatli yangilandi',
  });
}

export async function setup(req: Request, res: Response) {
  const { username, password, fullName, workshopName, language } = req.body;

  if (!username || !password || !fullName) {
    return res.status(400).json({
      success: false,
      error: "Barcha majburiy maydonlar to'ldirilishi shart",
    });
  }

  try {
    const result = await setupInitialOwner({
      username,
      password,
      fullName,
      workshopName,
      language,
    });
    return res.status(201).json({
      success: true,
      data: result,
      message: "Ustaxona egasi hisobi muvaffaqiyatli yaratildi",
    });
  } catch (err: any) {
    return res.status(err.statusCode || 400).json({
      success: false,
      error: err.message,
    });
  }
}

export async function checkSetupStatus(_req: Request, res: Response) {
  const count = await countOwners();
  return res.json({
    success: true,
    isInitialized: count > 0,
  });
}
