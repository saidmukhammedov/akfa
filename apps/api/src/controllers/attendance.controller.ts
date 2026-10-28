import { Request, Response } from 'express';
import { prisma } from '../services/prisma.js';
import { AttendanceStatus } from '@akfa/shared';

export async function getAttendanceByDate(req: Request, res: Response) {
  const date = (req.query.date as string) || new Date().toISOString().split('T')[0];

  // Fetch all active workers
  const activeWorkers = await prisma.worker.findMany({
    where: { status: 'ACTIVE' },
    orderBy: { name: 'asc' },
  });

  // Fetch all attendance records for this date
  const attendances = await prisma.attendance.findMany({
    where: { date },
  });

  const attendanceMap = new Map<string, typeof attendances[0]>();
  attendances.forEach((a) => attendanceMap.set(a.workerId, a));

  const records = activeWorkers.map((worker) => {
    const existing = attendanceMap.get(worker.id);

    return {
      workerId: worker.id,
      workerName: worker.name,
      workerRole: worker.role,
      dailyRate: Number(worker.dailyRate),
      status: existing ? (existing.status as AttendanceStatus) : ('ABSENT' as AttendanceStatus),
      rateSnapshot: existing ? Number(existing.rateSnapshot) : Number(worker.dailyRate),
      notes: existing ? existing.notes : null,
      isMarked: Boolean(existing),
      updatedAt: existing ? existing.updatedAt.toISOString() : null,
    };
  });

  const presentCount = records.filter((r) => r.status === 'PRESENT').length;
  const absentCount = records.length - presentCount;

  return res.json({
    success: true,
    data: {
      date,
      totalActiveWorkers: activeWorkers.length,
      presentCount,
      absentCount,
      records,
    },
  });
}

export async function markAttendance(req: Request, res: Response) {
  const { workerId, date, status, notes } = req.body;

  const worker = await prisma.worker.findUnique({ where: { id: workerId } });
  if (!worker) {
    return res.status(404).json({
      success: false,
      error: 'Ishchi topilmadi',
    });
  }

  // Concurrency-safe atomic upsert enforcing one record per worker per date
  const record = await prisma.attendance.upsert({
    where: {
      workerId_date: {
        workerId,
        date,
      },
    },
    update: {
      status,
      notes: notes !== undefined ? notes : undefined,
    },
    create: {
      workerId,
      date,
      status,
      rateSnapshot: worker.dailyRate, // Snapshot worker daily rate at creation
      notes: notes || null,
    },
  });

  return res.json({
    success: true,
    data: {
      ...record,
      rateSnapshot: Number(record.rateSnapshot),
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    },
    message: 'Davomat saqlandi',
  });
}

export async function bulkMarkAttendance(req: Request, res: Response) {
  const { date, records } = req.body;

  if (!records || !Array.isArray(records)) {
    return res.status(400).json({
      success: false,
      error: "Davomat yozuvlari ro'yxati noto'g'ri",
    });
  }

  // Execute all upserts in an atomic database transaction
  await prisma.$transaction(async (tx) => {
    for (const item of records) {
      const worker = await tx.worker.findUnique({ where: { id: item.workerId } });
      if (!worker) continue;

      await tx.attendance.upsert({
        where: {
          workerId_date: {
            workerId: item.workerId,
            date,
          },
        },
        update: {
          status: item.status,
          notes: item.notes !== undefined ? item.notes : undefined,
        },
        create: {
          workerId: item.workerId,
          date,
          status: item.status,
          rateSnapshot: worker.dailyRate,
          notes: item.notes || null,
        },
      });
    }
  });

  return res.json({
    success: true,
    message: 'Barcha ustalar uchun davomat belgilandi',
  });
}
