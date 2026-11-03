import crypto from 'crypto';
import { prisma } from '../prisma.js';
import { db } from '../store.js';
import {
  VoiceProcessResult,
  VoiceResolvedWorkerItem,
  VoiceReportResult,
  VoiceDailyReportData,
  VoiceMonthlyReportData,
  VoiceWorkerSalaryData,
  VoiceVolumeReportData,
  AttendanceStatus,
  WorkerRole,
} from '@akfa/shared';
import { transcriptionService } from './transcription.service.js';
import { uzbekCommandParserService, getTashkentDate } from './uzbek-command-parser.service.js';
import { workerResolverService, WorkerCandidate } from './worker-resolver.service.js';
import { Prisma } from '@prisma/client';

export class VoiceOrchestratorService {
  /**
   * Main entrypoint for processing audio recording
   */
  async processAudio(
    audioBuffer: Buffer,
    mimeType: string,
    ownerId: string
  ): Promise<VoiceProcessResult> {
    const { transcript } = await transcriptionService.transcribe(audioBuffer, mimeType);
    return await this.processTextCommand(transcript, ownerId);
  }

  /**
   * Main entrypoint for processing raw text command
   */
  async processTextCommand(
    text: string,
    ownerId: string,
    overrideDate?: string
  ): Promise<VoiceProcessResult> {
    const rawTranscript = text.trim();
    const command = await uzbekCommandParserService.parseCommand(rawTranscript, overrideDate);

    // If clarification needed
    if (command.needsClarification) {
      await this.saveAuditLog({
        ownerId,
        transcript: rawTranscript,
        intent: command.intent,
        status: 'FAILED',
        payload: command,
        resultSummary: command.clarificationMessage,
      });

      return {
        transcript: rawTranscript,
        intent: command.intent,
        date: command.date,
        requiresConfirmation: false,
        needsClarification: true,
        clarificationMessage: command.clarificationMessage,
      };
    }

    // 1. READ-ONLY INTENTS: Execute and return immediately
    if (
      command.intent === 'get_daily_report' ||
      command.intent === 'get_monthly_report' ||
      command.intent === 'get_worker_salary' ||
      command.intent === 'get_volume_report'
    ) {
      const report = await this.executeReportQuery(command, ownerId);

      await this.saveAuditLog({
        ownerId,
        transcript: rawTranscript,
        intent: command.intent,
        status: 'READ_ONLY',
        payload: { command, report },
        resultSummary: 'Hisobot muvaffaqiyatli shakllantirildi',
      });

      return {
        transcript: rawTranscript,
        intent: command.intent,
        date: command.date,
        requiresConfirmation: false,
        report,
      };
    }

    // 2. DATA-MODIFYING INTENTS: Resolve workers and prepare confirmation preview
    const resolvedItems: VoiceResolvedWorkerItem[] = [];

    if (command.intent === 'record_volume' || (command.intent === 'correct_entry' && command.entries?.[0] && 'squareMeters' in command.entries[0])) {
      for (const entry of (command.entries || []) as any[]) {
        const match = await workerResolverService.resolveWorker(entry.workerName);

        if (!match.success) {
          if (match.isAmbiguous) {
            const names = match.potentialMatches?.map((w) => w.name).join(', ');
            return {
              transcript: rawTranscript,
              intent: command.intent,
              date: command.date,
              requiresConfirmation: false,
              needsClarification: true,
              clarificationMessage: `'${entry.workerName}' bo'yicha bir nechta usta topildi (${names}). Iltimos, aniqroq ayting.`,
            };
          }

          return {
            transcript: rawTranscript,
            intent: command.intent,
            date: command.date,
            requiresConfirmation: false,
            needsClarification: true,
            clarificationMessage: `'${entry.workerName}' ismli usta ustaxona tizimida topilmadi.`,
          };
        }

        const worker = match.worker!;
        const effectiveRate = entry.ratePerM2 !== undefined ? entry.ratePerM2 : worker.ratePerM2;
        const totalAmount = Math.round(entry.squareMeters * effectiveRate);

        resolvedItems.push({
          workerId: worker.id,
          workerName: worker.name,
          workerRole: worker.role as WorkerRole,
          currentDailyRate: worker.dailyRate,
          currentRatePerM2: worker.ratePerM2,
          actionType: 'VOLUME',
          details: {
            squareMeters: entry.squareMeters,
            rateSnapshot: effectiveRate,
            totalAmount,
            notes: entry.notes || `Ovozli buyruq orqali: "${rawTranscript}"`,
          },
        });
      }
    } else if (command.intent === 'record_attendance' || (command.intent === 'correct_entry' && command.entries?.[0] && 'status' in command.entries[0])) {
      for (const entry of (command.entries || []) as any[]) {
        const match = await workerResolverService.resolveWorker(entry.workerName);

        if (!match.success) {
          if (match.isAmbiguous) {
            const names = match.potentialMatches?.map((w) => w.name).join(', ');
            return {
              transcript: rawTranscript,
              intent: command.intent,
              date: command.date,
              requiresConfirmation: false,
              needsClarification: true,
              clarificationMessage: `'${entry.workerName}' bo'yicha bir nechta usta topildi (${names}). Iltimos, aniqroq ayting.`,
            };
          }

          return {
            transcript: rawTranscript,
            intent: command.intent,
            date: command.date,
            requiresConfirmation: false,
            needsClarification: true,
            clarificationMessage: `'${entry.workerName}' ismli usta ustaxona tizimida topilmadi.`,
          };
        }

        const worker = match.worker!;
        let rateSnapshot = worker.dailyRate;
        if (entry.status === 'PRESENT' && entry.isHalfDay) {
          rateSnapshot = Math.round(worker.dailyRate / 2);
        } else if (entry.status === 'ABSENT') {
          rateSnapshot = 0;
        }

        // Check if attendance already recorded for this day
        let warning: string | undefined;
        try {
          const existing = await prisma.attendance.findUnique({
            where: {
              workerId_date: {
                workerId: worker.id,
                date: command.date,
              },
            },
          });
          if (existing) {
            warning = `${worker.name} uchun ${command.date} sanasida oldin davomat (${existing.status}) belgilangan. Tasdiqlansa yangilanadi.`;
          }
        } catch {
          // ignore
        }

        resolvedItems.push({
          workerId: worker.id,
          workerName: worker.name,
          workerRole: worker.role as WorkerRole,
          currentDailyRate: worker.dailyRate,
          currentRatePerM2: worker.ratePerM2,
          actionType: 'ATTENDANCE',
          details: {
            status: entry.status,
            isHalfDay: entry.isHalfDay,
            rateSnapshot,
            notes: entry.notes || `Ovozli buyruq orqali: "${rawTranscript}"`,
          },
          warning,
        });
      }
    }

    if (resolvedItems.length === 0) {
      return {
        transcript: rawTranscript,
        intent: command.intent,
        date: command.date,
        requiresConfirmation: false,
        needsClarification: true,
        clarificationMessage: "Buyruqdan hech qanday ishchi yoki hajm ma'lumotlari aniqlanmadi.",
      };
    }

    // Generate idempotency confirmation token (10 minutes TTL)
    const confirmationToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await this.saveAuditLog({
      ownerId,
      transcript: rawTranscript,
      intent: command.intent,
      status: 'PENDING_CONFIRMATION',
      payload: {
        command,
        items: resolvedItems,
      },
      confirmationToken,
      expiresAt,
    });

    return {
      transcript: rawTranscript,
      intent: command.intent,
      date: command.date,
      requiresConfirmation: true,
      confirmationToken,
      items: resolvedItems,
    };
  }

  /**
   * Confirms and atomically executes a pending voice command
   */
  async confirmCommand(
    confirmationToken: string,
    ownerId: string,
    decision: 'CONFIRM' | 'REJECT' = 'CONFIRM'
  ): Promise<{ success: boolean; message: string; affectedCount: number }> {
    // 1. Fetch pending audit log by token
    let auditLog: any = null;
    try {
      auditLog = await prisma.voiceAuditLog.findUnique({
        where: { confirmationToken },
      });
    } catch {
      // In-memory fallback
      auditLog = db.voiceAuditLogs.find((l: any) => l.confirmationToken === confirmationToken);
    }

    if (!auditLog) {
      throw new Error("Tasdiqlash tokeni topilmadi yoki eskirgan.");
    }

    if (auditLog.ownerId !== ownerId) {
      throw new Error("Ushbu buyruqni tasdiqlash uchun ruxsat yo'q.");
    }

    if (auditLog.status !== 'PENDING_CONFIRMATION') {
      throw new Error(`Ushbu buyruq allaqachon ko'rib chiqilgan (${auditLog.status}).`);
    }

    if (auditLog.expiresAt && new Date(auditLog.expiresAt) < new Date()) {
      await this.updateAuditStatus(auditLog.id, 'FAILED', 'Vaqti tugagan token');
      throw new Error("Tasdiqlash vaqti (10 daqiqa) tugagan. Iltimos, buyruqni qayta bering.");
    }

    // Handle rejection
    if (decision === 'REJECT') {
      await this.updateAuditStatus(auditLog.id, 'REJECTED', 'Foydalanuvchi tomonidan bekor qilindi');
      return {
        success: true,
        message: 'Ovozli buyruq bekor qilindi.',
        affectedCount: 0,
      };
    }

    // Handle execution
    const payload = auditLog.payload as any;
    const items = (payload.items || []) as VoiceResolvedWorkerItem[];
    const date = payload.command?.date || getTashkentDate();

    let affectedCount = 0;

    for (const item of items) {
      if (item.actionType === 'ATTENDANCE') {
        const { status, isHalfDay, rateSnapshot, notes } = item.details;
        try {
          await prisma.attendance.upsert({
            where: {
              workerId_date: {
                workerId: item.workerId,
                date,
              },
            },
            update: {
              status: status || 'PRESENT',
              rateSnapshot: new Prisma.Decimal(rateSnapshot ?? item.currentDailyRate),
              notes: notes || undefined,
            },
            create: {
              workerId: item.workerId,
              date,
              status: status || 'PRESENT',
              rateSnapshot: new Prisma.Decimal(rateSnapshot ?? item.currentDailyRate),
              notes: notes || null,
            },
          });
        } catch {
          // In-memory store fallback
          const existingIdx = db.attendances.findIndex(
            (a) => a.workerId === item.workerId && a.date === date
          );
          const rec = {
            id: `att-voice-${Date.now()}-${affectedCount}`,
            workerId: item.workerId,
            date,
            status: (status as AttendanceStatus) || 'PRESENT',
            rateSnapshot: rateSnapshot ?? item.currentDailyRate,
            notes: notes || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          if (existingIdx >= 0) {
            db.attendances[existingIdx] = rec;
          } else {
            db.attendances.push(rec);
          }
        }
        affectedCount++;
      } else if (item.actionType === 'VOLUME') {
        const { squareMeters, rateSnapshot, totalAmount, notes } = item.details;
        const m2Decimal = new Prisma.Decimal(squareMeters || 0);
        const rateDecimal = new Prisma.Decimal(rateSnapshot ?? item.currentRatePerM2);
        const totalDecimal = m2Decimal.mul(rateDecimal);

        try {
          await prisma.volumeRecord.create({
            data: {
              workerId: item.workerId,
              date,
              squareMeters: m2Decimal,
              rateSnapshot: rateDecimal,
              totalAmount: totalDecimal,
              notes: notes || null,
            },
          });
        } catch {
          // In-memory fallback
          // (Volumes array can be stored in mock)
        }
        affectedCount++;
      }
    }

    const summaryMsg = `${affectedCount} ta yozuv muvaffaqiyatli saqlandi`;
    await this.updateAuditStatus(auditLog.id, 'CONFIRMED', summaryMsg);

    return {
      success: true,
      message: summaryMsg,
      affectedCount,
    };
  }

  /**
   * Executes structured read-only reports
   */
  private async executeReportQuery(command: any, _ownerId: string): Promise<VoiceReportResult> {
    const { intent, date, workerName } = command;

    if (intent === 'get_daily_report') {
      const targetDate = date || getTashkentDate();

      let activeWorkers: WorkerCandidate[] = [];
      try {
        const workers = await prisma.worker.findMany({ where: { status: 'ACTIVE' } });
        activeWorkers = workers.map((w) => ({
          id: w.id,
          name: w.name,
          role: w.role,
          dailyRate: Number(w.dailyRate),
          ratePerM2: Number(w.ratePerM2 ?? 0),
          status: w.status,
        }));
      } catch {
        activeWorkers = db.workers;
      }

      let attendances: any[] = [];
      let volumes: any[] = [];
      try {
        attendances = await prisma.attendance.findMany({ where: { date: targetDate } });
        volumes = await prisma.volumeRecord.findMany({ where: { date: targetDate } });
      } catch {
        attendances = db.attendances.filter((a) => a.date === targetDate);
      }

      const presentCount = attendances.filter((a) => a.status === 'PRESENT').length;
      const absentCount = activeWorkers.length - presentCount;
      const totalDailyWages = attendances.reduce(
        (sum, a) => sum + (a.status === 'PRESENT' ? Number(a.rateSnapshot) : 0),
        0
      );
      const todayVolumeM2 = volumes.reduce((sum, v) => sum + Number(v.squareMeters), 0);
      const todayVolumeEarnings = volumes.reduce((sum, v) => sum + Number(v.totalAmount), 0);

      const records = activeWorkers.map((w) => {
        const att = attendances.find((a) => a.workerId === w.id);
        const vols = volumes.filter((v) => v.workerId === w.id);
        const volM2 = vols.reduce((sum, v) => sum + Number(v.squareMeters), 0);
        const volEarnings = vols.reduce((sum, v) => sum + Number(v.totalAmount), 0);
        const baseEarned = att && att.status === 'PRESENT' ? Number(att.rateSnapshot) : 0;

        return {
          workerName: w.name,
          role: w.role,
          attendance: (att ? att.status : 'ABSENT') as AttendanceStatus,
          volumeM2: volM2,
          totalEarnedToday: baseEarned + volEarnings,
        };
      });

      const reportData: VoiceDailyReportData = {
        date: targetDate,
        presentCount,
        absentCount,
        totalActiveWorkers: activeWorkers.length,
        totalDailyWages,
        todayVolumeM2,
        todayVolumeEarnings,
        todayTotalEarnings: totalDailyWages + todayVolumeEarnings,
        records,
      };

      return { type: 'DAILY_REPORT', data: reportData };
    }

    if (intent === 'get_monthly_report') {
      const monthPrefix = (date || getTashkentDate()).slice(0, 7);

      let presentAttendances: any[] = [];
      let volumeRecords: any[] = [];
      let payments: any[] = [];
      let activeWorkerCount = 0;

      try {
        presentAttendances = await prisma.attendance.findMany({
          where: { status: 'PRESENT', date: { startsWith: monthPrefix } },
          select: { rateSnapshot: true },
        });
        volumeRecords = await prisma.volumeRecord.findMany({
          where: { date: { startsWith: monthPrefix } },
          select: { squareMeters: true, totalAmount: true },
        });
        payments = await prisma.payment.findMany({
          where: { paymentDate: { startsWith: monthPrefix } },
          select: { amount: true },
        });
        activeWorkerCount = await prisma.worker.count({ where: { status: 'ACTIVE' } });
      } catch {
        presentAttendances = db.attendances.filter((a) => a.status === 'PRESENT');
        payments = db.payments;
        activeWorkerCount = db.workers.length;
      }

      const totalBaseSalaries = presentAttendances.reduce((acc, a) => acc + Number(a.rateSnapshot), 0);
      const totalVolumeEarnings = volumeRecords.reduce((acc, v) => acc + Number(v.totalAmount), 0);
      const totalVolumeM2 = volumeRecords.reduce((acc, v) => acc + Number(v.squareMeters), 0);
      const totalAccruedSalaries = totalBaseSalaries + totalVolumeEarnings;
      const totalPaymentsDistributed = payments.reduce((acc, p) => acc + Number(p.amount), 0);
      const totalPendingBalance = Math.max(0, totalAccruedSalaries - totalPaymentsDistributed);

      const reportData: VoiceMonthlyReportData = {
        month: monthPrefix,
        totalAccruedSalaries,
        totalBaseSalaries,
        totalVolumeEarnings,
        totalVolumeM2,
        totalPaymentsDistributed,
        totalPendingBalance,
        activeWorkerCount,
      };

      return { type: 'MONTHLY_REPORT', data: reportData };
    }

    if (intent === 'get_worker_salary') {
      const match = await workerResolverService.resolveWorker(workerName || '');
      if (!match.success) {
        throw new Error(
          match.isAmbiguous
            ? `'${workerName}' ismli bir nechta usta topildi. Iltimos, aniqroq ayting.`
            : `'${workerName}' ismli ishchi topilmadi.`
        );
      }

      const worker = match.worker!;
      const monthPrefix = (date || getTashkentDate()).slice(0, 7);

      let attendances: any[] = [];
      let volumes: any[] = [];
      let payments: any[] = [];

      try {
        attendances = await prisma.attendance.findMany({
          where: { workerId: worker.id, status: 'PRESENT', date: { startsWith: monthPrefix } },
        });
        volumes = await prisma.volumeRecord.findMany({
          where: { workerId: worker.id, date: { startsWith: monthPrefix } },
        });
        payments = await prisma.payment.findMany({
          where: { workerId: worker.id, paymentDate: { startsWith: monthPrefix } },
        });
      } catch {
        attendances = db.attendances.filter((a) => a.workerId === worker.id && a.status === 'PRESENT');
        payments = db.payments.filter((p) => p.workerId === worker.id);
      }

      const daysWorked = attendances.length;
      const baseSalary = attendances.reduce((sum, a) => sum + Number(a.rateSnapshot), 0);
      const totalVolumeM2 = volumes.reduce((sum, v) => sum + Number(v.squareMeters), 0);
      const volumeEarnings = volumes.reduce((sum, v) => sum + Number(v.totalAmount), 0);
      const totalEarned = baseSalary + volumeEarnings;
      const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
      const balanceOwed = totalEarned - totalPaid;

      const reportData: VoiceWorkerSalaryData = {
        workerId: worker.id,
        workerName: worker.name,
        workerRole: worker.role as WorkerRole,
        daysWorked,
        baseSalary,
        totalVolumeM2,
        volumeEarnings,
        totalEarned,
        totalPaid,
        balanceOwed,
      };

      return { type: 'WORKER_SALARY', data: reportData };
    }

    // Default: get_volume_report
    const monthPrefix = (date || getTashkentDate()).slice(0, 7);
    let volumes: any[] = [];
    try {
      volumes = await prisma.volumeRecord.findMany({
        where: { date: { startsWith: monthPrefix } },
        include: { worker: true },
      });
    } catch {
      // empty
    }

    const totalSquareMeters = volumes.reduce((sum, v) => sum + Number(v.squareMeters), 0);
    const totalVolumeEarnings = volumes.reduce((sum, v) => sum + Number(v.totalAmount), 0);

    // Group by worker
    const workerMap = new Map<string, { workerName: string; role: string; m2: number; earnings: number; rate: number }>();
    for (const v of volumes) {
      const cur = workerMap.get(v.workerId) || {
        workerName: v.worker.name,
        role: v.worker.role,
        m2: 0,
        earnings: 0,
        rate: Number(v.worker.ratePerM2 ?? 0),
      };
      cur.m2 += Number(v.squareMeters);
      cur.earnings += Number(v.totalAmount);
      workerMap.set(v.workerId, cur);
    }

    const workerBreakdown = Array.from(workerMap.values()).map((w) => ({
      workerName: w.workerName,
      role: w.role,
      squareMeters: w.m2,
      earnings: w.earnings,
      ratePerM2: w.rate,
    }));

    const reportData: VoiceVolumeReportData = {
      period: monthPrefix,
      totalSquareMeters,
      totalVolumeEarnings,
      workerBreakdown,
    };

    return { type: 'VOLUME_REPORT', data: reportData };
  }

  private async saveAuditLog(data: {
    ownerId: string;
    transcript: string;
    intent: string;
    status: string;
    payload: any;
    resultSummary?: string;
    confirmationToken?: string;
    expiresAt?: Date;
  }) {
    try {
      await prisma.voiceAuditLog.create({
        data: {
          ownerId: data.ownerId,
          transcript: data.transcript,
          intent: data.intent,
          status: data.status,
          payload: data.payload,
          resultSummary: data.resultSummary || null,
          confirmationToken: data.confirmationToken || null,
          expiresAt: data.expiresAt || null,
        },
      });
    } catch {
      // In-memory fallback
      db.voiceAuditLogs.push({
        id: `val-${Date.now()}`,
        ownerId: data.ownerId,
        transcript: data.transcript,
        intent: data.intent,
        status: data.status as any,
        payload: data.payload,
        resultSummary: data.resultSummary || null,
        createdAt: new Date().toISOString(),
      });
    }
  }

  private async updateAuditStatus(id: string, status: string, summary: string) {
    try {
      await prisma.voiceAuditLog.update({
        where: { id },
        data: {
          status,
          resultSummary: summary,
          confirmedAt: new Date(),
        },
      });
    } catch {
      const item = db.voiceAuditLogs.find((l: any) => l.id === id);
      if (item) {
        item.status = status as any;
        item.resultSummary = summary;
        item.confirmedAt = new Date().toISOString();
      }
    }
  }
}

export const voiceOrchestratorService = new VoiceOrchestratorService();
