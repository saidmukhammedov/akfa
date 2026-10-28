import { Request, Response } from 'express';
import { db } from '../services/store.js';
import { AttendanceRecord, AttendanceStatus } from '@akfa/shared';

export async function getAttendanceByDate(req: Request, res: Response) {
  const date = (req.query.date as string) || new Date().toISOString().split('T')[0];

  // Return active workers with their attendance for this date (or defaults)
  const activeWorkers = db.workers.filter((w) => w.status === 'ACTIVE');

  const records = activeWorkers.map((worker) => {
    const existing = db.attendances.find(
      (a) => a.workerId === worker.id && a.date === date
    );

    return {
      workerId: worker.id,
      workerName: worker.name,
      workerRole: worker.role,
      dailyRate: worker.dailyRate,
      status: existing ? existing.status : ('ABSENT' as AttendanceStatus),
      rateSnapshot: existing ? existing.rateSnapshot : worker.dailyRate,
      notes: existing ? existing.notes : null,
      isMarked: !!existing,
      updatedAt: existing ? existing.updatedAt : null,
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

  const worker = db.workers.find((w) => w.id === workerId);
  if (!worker) {
    return res.status(404).json({
      success: false,
      error: 'Ishchi topilmadi',
    });
  }

  const existingIndex = db.attendances.findIndex(
    (a) => a.workerId === workerId && a.date === date
  );

  let record: AttendanceRecord;

  if (existingIndex >= 0) {
    // Update existing record, preserve existing rateSnapshot unless none was set
    record = {
      ...db.attendances[existingIndex],
      status,
      notes: notes !== undefined ? notes : db.attendances[existingIndex].notes,
      updatedAt: new Date().toISOString(),
    };
    db.attendances[existingIndex] = record;
  } else {
    // Create new record with historical rate snapshot from worker's current rate
    record = {
      id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      workerId,
      date,
      status,
      rateSnapshot: worker.dailyRate,
      notes: notes || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.attendances.push(record);
  }

  return res.json({
    success: true,
    data: record,
    message: "Davomat saqlandi",
  });
}

export async function bulkMarkAttendance(req: Request, res: Response) {
  const { date, records } = req.body;

  for (const item of records) {
    const worker = db.workers.find((w) => w.id === item.workerId);
    if (!worker) continue;

    const existingIndex = db.attendances.findIndex(
      (a) => a.workerId === item.workerId && a.date === date
    );

    if (existingIndex >= 0) {
      db.attendances[existingIndex] = {
        ...db.attendances[existingIndex],
        status: item.status,
        notes: item.notes !== undefined ? item.notes : db.attendances[existingIndex].notes,
        updatedAt: new Date().toISOString(),
      };
    } else {
      db.attendances.push({
        id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        workerId: item.workerId,
        date,
        status: item.status,
        rateSnapshot: worker.dailyRate,
        notes: item.notes || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  }

  return res.json({
    success: true,
    message: "Barcha ustalar uchun davomat belgilandi",
  });
}
