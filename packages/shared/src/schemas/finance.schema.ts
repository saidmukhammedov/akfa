import { z } from 'zod';

export const paymentMethodEnum = z.enum(['CASH', 'CARD', 'BANK_TRANSFER']);

export const paymentCreateSchema = z.object({
  workerId: z.string().min(1, { message: "Ishchi tanlanishi shart" }),
  amount: z.coerce.number().positive({ message: "To'lov summasi 0 dan katta bo'lishi kerak" }),
  paymentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Sana formati noto'g'ri (YYYY-MM-DD)" }),
  paymentMethod: paymentMethodEnum,
  notes: z.string().max(500, { message: "Izoh 500 belgidan oshmasligi kerak" }).optional().nullable(),
});

export type PaymentCreateSchemaType = z.infer<typeof paymentCreateSchema>;
