import { Request, Response } from 'express';
import { prisma } from '../services/prisma.js';
import { Prisma } from '@prisma/client';

export async function listWorkers(req: Request, res: Response) {
  const status = req.query.status as string | undefined;

  const whereClause: Prisma.WorkerWhereInput = {};
  if (status && (status === 'ACTIVE' || status === 'ARCHIVED')) {
    whereClause.status = status;
  }

  const workers = await prisma.worker.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' },
  });

  const serialized = workers.map((w) => ({
    ...w,
    dailyRate: Number(w.dailyRate),
    ratePerM2: Number(w.ratePerM2 || 0),
    createdAt: w.createdAt.toISOString(),
    updatedAt: w.updatedAt.toISOString(),
    archivedAt: w.archivedAt ? w.archivedAt.toISOString() : null,
  }));

  return res.json({
    success: true,
    data: serialized,
  });
}

export async function getWorker(req: Request, res: Response) {
  const { id } = req.params;
  const worker = await prisma.worker.findUnique({
    where: { id },
  });

  if (!worker) {
    return res.status(404).json({
      success: false,
      error: 'Ishchi topilmadi',
    });
  }

  return res.json({
    success: true,
    data: {
      ...worker,
      dailyRate: Number(worker.dailyRate),
      ratePerM2: Number(worker.ratePerM2 || 0),
      createdAt: worker.createdAt.toISOString(),
      updatedAt: worker.updatedAt.toISOString(),
      archivedAt: worker.archivedAt ? worker.archivedAt.toISOString() : null,
    },
  });
}

export async function createWorker(req: Request, res: Response) {
  const { name, phone, role, dailyRate, ratePerM2 } = req.body;

  const worker = await prisma.worker.create({
    data: {
      name: name.trim(),
      phone: phone?.trim() || null,
      role: role || 'usta',
      dailyRate: new Prisma.Decimal(dailyRate),
      ratePerM2: new Prisma.Decimal(ratePerM2 || 0),
      status: 'ACTIVE',
    },
  });

  return res.status(201).json({
    success: true,
    data: {
      ...worker,
      dailyRate: Number(worker.dailyRate),
      ratePerM2: Number(worker.ratePerM2 || 0),
      createdAt: worker.createdAt.toISOString(),
      updatedAt: worker.updatedAt.toISOString(),
      archivedAt: null,
    },
    message: "Yangi ishchi muvaffaqiyatli qo'shildi",
  });
}

export async function updateWorker(req: Request, res: Response) {
  const { id } = req.params;
  const { name, phone, role, dailyRate, ratePerM2, status } = req.body;

  const existing = await prisma.worker.findUnique({ where: { id } });
  if (!existing) {
    return res.status(404).json({
      success: false,
      error: 'Ishchi topilmadi',
    });
  }

  const updateData: Prisma.WorkerUpdateInput = {};
  if (name !== undefined) updateData.name = name.trim();
  if (phone !== undefined) updateData.phone = phone?.trim() || null;
  if (role !== undefined) updateData.role = role;
  if (dailyRate !== undefined) updateData.dailyRate = new Prisma.Decimal(dailyRate);
  if (ratePerM2 !== undefined) updateData.ratePerM2 = new Prisma.Decimal(ratePerM2);
  if (status !== undefined) {
    updateData.status = status;
    if (status === 'ARCHIVED' && existing.status !== 'ARCHIVED') {
      updateData.archivedAt = new Date();
    } else if (status === 'ACTIVE') {
      updateData.archivedAt = null;
    }
  }

  const updated = await prisma.worker.update({
    where: { id },
    data: updateData,
  });

  return res.json({
    success: true,
    data: {
      ...updated,
      dailyRate: Number(updated.dailyRate),
      ratePerM2: Number(updated.ratePerM2 || 0),
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
      archivedAt: updated.archivedAt ? updated.archivedAt.toISOString() : null,
    },
    message: "Ishchi ma'lumotlari yangilandi",
  });
}

export async function archiveWorker(req: Request, res: Response) {
  const { id } = req.params;

  const existing = await prisma.worker.findUnique({ where: { id } });
  if (!existing) {
    return res.status(404).json({
      success: false,
      error: 'Ishchi topilmadi',
    });
  }

  const updated = await prisma.worker.update({
    where: { id },
    data: {
      status: 'ARCHIVED',
      archivedAt: new Date(),
    },
  });

  return res.json({
    success: true,
    data: {
      ...updated,
      dailyRate: Number(updated.dailyRate),
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
      archivedAt: updated.archivedAt?.toISOString() || null,
    },
    message: 'Ishchi arxivlandi. Barcha oʻtgan davomat va moliya tarixi toʻliq saqlab qolindi.',
  });
}

export async function unarchiveWorker(req: Request, res: Response) {
  const { id } = req.params;

  const existing = await prisma.worker.findUnique({ where: { id } });
  if (!existing) {
    return res.status(404).json({
      success: false,
      error: 'Ishchi topilmadi',
    });
  }

  const updated = await prisma.worker.update({
    where: { id },
    data: {
      status: 'ACTIVE',
      archivedAt: null,
    },
  });

  return res.json({
    success: true,
    data: {
      ...updated,
      dailyRate: Number(updated.dailyRate),
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
      archivedAt: null,
    },
    message: 'Ishchi qayta faollashtirildi',
  });
}

export async function deleteWorker(req: Request, res: Response) {
  const { id } = req.params;

  const existing = await prisma.worker.findUnique({ where: { id } });
  if (!existing) {
    return res.status(404).json({
      success: false,
      error: 'Ishchi topilmadi',
    });
  }

  await prisma.$transaction(async (tx) => {
    await tx.volumeRecord.deleteMany({ where: { workerId: id } });
    await tx.attendance.deleteMany({ where: { workerId: id } });
    await tx.payment.deleteMany({ where: { workerId: id } });
    await tx.worker.delete({ where: { id } });
  });

  return res.json({
    success: true,
    message: "Ishchi va uning barcha davomat/to'lov/hajm yozuvlari o'chirildi",
  });
}

export async function purgeAllWorkersAndHistory(_req: Request, res: Response) {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const volCount = await tx.volumeRecord.deleteMany({});
      const attCount = await tx.attendance.deleteMany({});
      const payCount = await tx.payment.deleteMany({});
      const workerCount = await tx.worker.deleteMany({});
      return {
        volumes: volCount.count,
        attendances: attCount.count,
        payments: payCount.count,
        workers: workerCount.count,
      };
    });

    return res.json({
      success: true,
      message: "Barcha ishchilar va tarix (davomat, hajm, to'lovlar) to'liq o'chirildi. Faqat egasi hisobi qoldirildi.",
      data: result,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: "Ma'lumotlarni o'chirishda xatolik yuz berdi: " + err.message,
    });
  }
}
