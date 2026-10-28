import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware.js';
import { db } from '../services/store.js';

export async function login(req: AuthenticatedRequest, res: Response) {
  const { username, password } = req.body;

  // Single-owner authentication verification
  if (username === 'admin' && (password === 'akfa_secure_password_2026' || password === 'admin123')) {
    return res.json({
      success: true,
      token: 'dev-token',
      user: db.owner,
    });
  }

  return res.status(401).json({
    success: false,
    error: 'Foydalanuvchi nomi yoki parol xato',
  });
}

export async function getProfile(req: AuthenticatedRequest, res: Response) {
  return res.json({
    success: true,
    data: db.owner,
  });
}

export async function updateProfile(req: AuthenticatedRequest, res: Response) {
  const { fullName, workshopName, language } = req.body;

  if (fullName) db.owner.fullName = fullName;
  if (workshopName) db.owner.workshopName = workshopName;
  if (language) db.owner.language = language;
  db.owner.updatedAt = new Date().toISOString();

  return res.json({
    success: true,
    data: db.owner,
    message: "Profil muvaffaqiyatli yangilandi",
  });
}
