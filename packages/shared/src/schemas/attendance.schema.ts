import { z } from 'zod';

export const attendanceStatusEnum = z.enum(['PRESENT', 'ABSENT']);

export const markAttendanceSchema = z.object({
  workerId: z.string().min(1, { message: "Ishchi tanlanishi shart" }),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Sana formati noto'g'ri (YYYY-MM-DD)" }),
  status: attendanceStatusEnum,
  notes: z.string().max(255, { message: "Izoh 255 belgidan oshmasligi kerak" }).optional().nullable(),
});

export const bulkAttendanceItemSchema = z.object({
  workerId: z.string().min(1),
  status: attendanceStatusEnum,
  notes: z.string().max(255).optional().nullable(),
});

export const bulkAttendanceSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Sana formati noto'g'ri (YYYY-MM-DD)" }),
  records: z.array(bulkAttendanceItemSchema),
});

export type MarkAttendanceSchemaType = z.infer<typeof markAttendanceSchema>;
export type BulkAttendanceSchemaType = z.infer<typeof bulkAttendanceSchema>;
