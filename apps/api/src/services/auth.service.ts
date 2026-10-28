import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from './prisma.js';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_development_secret_change_in_production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const REFRESH_DAYS = Number(process.env.REFRESH_TOKEN_EXPIRES_DAYS) || 7;

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateAccessToken(payload: { id: string; username: string }): string {
  return jwt.sign(
    {
      sub: payload.id,
      username: payload.username,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN as any }
  );
}

export function verifyAccessToken(token: string): { sub: string; username: string } {
  return jwt.verify(token, JWT_SECRET) as { sub: string; username: string };
}

export async function createRefreshToken(ownerId: string): Promise<string> {
  const rawToken = crypto.randomBytes(40).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_DAYS);

  await prisma.refreshToken.create({
    data: {
      ownerId,
      tokenHash,
      expiresAt,
    },
  });

  return rawToken;
}

export async function rotateRefreshToken(rawToken: string) {
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  const record = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: { owner: true },
  });

  if (!record) {
    throw new Error('Invalid refresh token');
  }

  // Token reuse detection: if a revoked token is used, revoke all tokens for this owner
  if (record.revokedAt) {
    await prisma.refreshToken.updateMany({
      where: { ownerId: record.ownerId },
      data: { revokedAt: new Date() },
    });
    throw new Error('Refresh token reuse detected. All sessions revoked.');
  }

  // Check expiration
  if (record.expiresAt < new Date()) {
    throw new Error('Refresh token has expired');
  }

  // Revoke current token and generate new pair (Token Rotation)
  await prisma.refreshToken.update({
    where: { id: record.id },
    data: { revokedAt: new Date() },
  });

  const newAccessToken = generateAccessToken({
    id: record.owner.id,
    username: record.owner.username,
  });

  const newRefreshToken = await createRefreshToken(record.owner.id);

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    owner: {
      id: record.owner.id,
      username: record.owner.username,
      fullName: record.owner.fullName,
      workshopName: record.owner.workshopName,
      language: record.owner.language,
    },
  };
}

export async function revokeRefreshToken(rawToken: string): Promise<boolean> {
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const record = await prisma.refreshToken.findUnique({ where: { tokenHash } });
  if (!record) return false;

  await prisma.refreshToken.update({
    where: { id: record.id },
    data: { revokedAt: new Date() },
  });
  return true;
}

export async function countOwners(): Promise<number> {
  return prisma.owner.count();
}

export async function setupInitialOwner(data: {
  username: string;
  password: string;
  fullName: string;
  workshopName?: string;
  language?: string;
}) {
  const existingCount = await countOwners();
  if (existingCount > 0) {
    const error: any = new Error("Ustaxona egasi allaqachon mavjud. Yangi ro'yxatdan o'tish taqiqlangan.");
    error.statusCode = 403;
    throw error;
  }

  const passwordHash = await hashPassword(data.password);
  const owner = await prisma.owner.create({
    data: {
      username: data.username,
      passwordHash,
      fullName: data.fullName,
      workshopName: data.workshopName || 'AKFA Ustaxonasi',
      language: data.language || 'uz',
    },
  });

  const accessToken = generateAccessToken({ id: owner.id, username: owner.username });
  const refreshToken = await createRefreshToken(owner.id);

  return {
    owner: {
      id: owner.id,
      username: owner.username,
      fullName: owner.fullName,
      workshopName: owner.workshopName,
      language: owner.language,
    },
    accessToken,
    refreshToken,
  };
}

export async function seedInitialOwnerIfMissing() {
  const count = await countOwners();
  if (count === 0 && process.env.INITIAL_OWNER_USERNAME && process.env.INITIAL_OWNER_PASSWORD) {
    const username = process.env.INITIAL_OWNER_USERNAME;
    const password = process.env.INITIAL_OWNER_PASSWORD;
    const fullName = process.env.INITIAL_OWNER_FULLNAME || 'Alisher Qodirov';
    const workshopName = process.env.INITIAL_WORKSHOP_NAME || 'AKFA Rom va Eshiklar Tsexi';
    const language = process.env.INITIAL_DEFAULT_LANGUAGE || 'uz';

    const passwordHash = await hashPassword(password);
    await prisma.owner.create({
      data: {
        username,
        passwordHash,
        fullName,
        workshopName,
        language,
      },
    });
    console.log(`[AKFA Auth] Initial owner '${username}' created securely.`);
  }
}
