import { z } from 'zod';

export const workerRoleEnum = z.enum(['usta', 'shogird', 'yordamchi', 'ornatuvchi', 'boshqa']);
export const workerStatusEnum = z.enum(['ACTIVE', 'ARCHIVED']);

export const workerCreateSchema = z.object({
  name: z.string().trim().min(2, { message: "Ishchi ismi kamida 2 ta harfdan iborat bo'lishi kerak" }),
  phone: z.string().trim().regex(/^(\+998)?[-\s]?\(?[0-9]{2}\)?[-\s]?[0-9]{3}[-\s]?[0-9]{2}[-\s]?[0-9]{2}$/, {
    message: "Telefon raqami formati noto'g'ri (masalan: +998 90 123 45 67)"
  }).optional().nullable().or(z.literal('')),
  role: workerRoleEnum,
  dailyRate: z.coerce.number().min(0, { message: "Kunlik stavka 0 dan kam bo'lishi mumkin emas" }),
});

export const workerUpdateSchema = z.object({
  name: z.string().trim().min(2, { message: "Ishchi ismi kamida 2 ta harfdan iborat bo'lishi kerak" }).optional(),
  phone: z.string().trim().optional().nullable().or(z.literal('')),
  role: workerRoleEnum.optional(),
  dailyRate: z.coerce.number().min(0, { message: "Kunlik stavka 0 dan kam bo'lishi mumkin emas" }).optional(),
  status: workerStatusEnum.optional(),
});

export type WorkerCreateSchemaType = z.infer<typeof workerCreateSchema>;
export type WorkerUpdateSchemaType = z.infer<typeof workerUpdateSchema>;
