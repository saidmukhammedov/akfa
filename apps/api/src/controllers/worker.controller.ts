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
      createdAt: worker.createdAt.toISOString(),
      updatedAt: worker.updatedAt.toISOString(),
      archivedAt: worker.archivedAt ? worker.archivedAt.toISOString() : null,
    },
  });
}

export async function createWorker(req: Request, res: Response) {
  const { name, phone, role, dailyRate } = req.body;

  const worker = await prisma.worker.create({
    data: {
      name: name.trim(),
      phone: phone?.trim() || null,
      role: role || 'usta',
      dailyRate: new Prisma.Decimal(dailyRate),
      status: 'ACTIVE',
    },
  });

  return res.status(201).json({
    success: true,
    data: {
      ...worker,
      dailyRate: Number(worker.dailyRate),
      createdAt: worker.createdAt.toISOString(),
      updatedAt: worker.updatedAt.toISOString(),
      archivedAt: null,
    },
    message: "Yangi ishchi muvaffaqiyatli qo'shildi",
  });
}

export async function updateWorker(req: Request, res: Response) {
  const { id } = req.params;
  const { name, phone, role, dailyRate, status } = req.body;

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
