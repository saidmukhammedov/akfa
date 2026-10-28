import { Request, Response } from 'express';
import { db, calculateFinanceSummary } from '../services/store.js';
import { PaymentRecord } from '@akfa/shared';

export async function getFinanceOverview(req: Request, res: Response) {
  const { overview } = calculateFinanceSummary();
  return res.json({
    success: true,
    data: overview,
  });
}

export async function getWorkerFinanceSummaries(req: Request, res: Response) {
  const { summaries } = calculateFinanceSummary();
  return res.json({
    success: true,
    data: summaries,
  });
}

export async function getWorkerFinanceDetails(req: Request, res: Response) {
  const { workerId } = req.params;
  const worker = db.workers.find((w) => w.id === workerId);

  if (!worker) {
    return res.status(404).json({
      success: false,
      error: 'Ishchi topilmadi',
    });
  }

  const attendances = db.attendances.filter(
    (a) => a.workerId === workerId && a.status === 'PRESENT'
  );
  const payments = db.payments.filter((p) => p.workerId === workerId);

  const totalAccruedSalary = attendances.reduce(
    (sum, a) => sum + (a.rateSnapshot || worker.dailyRate),
    0
  );
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const balanceOwed = totalAccruedSalary - totalPaid;

  return res.json({
    success: true,
    data: {
      worker,
      daysWorked: attendances.length,
      totalAccruedSalary,
      totalPaid,
      balanceOwed,
      attendances,
      payments,
    },
  });
}

export async function recordPayment(req: Request, res: Response) {
  const { workerId, amount, paymentDate, paymentMethod, notes } = req.body;

  const worker = db.workers.find((w) => w.id === workerId);
  if (!worker) {
    return res.status(404).json({
      success: false,
      error: 'Ishchi topilmadi',
    });
  }

  const payment: PaymentRecord = {
    id: `pay-${Date.now()}`,
    workerId,
    amount: Number(amount),
    paymentDate,
    paymentMethod,
    notes: notes || null,
    createdAt: new Date().toISOString(),
    workerName: worker.name,
  };

  db.payments.unshift(payment);

  return res.status(201).json({
    success: true,
    data: payment,
    message: "To'lov muvaffaqiyatli kiritildi",
  });
}

export async function getPaymentHistory(req: Request, res: Response) {
  const limit = Number(req.query.limit) || 20;

  const paymentsWithWorker = db.payments.slice(0, limit).map((p) => {
    const worker = db.workers.find((w) => w.id === p.workerId);
    return {
      ...p,
      workerName: worker ? worker.name : 'Noma\'lum ishchi',
    };
  });

  return res.json({
    success: true,
    data: paymentsWithWorker,
  });
}
