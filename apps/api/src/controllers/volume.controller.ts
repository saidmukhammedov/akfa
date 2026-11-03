import { Request, Response } from 'express';
import { prisma } from '../services/prisma.js';
import { Prisma } from '@prisma/client';
import { WorkerRole } from '@akfa/shared';

export async function listVolumes(req: Request, res: Response) {
  const { date, workerId, month } = req.query;

  const whereClause: Prisma.VolumeRecordWhereInput = {};

  if (typeof date === 'string' && date.trim()) {
    whereClause.date = date.trim();
  } else if (typeof month === 'string' && month.trim()) {
    whereClause.date = { startsWith: month.trim() };
  }

  if (typeof workerId === 'string' && workerId.trim()) {
    whereClause.workerId = workerId.trim();
  }

  const records = await prisma.volumeRecord.findMany({
    where: whereClause,
    include: {
      worker: {
        select: {
          id: true,
          name: true,
          role: true,
          ratePerM2: true,
        },
      },
    },
    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
  });

  const serialized = records.map((r) => ({
    id: r.id,
    workerId: r.workerId,
    workerName: r.worker.name,
    workerRole: r.worker.role as WorkerRole,
    date: r.date,
    squareMeters: Number(r.squareMeters),
    rateSnapshot: Number(r.rateSnapshot),
    totalAmount: Number(r.totalAmount),
    notes: r.notes,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));

  return res.json({
    success: true,
    data: serialized,
  });
}

export async function getVolume(req: Request, res: Response) {
  const { id } = req.params;

  const record = await prisma.volumeRecord.findUnique({
    where: { id },
    include: {
      worker: {
        select: {
          id: true,
          name: true,
          role: true,
          ratePerM2: true,
        },
      },
    },
  });

  if (!record) {
    return res.status(404).json({
      success: false,
      error: 'Hajm yozuvi topilmadi',
    });
  }

  return res.json({
    success: true,
    data: {
      id: record.id,
      workerId: record.workerId,
      workerName: record.worker.name,
      workerRole: record.worker.role as WorkerRole,
      date: record.date,
      squareMeters: Number(record.squareMeters),
      rateSnapshot: Number(record.rateSnapshot),
      totalAmount: Number(record.totalAmount),
      notes: record.notes,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    },
  });
}

export async function createVolume(req: Request, res: Response) {
  const { workerId, date, squareMeters, rateSnapshot, notes } = req.body;

  const worker = await prisma.worker.findUnique({
    where: { id: workerId },
  });

  if (!worker) {
    return res.status(404).json({
      success: false,
      error: 'Ishchi topilmadi',
    });
  }

  const m2 = new Prisma.Decimal(squareMeters);
  if (m2.lessThanOrEqualTo(0)) {
    return res.status(400).json({
      success: false,
      error: "Kvadrat metr (m²) 0 dan katta bo'lishi shart",
    });
  }

  // Determine rate per m² snapshot: either explicitly provided or taken from worker's current profile ratePerM2
  const effectiveRate =
    rateSnapshot !== undefined && rateSnapshot !== null
      ? new Prisma.Decimal(rateSnapshot)
      : worker.ratePerM2;

  if (effectiveRate.lessThan(0)) {
    return res.status(400).json({
      success: false,
      error: "1 m² stavkasi 0 dan kam bo'lishi mumkin emas",
    });
  }

  // Backend authoritative calculation: never trust client-provided total
  const totalAmount = m2.mul(effectiveRate);

  const created = await prisma.volumeRecord.create({
    data: {
      workerId,
      date,
      squareMeters: m2,
      rateSnapshot: effectiveRate,
      totalAmount,
      notes: notes?.trim() || null,
    },
    include: {
      worker: {
        select: {
          name: true,
          role: true,
        },
      },
    },
  });

  return res.status(201).json({
    success: true,
    data: {
      id: created.id,
      workerId: created.workerId,
      workerName: created.worker.name,
      workerRole: created.worker.role as WorkerRole,
      date: created.date,
      squareMeters: Number(created.squareMeters),
      rateSnapshot: Number(created.rateSnapshot),
      totalAmount: Number(created.totalAmount),
      notes: created.notes,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    },
    message: 'Hajm muvaffaqiyatli saqlandi',
  });
}

export async function updateVolume(req: Request, res: Response) {
  const { id } = req.params;
  const { date, squareMeters, rateSnapshot, notes } = req.body;

  const existing = await prisma.volumeRecord.findUnique({
    where: { id },
    include: { worker: true },
  });

  if (!existing) {
    return res.status(404).json({
      success: false,
      error: 'Hajm yozuvi topilmadi',
    });
  }

  const updateData: Prisma.VolumeRecordUpdateInput = {};

  if (date !== undefined) {
    updateData.date = date;
  }

  if (notes !== undefined) {
    updateData.notes = notes?.trim() || null;
  }

  // Calculate new m² and rate
  const m2 =
    squareMeters !== undefined
      ? new Prisma.Decimal(squareMeters)
      : existing.squareMeters;

  if (m2.lessThanOrEqualTo(0)) {
    return res.status(400).json({
      success: false,
      error: "Kvadrat metr (m²) 0 dan katta bo'lishi shart",
    });
  }

  const rate =
    rateSnapshot !== undefined
      ? new Prisma.Decimal(rateSnapshot)
      : existing.rateSnapshot;

  if (rate.lessThan(0)) {
    return res.status(400).json({
      success: false,
      error: "1 m² stavkasi 0 dan kam bo'lishi mumkin emas",
    });
  }

  updateData.squareMeters = m2;
  updateData.rateSnapshot = rate;
  updateData.totalAmount = m2.mul(rate);

  const updated = await prisma.volumeRecord.update({
    where: { id },
    data: updateData,
    include: {
      worker: {
        select: {
          name: true,
          role: true,
        },
      },
    },
  });

  return res.json({
    success: true,
    data: {
      id: updated.id,
      workerId: updated.workerId,
      workerName: updated.worker.name,
      workerRole: updated.worker.role as WorkerRole,
      date: updated.date,
      squareMeters: Number(updated.squareMeters),
      rateSnapshot: Number(updated.rateSnapshot),
      totalAmount: Number(updated.totalAmount),
      notes: updated.notes,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    },
    message: 'Hajm muvaffaqiyatli yangilandi',
  });
}

export async function deleteVolume(req: Request, res: Response) {
  const { id } = req.params;

  const existing = await prisma.volumeRecord.findUnique({ where: { id } });
  if (!existing) {
    return res.status(404).json({
      success: false,
      error: 'Hajm yozuvi topilmadi',
    });
  }

  await prisma.volumeRecord.delete({ where: { id } });

  return res.json({
    success: true,
    message: "Hajm yozuvi muvaffaqiyatli o'chirildi",
  });
}

export async function getVolumeOverview(req: Request, res: Response) {
  const today = (req.query.date as string) || new Date().toISOString().slice(0, 10);
  const currentMonth = today.slice(0, 7); // YYYY-MM

  const [todayRecords, monthlyRecords, allTimeRecords, workers] = await Promise.all([
    prisma.volumeRecord.findMany({
      where: { date: today },
      select: { squareMeters: true, totalAmount: true },
    }),
    prisma.volumeRecord.findMany({
      where: { date: { startsWith: currentMonth } },
      select: { squareMeters: true, totalAmount: true },
    }),
    prisma.volumeRecord.findMany({
      select: { squareMeters: true, totalAmount: true },
    }),
    prisma.worker.findMany({
      include: {
        volumes: {
          where: { date: { startsWith: currentMonth } },
          select: { squareMeters: true, totalAmount: true },
        },
      },
      orderBy: { name: 'asc' },
    }),
  ]);

  const todaySquareMeters = todayRecords.reduce((sum, r) => sum.add(r.squareMeters), new Prisma.Decimal(0));
  const todayEarnings = todayRecords.reduce((sum, r) => sum.add(r.totalAmount), new Prisma.Decimal(0));

  const monthlySquareMeters = monthlyRecords.reduce((sum, r) => sum.add(r.squareMeters), new Prisma.Decimal(0));
  const monthlyEarnings = monthlyRecords.reduce((sum, r) => sum.add(r.totalAmount), new Prisma.Decimal(0));

  const totalSquareMetersAllTime = allTimeRecords.reduce((sum, r) => sum.add(r.squareMeters), new Prisma.Decimal(0));
  const totalEarningsAllTime = allTimeRecords.reduce((sum, r) => sum.add(r.totalAmount), new Prisma.Decimal(0));

  const workerSummaries = workers.map((w) => {
    const totalSquareMeters = w.volumes.reduce((sum, r) => sum.add(r.squareMeters), new Prisma.Decimal(0));
    const totalVolumeEarnings = w.volumes.reduce((sum, r) => sum.add(r.totalAmount), new Prisma.Decimal(0));

    return {
      workerId: w.id,
      workerName: w.name,
      workerRole: w.role as WorkerRole,
      currentRatePerM2: Number(w.ratePerM2),
      totalSquareMeters: totalSquareMeters.toNumber(),
      totalVolumeEarnings: totalVolumeEarnings.toNumber(),
      entriesCount: w.volumes.length,
    };
  });

  return res.json({
    success: true,
    data: {
      overview: {
        todaySquareMeters: todaySquareMeters.toNumber(),
        todayEarnings: todayEarnings.toNumber(),
        monthlySquareMeters: monthlySquareMeters.toNumber(),
        monthlyEarnings: monthlyEarnings.toNumber(),
        totalSquareMetersAllTime: totalSquareMetersAllTime.toNumber(),
        totalEarningsAllTime: totalEarningsAllTime.toNumber(),
      },
      workerSummaries,
    },
  });
}
