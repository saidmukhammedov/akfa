import { Request, Response } from 'express';
import { voiceOrchestratorService } from '../services/voice/voice-orchestrator.service.js';
import { prisma } from '../services/prisma.js';
import { db } from '../services/store.js';

export async function processAudio(req: Request, res: Response) {
  const { audioBase64, mimeType } = req.body;
  const ownerId = (req as any).owner?.id || (req as any).user?.id || 'owner-default-1';

  if (!audioBase64 || typeof audioBase64 !== 'string') {
    return res.status(400).json({
      success: false,
      error: "Ovozli audio ma'lumotlari kiritilmadi",
    });
  }

  try {
    const audioBuffer = Buffer.from(audioBase64, 'base64');
    const result = await voiceOrchestratorService.processAudio(
      audioBuffer,
      mimeType || 'audio/webm',
      ownerId
    );

    return res.json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message || "Ovozli buyruqni qayta ishlashda xatolik yuz berdi",
    });
  }
}

export async function parseTextCommand(req: Request, res: Response) {
  const { text, date } = req.body;
  const ownerId = (req as any).owner?.id || (req as any).user?.id || 'owner-default-1';

  if (!text || typeof text !== 'string') {
    return res.status(400).json({
      success: false,
      error: "Buyruq matni bo'sh bo'lishi mumkin emas",
    });
  }

  try {
    const result = await voiceOrchestratorService.processTextCommand(text, ownerId, date);
    return res.json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message || "Buyruqni tahlil qilishda xatolik yuz berdi",
    });
  }
}

export async function confirmVoiceCommand(req: Request, res: Response) {
  const { confirmationToken, decision } = req.body;
  const ownerId = (req as any).owner?.id || (req as any).user?.id || 'owner-default-1';

  if (!confirmationToken || typeof confirmationToken !== 'string') {
    return res.status(400).json({
      success: false,
      error: "Tasdiqlash tokeni bo'sh bo'lishi mumkin emas",
    });
  }

  try {
    const result = await voiceOrchestratorService.confirmCommand(
      confirmationToken,
      ownerId,
      decision || 'CONFIRM'
    );

    return res.json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      error: err.message || "Buyruqni tasdiqlashda xatolik yuz berdi",
    });
  }
}

export async function getVoiceHistory(req: Request, res: Response) {
  const ownerId = (req as any).owner?.id || (req as any).user?.id || 'owner-default-1';

  try {
    const logs = await prisma.voiceAuditLog.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'desc' },
      take: 25,
    });

    return res.json({
      success: true,
      data: logs.map((l) => ({
        id: l.id,
        ownerId: l.ownerId,
        transcript: l.transcript,
        intent: l.intent,
        status: l.status,
        resultSummary: l.resultSummary,
        createdAt: l.createdAt.toISOString(),
        confirmedAt: l.confirmedAt ? l.confirmedAt.toISOString() : null,
      })),
    });
  } catch {
    // In-memory fallback
    const logs = db.voiceAuditLogs.slice(0, 25);
    return res.json({
      success: true,
      data: logs,
    });
  }
}
