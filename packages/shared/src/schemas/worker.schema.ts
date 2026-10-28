import { z } from 'zod';

export const workerRoleEnum = z.enum(['usta', 'shogird', 'yordamchi', 'ornatuvchi', 'boshqa']);
export const workerStatusEnum = z.enum(['ACTIVE', 'ARCHIVED']);

export const phoneValidator = z
  .string()
  .trim()
  .refine(
    (val) => {
      if (!val || val.length === 0) return true;
      const hasOnlyAllowedChars = /^[\d\s+\-().]+$/.test(val);
      const digitsOnly = val.replace(/\D/g, '');
      return hasOnlyAllowedChars && digitsOnly.length >= 7 && digitsOnly.length <= 15;
    },
    {
      message: "Telefon raqami noto'g'ri (kamida 7 ta raqam bo'lishi kerak, masalan: +998 90 123 45 67)",
    }
  )
  .optional()
  .nullable()
  .or(z.literal(''));

export const workerCreateSchema = z.object({
  name: z.string().trim().min(2, { message: "Ishchi ismi kamida 2 ta harfdan iborat bo'lishi kerak" }),
  phone: phoneValidator,
  role: workerRoleEnum,
  dailyRate: z.coerce.number().min(0, { message: "Kunlik stavka 0 dan kam bo'lishi mumkin emas" }),
});

export const workerUpdateSchema = z.object({
  name: z.string().trim().min(2, { message: "Ishchi ismi kamida 2 ta harfdan iborat bo'lishi kerak" }).optional(),
  phone: phoneValidator,
  role: workerRoleEnum.optional(),
  dailyRate: z.coerce.number().min(0, { message: "Kunlik stavka 0 dan kam bo'lishi mumkin emas" }).optional(),
  status: workerStatusEnum.optional(),
});

export type WorkerCreateSchemaType = z.infer<typeof workerCreateSchema>;
export type WorkerUpdateSchemaType = z.infer<typeof workerUpdateSchema>;
