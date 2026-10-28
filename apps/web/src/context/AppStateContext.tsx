import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  Worker,
  AttendanceRecord,
  PaymentRecord,
  OwnerProfile,
  AttendanceStatus,
  PaymentMethod,
  WorkerCreateInput,
  WorkerUpdateInput,
  WorkerFinanceSummary,
  WorkshopFinanceOverview,
  getTodayDateString,
} from '@akfa/shared';

// =============================================================================
// PROTOTYPE SEED DATA (ISOLATED & CLEARLY LABELED FOR PHASE 1 UI VALIDATION)
// In production, data is retrieved directly from the Neon PostgreSQL database via API.
// =============================================================================
export const PROTOTYPE_SEED_DATA = {
  isSampleData: true,
  notice: 'Phase 1 Prototype Dataset — Do not treat as production bookkeeping records',
  owner: {
    id: 'owner-default-1',
    username: 'admin',
    fullName: 'Alisher Qodirov',
    workshopName: 'AKFA Rom va Eshiklar Tsexi',
    language: 'uz' as const,
    createdAt: '2026-10-01T00:00:00Z',
    updatedAt: '2026-10-01T00:00:00Z',
  },
  workers: [
    {
      id: 'worker-1',
      name: 'Jamshid Karimov',
      phone: '+998 90 123 45 67',
      role: 'usta' as const,
      dailyRate: 250000,
      status: 'ACTIVE' as const,
      createdAt: '2026-10-01T08:00:00Z',
      updatedAt: '2026-10-01T08:00:00Z',
    },
    {
      id: 'worker-2',
      name: 'Sherzod Toirov',
      phone: '+998 93 987 65 43',
      role: 'usta' as const,
      dailyRate: 220000,
      status: 'ACTIVE' as const,
      createdAt: '2026-10-01T08:00:00Z',
      updatedAt: '2026-10-01T08:00:00Z',
    },
    {
      id: 'worker-3',
      name: 'Bobur Usmonov',
      phone: '+998 97 456 78 90',
      role: 'ornatuvchi' as const,
      dailyRate: 200000,
      status: 'ACTIVE' as const,
      createdAt: '2026-10-05T08:00:00Z',
      updatedAt: '2026-10-05T08:00:00Z',
    },
    {
      id: 'worker-4',
      name: 'Jasur Saidov',
      phone: '+998 91 234 56 78',
      role: 'shogird' as const,
      dailyRate: 140000,
      status: 'ACTIVE' as const,
      createdAt: '2026-10-10T08:00:00Z',
      updatedAt: '2026-10-10T08:00:00Z',
    },
    {
      id: 'worker-5',
      name: 'Farrux Rahimov',
      phone: '+998 99 345 67 89',
      role: 'yordamchi' as const,
      dailyRate: 120000,
      status: 'ACTIVE' as const,
      createdAt: '2026-10-12T08:00:00Z',
      updatedAt: '2026-10-12T08:00:00Z',
    },
  ],
  attendances: [
    {
      id: 'att-1',
      workerId: 'worker-1',
      date: '2026-10-28',
      status: 'PRESENT' as const,
      rateSnapshot: 250000,
      notes: null,
      createdAt: '2026-10-28T08:00:00Z',
      updatedAt: '2026-10-28T08:00:00Z',
    },
    {
      id: 'att-2',
      workerId: 'worker-2',
      date: '2026-10-28',
      status: 'PRESENT' as const,
      rateSnapshot: 220000,
      notes: null,
      createdAt: '2026-10-28T08:00:00Z',
      updatedAt: '2026-10-28T08:00:00Z',
    },
    {
      id: 'att-3',
      workerId: 'worker-3',
      date: '2026-10-28',
      status: 'PRESENT' as const,
      rateSnapshot: 200000,
      notes: null,
      createdAt: '2026-10-28T08:00:00Z',
      updatedAt: '2026-10-28T08:00:00Z',
    },
    {
      id: 'att-4',
      workerId: 'worker-4',
      date: '2026-10-28',
      status: 'PRESENT' as const,
      rateSnapshot: 140000,
      notes: null,
      createdAt: '2026-10-28T08:00:00Z',
      updatedAt: '2026-10-28T08:00:00Z',
    },
    {
      id: 'att-5',
      workerId: 'worker-5',
      date: '2026-10-28',
      status: 'ABSENT' as const,
      rateSnapshot: 120000,
      notes: 'Betobligi sababli kelmadi',
      createdAt: '2026-10-28T08:00:00Z',
      updatedAt: '2026-10-28T08:00:00Z',
    },
    // Past attendance records to verify historical rate snapshots and salary calculations
    {
      id: 'att-past-1',
      workerId: 'worker-1',
      date: '2026-10-27',
      status: 'PRESENT' as const,
      rateSnapshot: 250000,
      notes: null,
      createdAt: '2026-10-27T08:00:00Z',
      updatedAt: '2026-10-27T08:00:00Z',
    },
    {
      id: 'att-past-2',
      workerId: 'worker-2',
      date: '2026-10-27',
      status: 'PRESENT' as const,
      rateSnapshot: 220000,
      notes: null,
      createdAt: '2026-10-27T08:00:00Z',
      updatedAt: '2026-10-27T08:00:00Z',
    },
  ],
  payments: [
    {
      id: 'pay-1',
      workerId: 'worker-1',
      amount: 1500000,
      paymentDate: '2026-10-20',
      paymentMethod: 'CASH' as const,
      notes: 'Haftalik avans berildi',
      createdAt: '2026-10-20T17:00:00Z',
      workerName: 'Jamshid Karimov',
    },
    {
      id: 'pay-2',
      workerId: 'worker-2',
      amount: 1000000,
      paymentDate: '2026-10-20',
      paymentMethod: 'CARD' as const,
      notes: 'Plastik kartaga tashlab berildi',
      createdAt: '2026-10-20T17:15:00Z',
      workerName: 'Sherzod Toirov',
    },
  ],
};

interface AppStateContextType {
  owner: OwnerProfile;
  workers: Worker[];
  attendances: AttendanceRecord[];
  payments: PaymentRecord[];
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  markAttendance: (workerId: string, status: AttendanceStatus, notes?: string) => void;
  bulkMarkAttendance: (status: AttendanceStatus) => void;
  recordPayment: (workerId: string, amount: number, paymentMethod: PaymentMethod, notes?: string) => void;
  addWorker: (input: WorkerCreateInput) => void;
  updateWorker: (id: string, input: WorkerUpdateInput) => void;
  archiveWorker: (id: string) => void;
  unarchiveWorker: (id: string) => void;
  updateOwnerProfile: (fullName: string, workshopName: string) => void;
  financeSummaries: WorkerFinanceSummary[];
  financeOverview: WorkshopFinanceOverview;
  activeWorkers: Worker[];
  archivedWorkers: Worker[];
  todayAttendanceRatio: { present: number; total: number };
}

const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

export const AppStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [owner, setOwner] = useState<OwnerProfile>(() => {
    const saved = localStorage.getItem('akfa_owner');
    return saved ? JSON.parse(saved) : PROTOTYPE_SEED_DATA.owner;
  });

  const [workers, setWorkers] = useState<Worker[]>(() => {
    const saved = localStorage.getItem('akfa_workers');
    return saved ? JSON.parse(saved) : PROTOTYPE_SEED_DATA.workers;
  });

  const [attendances, setAttendances] = useState<AttendanceRecord[]>(() => {
    const saved = localStorage.getItem('akfa_attendances');
    return saved ? JSON.parse(saved) : PROTOTYPE_SEED_DATA.attendances;
  });

  const [payments, setPayments] = useState<PaymentRecord[]>(() => {
    const saved = localStorage.getItem('akfa_payments');
    return saved ? JSON.parse(saved) : PROTOTYPE_SEED_DATA.payments;
  });

  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());

  // Persistence to local storage for realistic visual test workflows
  useEffect(() => {
    localStorage.setItem('akfa_owner', JSON.stringify(owner));
  }, [owner]);

  useEffect(() => {
    localStorage.setItem('akfa_workers', JSON.stringify(workers));
  }, [workers]);

  useEffect(() => {
    localStorage.setItem('akfa_attendances', JSON.stringify(attendances));
  }, [attendances]);

  useEffect(() => {
    localStorage.setItem('akfa_payments', JSON.stringify(payments));
  }, [payments]);

  // Tactile attendance marking with rate snapshotting
  const markAttendance = (workerId: string, status: AttendanceStatus, notes?: string) => {
    const worker = workers.find((w) => w.id === workerId);
    if (!worker) return;

    setAttendances((prev) => {
      const idx = prev.findIndex((a) => a.workerId === workerId && a.date === selectedDate);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = {
          ...updated[idx],
          status,
          notes: notes !== undefined ? notes : updated[idx].notes,
          updatedAt: new Date().toISOString(),
        };
        return updated;
      } else {
        const newRecord: AttendanceRecord = {
          id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          workerId,
          date: selectedDate,
          status,
          rateSnapshot: worker.dailyRate, // Snapshot of worker's daily rate for accurate historical pay calculation
          notes: notes || null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        return [...prev, newRecord];
      }
    });
  };

  const bulkMarkAttendance = (status: AttendanceStatus) => {
    const active = workers.filter((w) => w.status === 'ACTIVE');
    setAttendances((prev) => {
      const updated = [...prev];
      for (const w of active) {
        const idx = updated.findIndex((a) => a.workerId === w.id && a.date === selectedDate);
        if (idx >= 0) {
          updated[idx] = {
            ...updated[idx],
            status,
            updatedAt: new Date().toISOString(),
          };
        } else {
          updated.push({
            id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            workerId: w.id,
            date: selectedDate,
            status,
            rateSnapshot: w.dailyRate,
            notes: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      }
      return updated;
    });
  };

  const recordPayment = (
    workerId: string,
    amount: number,
    paymentMethod: PaymentMethod,
    notes?: string
  ) => {
    const worker = workers.find((w) => w.id === workerId);
    if (!worker) return;

    const newPayment: PaymentRecord = {
      id: `pay-${Date.now()}`,
      workerId,
      amount: Number(amount),
      paymentDate: selectedDate,
      paymentMethod,
      notes: notes || null,
      createdAt: new Date().toISOString(),
      workerName: worker.name,
    };

    setPayments((prev) => [newPayment, ...prev]);
  };

  const addWorker = (input: WorkerCreateInput) => {
    const newWorker: Worker = {
      id: `worker-${Date.now()}`,
      name: input.name,
      phone: input.phone || null,
      role: input.role,
      dailyRate: Number(input.dailyRate),
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setWorkers((prev) => [...prev, newWorker]);
  };

  const updateWorker = (id: string, input: WorkerUpdateInput) => {
    setWorkers((prev) =>
      prev.map((w) => (w.id === id ? { ...w, ...input, updatedAt: new Date().toISOString() } : w))
    );
  };

  const archiveWorker = (id: string) => {
    setWorkers((prev) =>
      prev.map((w) =>
        w.id === id
          ? { ...w, status: 'ARCHIVED', archivedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
          : w
      )
    );
  };

  const unarchiveWorker = (id: string) => {
    setWorkers((prev) =>
      prev.map((w) =>
        w.id === id
          ? { ...w, status: 'ACTIVE', archivedAt: null, updatedAt: new Date().toISOString() }
          : w
      )
    );
  };

  const updateOwnerProfile = (fullName: string, workshopName: string) => {
    setOwner((prev) => ({
      ...prev,
      fullName,
      workshopName,
      updatedAt: new Date().toISOString(),
    }));
  };

  // Calculations
  const activeWorkers = workers.filter((w) => w.status === 'ACTIVE');
  const archivedWorkers = workers.filter((w) => w.status === 'ARCHIVED');

  const todayStr = getTodayDateString();
  const todayAttendances = attendances.filter((a) => a.date === todayStr && a.status === 'PRESENT');
  const todayAttendanceRatio = {
    present: todayAttendances.length,
    total: activeWorkers.length,
  };

  // Financial calculations across all workers (including archived workers who retain historical balances)
  const financeSummaries: WorkerFinanceSummary[] = workers.map((worker) => {
    const presentRecords = attendances.filter(
      (a) => a.workerId === worker.id && a.status === 'PRESENT'
    );
    const daysWorked = presentRecords.length;
    // Calculated strictly from daily attendance and historical rate snapshots!
    const totalAccruedSalary = presentRecords.reduce(
      (sum, a) => sum + (a.rateSnapshot || worker.dailyRate),
      0
    );

    const workerPayments = payments.filter((p) => p.workerId === worker.id);
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

  const totalAccruedSalaries = financeSummaries.reduce((sum, s) => sum + s.totalAccruedSalary, 0);
  const totalPaymentsDistributed = financeSummaries.reduce((sum, s) => sum + s.totalPaid, 0);
  const totalPendingBalance = financeSummaries.reduce((sum, s) => sum + Math.max(0, s.balanceOwed), 0);

  const financeOverview: WorkshopFinanceOverview = {
    totalAccruedSalaries,
    totalPaymentsDistributed,
    totalPendingBalance,
    activeWorkerCount: activeWorkers.length,
  };

  return (
    <AppStateContext.Provider
      value={{
        owner,
        workers,
        attendances,
        payments,
        selectedDate,
        setSelectedDate,
        markAttendance,
        bulkMarkAttendance,
        recordPayment,
        addWorker,
        updateWorker,
        archiveWorker,
        unarchiveWorker,
        updateOwnerProfile,
        financeSummaries,
        financeOverview,
        activeWorkers,
        archivedWorkers,
        todayAttendanceRatio,
      }}
    >
      {children}
    </AppStateContext.Provider>
  );
};

export function useAppState(): AppStateContextType {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
}
