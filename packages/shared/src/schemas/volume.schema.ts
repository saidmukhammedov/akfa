import { z } from 'zod';

export const volumeCreateSchema = z.object({
  workerId: z.string().min(1, { message: 'Ishchi tanlanishi shart' }),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Sana formati noto'g'ri (YYYY-MM-DD)" }),
  squareMeters: z.coerce.number().positive({ message: "Kvadrat metr (m²) 0 dan katta bo'lishi shart" }),
  rateSnapshot: z.coerce.number().min(0, { message: "1 m² narxi 0 dan kam bo'lishi mumkin emas" }).optional(),
  notes: z.string().max(500, { message: "Izoh 500 belgidan oshmasligi kerak" }).optional().nullable(),
});

export const volumeUpdateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Sana formati noto'g'ri (YYYY-MM-DD)" }).optional(),
  squareMeters: z.coerce.number().positive({ message: "Kvadrat metr (m²) 0 dan katta bo'lishi shart" }).optional(),
  rateSnapshot: z.coerce.number().min(0, { message: "1 m² narxi 0 dan kam bo'lishi mumkin emas" }).optional(),
  notes: z.string().max(500, { message: "Izoh 500 belgidan oshmasligi kerak" }).optional().nullable(),
});

export type VolumeCreateSchemaType = z.infer<typeof volumeCreateSchema>;
export type VolumeUpdateSchemaType = z.infer<typeof volumeUpdateSchema>;
