import { Worker, AttendanceRecord, PaymentRecord, OwnerProfile, WorkerFinanceSummary, WorkshopFinanceOverview } from '@akfa/shared';

/**
 * Isolated development & in-memory relational store.
 * Allows instant local verification and testing of the API and Web applications
 * without needing an external Neon PostgreSQL database provisioned first.
 * The production schema is fully documented and configured in prisma/schema.prisma.
 */

export interface DatabaseStore {
  owner: OwnerProfile;
  workers: Worker[];
  attendances: AttendanceRecord[];
  payments: PaymentRecord[];
}

export const db: DatabaseStore = {
  owner: {
    id: 'owner-default-1',
    username: 'admin',
    fullName: 'Alisher Qodirov',
    workshopName: 'AKFA Rom va Eshiklar Tsexi',
    language: 'uz',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  workers: [
    {
      id: 'worker-1',
      name: 'Jamshid Karimov',
      phone: '+998 90 123 45 67',
      role: 'usta',
      dailyRate: 250000,
      status: 'ACTIVE',
      createdAt: '2026-10-01T08:00:00Z',
      updatedAt: '2026-10-01T08:00:00Z',
    },
    {
      id: 'worker-2',
      name: 'Sherzod Toirov',
      phone: '+998 93 987 65 43',
      role: 'usta',
      dailyRate: 220000,
      status: 'ACTIVE',
      createdAt: '2026-10-01T08:00:00Z',
      updatedAt: '2026-10-01T08:00:00Z',
    },
    {
      id: 'worker-3',
      name: 'Bobur Usmonov',
      phone: '+998 97 456 78 90',
      role: 'ornatuvchi',
      dailyRate: 200000,
      status: 'ACTIVE',
      createdAt: '2026-10-05T08:00:00Z',
      updatedAt: '2026-10-05T08:00:00Z',
    },
    {
      id: 'worker-4',
      name: 'Jasur Saidov',
      phone: '+998 91 234 56 78',
      role: 'shogird',
      dailyRate: 140000,
      status: 'ACTIVE',
      createdAt: '2026-10-10T08:00:00Z',
      updatedAt: '2026-10-10T08:00:00Z',
    },
    {
      id: 'worker-5',
      name: 'Farrux Rahimov',
      phone: '+998 99 345 67 89',
      role: 'yordamchi',
      dailyRate: 120000,
      status: 'ACTIVE',
      createdAt: '2026-10-12T08:00:00Z',
      updatedAt: '2026-10-12T08:00:00Z',
    },
  ],
  attendances: [
    {
      id: 'att-1',
      workerId: 'worker-1',
      date: '2026-10-28',
      status: 'PRESENT',
      rateSnapshot: 250000,
      notes: null,
      createdAt: '2026-10-28T08:00:00Z',
      updatedAt: '2026-10-28T08:00:00Z',
    },
    {
      id: 'att-2',
      workerId: 'worker-2',
      date: '2026-10-28',
      status: 'PRESENT',
      rateSnapshot: 220000,
      notes: null,
      createdAt: '2026-10-28T08:00:00Z',
      updatedAt: '2026-10-28T08:00:00Z',
    },
    {
      id: 'att-3',
      workerId: 'worker-3',
      date: '2026-10-28',
      status: 'PRESENT',
      rateSnapshot: 200000,
      notes: null,
      createdAt: '2026-10-28T08:00:00Z',
      updatedAt: '2026-10-28T08:00:00Z',
    },
    {
      id: 'att-4',
      workerId: 'worker-4',
      date: '2026-10-28',
      status: 'PRESENT',
      rateSnapshot: 140000,
      notes: null,
      createdAt: '2026-10-28T08:00:00Z',
      updatedAt: '2026-10-28T08:00:00Z',
    },
    {
      id: 'att-5',
      workerId: 'worker-5',
      date: '2026-10-28',
      status: 'ABSENT',
      rateSnapshot: 120000,
      notes: 'Betobligi sababli kelmadi',
      createdAt: '2026-10-28T08:00:00Z',
      updatedAt: '2026-10-28T08:00:00Z',
    },
  ],
  payments: [
    {
      id: 'pay-1',
      workerId: 'worker-1',
      amount: 1500000,
      paymentDate: '2026-10-20',
      paymentMethod: 'CASH',
      notes: 'Haftalik avans berildi',
      createdAt: '2026-10-20T17:00:00Z',
    },
    {
      id: 'pay-2',
      workerId: 'worker-2',
      amount: 1000000,
      paymentDate: '2026-10-20',
      paymentMethod: 'CARD',
      notes: 'Plastik kartaga tashlab berildi',
      createdAt: '2026-10-20T17:15:00Z',
    },
  ],
};

export function calculateFinanceSummary(): {
  summaries: WorkerFinanceSummary[];
  overview: WorkshopFinanceOverview;
} {
  const summaries: WorkerFinanceSummary[] = db.workers.map((worker) => {
    // Attendance where PRESENT
    const presentRecords = db.attendances.filter(
      (a) => a.workerId === worker.id && a.status === 'PRESENT'
    );
    const daysWorked = presentRecords.length;
    // Salary calculated from daily attendance and historical rate snapshots!
    const totalAccruedSalary = presentRecords.reduce(
      (sum, a) => sum + (a.rateSnapshot || worker.dailyRate),
      0
    );

    // Payments recorded independently
    const workerPayments = db.payments.filter((p) => p.workerId === worker.id);
    const totalPaid = workerPayments.reduce((sum, p) => sum + p.amount, 0);

    const balanceOwed = totalAccruedSalary - totalPaid;

    return {
      workerId: worker.id,
      name: worker.name,
      role: worker.role,
      status: worker.status,
      currentDailyRate: worker.dailyRate,
      daysWorked,
      totalAccruedSalary,
      totalPaid,
      balanceOwed,
    };
  });

  const totalAccruedSalaries = summaries.reduce((s, w) => s + w.totalAccruedSalary, 0);
  const totalPaymentsDistributed = summaries.reduce((s, w) => s + w.totalPaid, 0);
  const totalPendingBalance = summaries.reduce((s, w) => s + Math.max(0, w.balanceOwed), 0);
  const activeWorkerCount = db.workers.filter((w) => w.status === 'ACTIVE').length;

  return {
    summaries,
    overview: {
      totalAccruedSalaries,
      totalPaymentsDistributed,
      totalPendingBalance,
      activeWorkerCount,
    },
  };
}
