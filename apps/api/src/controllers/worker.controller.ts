import { Request, Response } from 'express';
import { db } from '../services/store.js';
import { Worker } from '@akfa/shared';

export async function listWorkers(req: Request, res: Response) {
  const status = req.query.status as string; // 'ACTIVE' | 'ARCHIVED' | undefined
  let workers = db.workers;

  if (status) {
    workers = workers.filter((w) => w.status === status);
  }

  return res.json({
    success: true,
    data: workers,
  });
}

export async function getWorker(req: Request, res: Response) {
  const { id } = req.params;
  const worker = db.workers.find((w) => w.id === id);

  if (!worker) {
    return res.status(404).json({
      success: false,
      error: 'Ishchi topilmadi',
    });
  }

  return res.json({
    success: true,
    data: worker,
  });
}

export async function createWorker(req: Request, res: Response) {
  const { name, phone, role, dailyRate } = req.body;

  const newWorker: Worker = {
    id: `worker-${Date.now()}`,
    name,
    phone: phone || null,
    role,
    dailyRate: Number(dailyRate),
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.workers.push(newWorker);

  return res.status(201).json({
    success: true,
    data: newWorker,
    message: "Yangi ishchi muvaffaqiyatli qo'shildi",
  });
}

export async function updateWorker(req: Request, res: Response) {
  const { id } = req.params;
  const index = db.workers.findIndex((w) => w.id === id);

  if (index === -1) {
    return res.status(404).json({
      success: false,
      error: 'Ishchi topilmadi',
    });
  }

  const existing = db.workers[index];
  const { name, phone, role, dailyRate } = req.body;

  const updated: Worker = {
    ...existing,
    ...(name !== undefined && { name }),
    ...(phone !== undefined && { phone }),
    ...(role !== undefined && { role }),
    ...(dailyRate !== undefined && { dailyRate: Number(dailyRate) }),
    updatedAt: new Date().toISOString(),
  };

  db.workers[index] = updated;

  return res.json({
    success: true,
    data: updated,
    message: "Ishchi ma'lumotlari yangilandi",
  });
}

export async function archiveWorker(req: Request, res: Response) {
  const { id } = req.params;
  const worker = db.workers.find((w) => w.id === id);

  if (!worker) {
    return res.status(404).json({
      success: false,
      error: 'Ishchi topilmadi',
    });
  }

  // Soft archive to retain all historical financial and attendance records
  worker.status = 'ARCHIVED';
  worker.archivedAt = new Date().toISOString();
  worker.updatedAt = new Date().toISOString();

  return res.json({
    success: true,
    data: worker,
    message: "Ishchi arxivlandi. Moliyaviy va davomat tarixi saqlab qolindi.",
  });
}

export async function unarchiveWorker(req: Request, res: Response) {
  const { id } = req.params;
  const worker = db.workers.find((w) => w.id === id);

  if (!worker) {
    return res.status(404).json({
      success: false,
      error: 'Ishchi topilmadi',
    });
  }

  worker.status = 'ACTIVE';
  worker.archivedAt = null;
  worker.updatedAt = new Date().toISOString();

  return res.json({
    success: true,
    data: worker,
    message: "Ishchi qayta faollashtirildi",
  });
}
