import { Request, Response } from 'express';
import { prisma } from '../services/prisma.js';
import { Prisma } from '@prisma/client';
import { WorkerRole, WorkerStatus, PaymentMethod } from '@akfa/shared';

export async function getFinanceOverview(_req: Request, res: Response) {
  // Aggregate present attendances
  const presentAttendances = await prisma.attendance.findMany({
    where: { status: 'PRESENT' },
    select: { rateSnapshot: true },
  });

  const totalAccrued = presentAttendances.reduce(
    (acc, att) => acc.add(att.rateSnapshot),
    new Prisma.Decimal(0)
  );

  // Aggregate payments
  const payments = await prisma.payment.findMany({
    select: { amount: true },
  });

  const totalPaid = payments.reduce(
    (acc, pay) => acc.add(pay.amount),
    new Prisma.Decimal(0)
  );

  const activeWorkerCount = await prisma.worker.count({
    where: { status: 'ACTIVE' },
  });

  // Calculate pending debt (positive balance only)
  // To get exact total pending balance across all workers:
  const workers = await prisma.worker.findMany({
    include: {
      attendances: { where: { status: 'PRESENT' }, select: { rateSnapshot: true } },
      payments: { select: { amount: true } },
    },
  });

  let totalPendingBalance = new Prisma.Decimal(0);
  for (const w of workers) {
    const earned = w.attendances.reduce((acc, a) => acc.add(a.rateSnapshot), new Prisma.Decimal(0));
    const paid = w.payments.reduce((acc, p) => acc.add(p.amount), new Prisma.Decimal(0));
    const balance = earned.sub(paid);
    if (balance.greaterThan(0)) {
      totalPendingBalance = totalPendingBalance.add(balance);
    }
  }

  return res.json({
    success: true,
    data: {
      totalAccruedSalaries: totalAccrued.toNumber(),
      totalPaymentsDistributed: totalPaid.toNumber(),
      totalPendingBalance: totalPendingBalance.toNumber(),
      activeWorkerCount,
    },
  });
}

export async function getWorkerFinanceSummaries(_req: Request, res: Response) {
  // Retrieve all workers including archived ones to preserve financial history
  const workers = await prisma.worker.findMany({
    include: {
      attendances: {
        where: { status: 'PRESENT' },
        select: { rateSnapshot: true },
      },
      payments: {
        select: { amount: true },
      },
    },
    orderBy: { name: 'asc' },
  });

  const summaries = workers.map((w) => {
    const daysWorked = w.attendances.length;
    // Salary strictly calculated from attendance rate snapshots
    const totalAccruedSalary = w.attendances.reduce(
      (sum, a) => sum.add(a.rateSnapshot),
      new Prisma.Decimal(0)
    );
    const totalPaid = w.payments.reduce(
      (sum, p) => sum.add(p.amount),
      new Prisma.Decimal(0)
    );
    const balanceOwed = totalAccruedSalary.sub(totalPaid);

    return {
      workerId: w.id,
      name: w.name,
      role: w.role as WorkerRole,
      status: w.status as WorkerStatus,
      currentDailyRate: Number(w.dailyRate),
      daysWorked,
      totalAccruedSalary: totalAccruedSalary.toNumber(),
      totalPaid: totalPaid.toNumber(),
      balanceOwed: balanceOwed.toNumber(),
    };
  });

  return res.json({
    success: true,
    data: summaries,
  });
}

export async function getWorkerFinanceDetails(req: Request, res: Response) {
  const { workerId } = req.params;

  const worker = await prisma.worker.findUnique({
    where: { id: workerId },
    include: {
      attendances: {
        orderBy: { date: 'desc' },
      },
      payments: {
        orderBy: { paymentDate: 'desc' },
      },
    },
  });

  if (!worker) {
    return res.status(404).json({
      success: false,
      error: 'Ishchi topilmadi',
    });
  }

  const presentAttendances = worker.attendances.filter((a) => a.status === 'PRESENT');
  const totalAccruedSalary = presentAttendances.reduce(
    (sum, a) => sum.add(a.rateSnapshot),
    new Prisma.Decimal(0)
  );
  const totalPaid = worker.payments.reduce(
    (sum, p) => sum.add(p.amount),
    new Prisma.Decimal(0)
  );
  const balanceOwed = totalAccruedSalary.sub(totalPaid);

  return res.json({
    success: true,
    data: {
      worker: {
        ...worker,
        dailyRate: Number(worker.dailyRate),
        createdAt: worker.createdAt.toISOString(),
        updatedAt: worker.updatedAt.toISOString(),
        archivedAt: worker.archivedAt?.toISOString() || null,
      },
      daysWorked: presentAttendances.length,
      totalAccruedSalary: totalAccruedSalary.toNumber(),
      totalPaid: totalPaid.toNumber(),
      balanceOwed: balanceOwed.toNumber(),
      attendances: worker.attendances.map((a) => ({
        ...a,
        rateSnapshot: Number(a.rateSnapshot),
        createdAt: a.createdAt.toISOString(),
        updatedAt: a.updatedAt.toISOString(),
      })),
      payments: worker.payments.map((p) => ({
        ...p,
        amount: Number(p.amount),
        createdAt: p.createdAt.toISOString(),
      })),
    },
  });
}

export async function recordPayment(req: Request, res: Response) {
  const { workerId, amount, paymentDate, paymentMethod, notes } = req.body;

  const worker = await prisma.worker.findUnique({ where: { id: workerId } });
  if (!worker) {
    return res.status(404).json({
      success: false,
      error: 'Ishchi topilmadi',
    });
  }

  const decimalAmount = new Prisma.Decimal(amount);
  if (decimalAmount.lessThanOrEqualTo(0)) {
    return res.status(400).json({
      success: false,
      error: "To'lov summasi 0 dan katta bo'lishi kerak",
    });
  }

  // Atomically create payment in transaction
  const payment = await prisma.$transaction(async (tx) => {
    return tx.payment.create({
      data: {
        workerId,
        amount: decimalAmount,
        paymentDate,
        paymentMethod: (paymentMethod as PaymentMethod) || 'CASH',
        notes: notes?.trim() || null,
      },
      include: {
        worker: { select: { name: true } },
      },
    });
  });

  return res.status(201).json({
    success: true,
    data: {
      id: payment.id,
      workerId: payment.workerId,
      workerName: payment.worker.name,
      amount: Number(payment.amount),
      paymentDate: payment.paymentDate,
      paymentMethod: payment.paymentMethod,
      notes: payment.notes,
      createdAt: payment.createdAt.toISOString(),
    },
    message: "To'lov muvaffaqiyatli kiritildi",
  });
}

export async function getPaymentHistory(req: Request, res: Response) {
  const limit = Math.min(Number(req.query.limit) || 50, 100);

  const payments = await prisma.payment.findMany({
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: {
      worker: {
        select: { name: true, role: true },
      },
    },
  });

  const serialized = payments.map((p) => ({
    id: p.id,
    workerId: p.workerId,
    workerName: p.worker.name,
    amount: Number(p.amount),
    paymentDate: p.paymentDate,
    paymentMethod: p.paymentMethod,
    notes: p.notes,
    createdAt: p.createdAt.toISOString(),
  }));

  return res.json({
    success: true,
    data: serialized,
  });
}
