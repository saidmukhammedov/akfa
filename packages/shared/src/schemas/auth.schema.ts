import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().min(3, { message: "Foydalanuvchi nomi kamida 3 belgidan iborat bo'lishi kerak" }),
  password: z.string().min(6, { message: "Parol kamida 6 belgidan iborat bo'lishi kerak" }),
});

export const updateOwnerProfileSchema = z.object({
  fullName: z.string().min(2, { message: "To'liq ism kiritilishi shart" }).optional(),
  workshopName: z.string().min(2, { message: "Tsex nomi kiritilishi shart" }).optional(),
  language: z.enum(['uz', 'ru'], { message: "Noto'g'ri til tanlandi" }).optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6, { message: "Yangi parol kamida 6 belgidan iborat bo'lishi kerak" }).optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateOwnerProfileInput = z.infer<typeof updateOwnerProfileSchema>;
