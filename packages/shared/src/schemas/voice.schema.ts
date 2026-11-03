import { z } from 'zod';

export const voiceIntentEnum = z.enum([
  'record_attendance',
  'record_volume',
  'get_daily_report',
  'get_monthly_report',
  'get_worker_salary',
  'get_volume_report',
  'correct_entry',
]);

export const processAudioInputSchema = z.object({
  audioBase64: z.string().optional(),
  mimeType: z.string().default('audio/webm'),
  clientTranscript: z.string().optional(),
});

export const parseTextInputSchema = z.object({
  text: z.string().min(1, "Buyruq matni bo'sh bo'lishi mumkin emas"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Sana formati noto'g'ri (YYYY-MM-DD)").optional(),
});

export const confirmVoiceCommandSchema = z.object({
  confirmationToken: z.string().min(1, "Tasdiqlash tokeni bo'sh bo'lishi mumkin emas"),
  decision: z.enum(['CONFIRM', 'REJECT']).default('CONFIRM'),
});

export type ProcessAudioInput = z.infer<typeof processAudioInputSchema>;
export type ParseTextInput = z.infer<typeof parseTextInputSchema>;
export type ConfirmVoiceCommandInput = z.infer<typeof confirmVoiceCommandSchema>;
