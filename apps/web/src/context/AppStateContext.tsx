import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import {
  Worker,
  AttendanceRecord,
  PaymentRecord,
  AttendanceStatus,
  PaymentMethod,
  WorkerCreateInput,
  WorkerUpdateInput,
  WorkerFinanceSummary,
  WorkshopFinanceOverview,
  getTodayDateString,
} from '@akfa/shared';
import { api, ApiError } from '../api/client';
import { useAuth } from './AuthContext';

interface DateAttendanceRecord {
  workerId: string;
  workerName: string;
  workerRole: string;
  dailyRate: number;
  status: AttendanceStatus;
  rateSnapshot: number;
  isHalfDay?: boolean;
  notes: string | null;
  isMarked: boolean;
}

interface AppStateContextType {
  workers: Worker[];
  attendances: AttendanceRecord[];
  dateAttendanceRecords: DateAttendanceRecord[];
  payments: PaymentRecord[];
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  isLoading: boolean;
  isMutating: boolean;
  error: string | null;
  clearError: () => void;
  refreshData: () => Promise<void>;
  markAttendance: (workerId: string, status: AttendanceStatus, notes?: string, isHalfDay?: boolean) => Promise<void>;
  bulkMarkAttendance: (status: AttendanceStatus) => Promise<void>;
  recordPayment: (workerId: string, amount: number, paymentMethod: PaymentMethod, notes?: string) => Promise<void>;
  addWorker: (input: WorkerCreateInput) => Promise<void>;
  updateWorker: (id: string, input: WorkerUpdateInput) => Promise<void>;
  archiveWorker: (id: string) => Promise<void>;
  unarchiveWorker: (id: string) => Promise<void>;
  deleteWorker: (id: string) => Promise<void>;
  purgeAllWorkers: () => Promise<void>;
  financeSummaries: WorkerFinanceSummary[];
  financeOverview: WorkshopFinanceOverview;
  activeWorkers: Worker[];
  archivedWorkers: Worker[];
  todayAttendanceRatio: { present: number; total: number };
}

const CACHE_KEYS = {
  WORKERS: 'akfa_cache_workers',
  OVERVIEW: 'akfa_cache_overview',
  SUMMARIES: 'akfa_cache_summaries',
  PAYMENTS: 'akfa_cache_payments',
  DATE_RECORDS: 'akfa_cache_date_records',
  ATTENDANCES: 'akfa_cache_attendances',
};

const getCache = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch {}
  return fallback;
};

const setCache = <T,>(key: string, value: T) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
};

const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

export const AppStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();

  // Instant zero-delay startup with local cache
  const [workers, setWorkers] = useState<Worker[]>(() => getCache(CACHE_KEYS.WORKERS, []));
  const [dateAttendanceRecords, setDateAttendanceRecords] = useState<DateAttendanceRecord[]>(() => getCache(CACHE_KEYS.DATE_RECORDS, []));
  const [attendances, setAttendances] = useState<AttendanceRecord[]>(() => getCache(CACHE_KEYS.ATTENDANCES, []));
  const [payments, setPayments] = useState<PaymentRecord[]>(() => getCache(CACHE_KEYS.PAYMENTS, []));
  const [financeSummaries, setFinanceSummaries] = useState<WorkerFinanceSummary[]>(() => getCache(CACHE_KEYS.SUMMARIES, []));
  const [financeOverview, setFinanceOverview] = useState<WorkshopFinanceOverview>(() =>
    getCache(CACHE_KEYS.OVERVIEW, {
      totalAccruedSalaries: 0,
      totalPaymentsDistributed: 0,
      totalPendingBalance: 0,
      activeWorkerCount: 0,
    })
  );

  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isMutating, setIsMutating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAttendanceForDate = useCallback(async (date: string) => {
    if (!isAuthenticated) return;
    try {
      const res = await api.attendance.getByDate(date);
      if (res.success && res.data) {
        setDateAttendanceRecords(res.data.records);
        setCache(CACHE_KEYS.DATE_RECORDS, res.data.records);
        // Also map to AttendanceRecord array
        const mapped = res.data.records
          .filter((r) => r.isMarked)
          .map((r) => ({
            id: `att-${r.workerId}-${date}`,
            workerId: r.workerId,
            date,
            status: r.status,
            rateSnapshot: r.rateSnapshot,
            isHalfDay: r.isHalfDay,
            notes: r.notes,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }));
        setAttendances(mapped);
        setCache(CACHE_KEYS.ATTENDANCES, mapped);
      }
    } catch (err: any) {
      console.error('Failed to load attendance:', err);
    }
  }, [isAuthenticated]);

  const refreshData = useCallback(async () => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    try {
      const [workersRes, overviewRes, summariesRes, paymentsRes] = await Promise.all([
        api.workers.list(),
        api.finance.getOverview(),
        api.finance.getSummaries(),
        api.finance.getPayments(30),
      ]);

      if (workersRes.success) {
        setWorkers(workersRes.data);
        setCache(CACHE_KEYS.WORKERS, workersRes.data);
      }
      if (overviewRes.success) {
        setFinanceOverview(overviewRes.data);
        setCache(CACHE_KEYS.OVERVIEW, overviewRes.data);
      }
      if (summariesRes.success) {
        setFinanceSummaries(summariesRes.data);
        setCache(CACHE_KEYS.SUMMARIES, summariesRes.data);
      }
      if (paymentsRes.success) {
        setPayments(paymentsRes.data);
        setCache(CACHE_KEYS.PAYMENTS, paymentsRes.data);
      }

      await fetchAttendanceForDate(selectedDate);
    } catch (err: any) {
      const msg = err instanceof ApiError ? err.message : "Ma'lumotlarni yuklashda xatolik yuz berdi";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, selectedDate, fetchAttendanceForDate]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  useEffect(() => {
    fetchAttendanceForDate(selectedDate);
  }, [selectedDate, fetchAttendanceForDate]);

  // Real API Mutations with Optimistic Updates for Instant UI Responsiveness
  const markAttendance = async (
    workerId: string,
    status: AttendanceStatus,
    notes?: string,
    isHalfDay?: boolean
  ) => {
    // Snapshot previous state for instant rollback on error
    const prevAttendances = attendances;
    const prevDateRecords = dateAttendanceRecords;
    const prevOverview = financeOverview;
    const prevSummaries = financeSummaries;

    const worker = workers.find((w) => w.id === workerId);
    const workerRate = worker?.dailyRate || 0;

    const effectiveHalf = status === 'PRESENT' ? Boolean(isHalfDay) : false;
    const effectiveRate = status === 'PRESENT'
      ? (effectiveHalf ? Math.round(workerRate / 2) : workerRate)
      : workerRate;

    // 1. Optimistically update attendances immediately (0ms delay)
    setAttendances((prev) => {
      const idx = prev.findIndex((a) => a.workerId === workerId && a.date === selectedDate);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = {
          ...updated[idx],
          status,
          isHalfDay: effectiveHalf,
          rateSnapshot: effectiveRate,
          notes: notes !== undefined ? (notes || null) : updated[idx].notes,
          updatedAt: new Date().toISOString(),
        };
        return updated;
      } else {
        return [
          ...prev,
          {
            id: `att-${workerId}-${selectedDate}`,
            workerId,
            date: selectedDate,
            status,
            isHalfDay: effectiveHalf,
            rateSnapshot: effectiveRate,
            notes: notes || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ];
      }
    });

    // 2. Optimistically update dateAttendanceRecords immediately
    setDateAttendanceRecords((prev) => {
      const idx = prev.findIndex((r) => r.workerId === workerId);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = {
          ...updated[idx],
          status,
          isHalfDay: effectiveHalf,
          rateSnapshot: effectiveRate,
          notes: notes !== undefined ? (notes || null) : updated[idx].notes,
          isMarked: true,
        };
        return updated;
      }
      return prev;
    });

    // 3. Optimistically update financial overview
    const existing = prevAttendances.find((a) => a.workerId === workerId && a.date === selectedDate);
    const prevEarned = existing?.status === 'PRESENT' ? (existing.rateSnapshot || workerRate) : 0;
    const newEarned = status === 'PRESENT' ? effectiveRate : 0;
    const delta = newEarned - prevEarned;
    if (delta !== 0) {
      setFinanceOverview((prev) => ({
        ...prev,
        totalAccruedSalaries: Math.max(0, prev.totalAccruedSalaries + delta),
        totalPendingBalance: prev.totalPendingBalance + delta,
      }));
    }

    try {
      await api.attendance.mark({
        workerId,
        date: selectedDate,
        status,
        isHalfDay: effectiveHalf,
        rateSnapshot: status === 'PRESENT' ? effectiveRate : undefined,
        notes: notes || null,
      });

      // Background reconcile with server calculations
      Promise.all([
        api.finance.getOverview().then((res) => res.success && setFinanceOverview(res.data)),
        api.finance.getSummaries().then((res) => res.success && setFinanceSummaries(res.data)),
      ]).catch((err) => {
        console.warn('Background finance sync warning:', err);
      });
    } catch (err: any) {
      // Rollback to previous state on failure
      setAttendances(prevAttendances);
      setDateAttendanceRecords(prevDateRecords);
      setFinanceOverview(prevOverview);
      setFinanceSummaries(prevSummaries);
      const msg = err instanceof ApiError ? err.message : 'Davomatni saqlashda xatolik';
      setError(msg);
      throw err;
    }
  };

  const bulkMarkAttendance = async (status: AttendanceStatus) => {
    const prevAttendances = attendances;
    const prevDateRecords = dateAttendanceRecords;
    const prevOverview = financeOverview;
    const prevSummaries = financeSummaries;

    const active = workers.filter((w) => w.status === 'ACTIVE');

    // Optimistically update all active workers immediately
    setAttendances((prev) => {
      const remaining = prev.filter(
        (a) => !(a.date === selectedDate && active.some((w) => w.id === a.workerId))
      );
      const newRecords: AttendanceRecord[] = active.map((w) => {
        const existing = prev.find((a) => a.workerId === w.id && a.date === selectedDate);
        return {
          id: existing ? existing.id : `att-${w.id}-${selectedDate}`,
          workerId: w.id,
          date: selectedDate,
          status,
          rateSnapshot: existing ? existing.rateSnapshot : w.dailyRate,
          notes: existing?.notes || null,
          createdAt: existing ? existing.createdAt : new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      });
      return [...remaining, ...newRecords];
    });

    setDateAttendanceRecords((prev) =>
      prev.map((r) =>
        active.some((w) => w.id === r.workerId) ? { ...r, status, isMarked: true } : r
      )
    );

    try {
      const records = active.map((w) => ({
        workerId: w.id,
        status,
        notes: null,
      }));

      await api.attendance.bulkMark({
        date: selectedDate,
        records,
      });

      Promise.all([
        api.finance.getOverview().then((res) => res.success && setFinanceOverview(res.data)),
        api.finance.getSummaries().then((res) => res.success && setFinanceSummaries(res.data)),
      ]).catch((err) => {
        console.warn('Background finance sync warning:', err);
      });
    } catch (err: any) {
      setAttendances(prevAttendances);
      setDateAttendanceRecords(prevDateRecords);
      setFinanceOverview(prevOverview);
      setFinanceSummaries(prevSummaries);
      const msg = err instanceof ApiError ? err.message : 'Barcha davomatni saqlashda xatolik';
      setError(msg);
      throw err;
    }
  };

  const recordPayment = async (
    workerId: string,
    amount: number,
    paymentMethod: PaymentMethod,
    notes?: string
  ) => {
    if (isMutating) return;
    setIsMutating(true);
    setError(null);

    try {
      await api.finance.recordPayment({
        workerId,
        amount,
        paymentDate: selectedDate,
        paymentMethod,
        notes: notes || null,
      });

      await Promise.all([
        api.finance.getOverview().then((res) => res.success && setFinanceOverview(res.data)),
        api.finance.getSummaries().then((res) => res.success && setFinanceSummaries(res.data)),
        api.finance.getPayments(30).then((res) => res.success && setPayments(res.data)),
      ]);
    } catch (err: any) {
      const msg = err instanceof ApiError ? err.message : "To'lovni kiritishda xatolik";
      setError(msg);
      throw err;
    } finally {
      setIsMutating(false);
    }
  };

  const addWorker = async (input: WorkerCreateInput) => {
    if (isMutating) return;
    setIsMutating(true);
    setError(null);

    try {
      const res = await api.workers.create(input);
      if (res.success) {
        setWorkers((prev) => [res.data, ...prev]);
        await refreshData();
      }
    } catch (err: any) {
      const msg = err instanceof ApiError ? err.message : "Ishchi qo'shishda xatolik";
      setError(msg);
      throw err;
    } finally {
      setIsMutating(false);
    }
  };

  const updateWorker = async (id: string, input: WorkerUpdateInput) => {
    if (isMutating) return;
    setIsMutating(true);
    setError(null);

    try {
      const res = await api.workers.update(id, input);
      if (res.success) {
        setWorkers((prev) => prev.map((w) => (w.id === id ? res.data : w)));
        await refreshData();
      }
    } catch (err: any) {
      const msg = err instanceof ApiError ? err.message : 'Ishchini yangilashda xatolik';
      setError(msg);
      throw err;
    } finally {
      setIsMutating(false);
    }
  };

  const archiveWorker = async (id: string) => {
    if (isMutating) return;
    setIsMutating(true);
    setError(null);

    try {
      const res = await api.workers.archive(id);
      if (res.success) {
        setWorkers((prev) => prev.map((w) => (w.id === id ? res.data : w)));
        await refreshData();
      }
    } catch (err: any) {
      const msg = err instanceof ApiError ? err.message : 'Ishchini arxivlashda xatolik';
      setError(msg);
      throw err;
    } finally {
      setIsMutating(false);
    }
  };

  const unarchiveWorker = async (id: string) => {
    if (isMutating) return;
    setIsMutating(true);
    setError(null);

    try {
      const res = await api.workers.unarchive(id);
      if (res.success) {
        setWorkers((prev) => prev.map((w) => (w.id === id ? res.data : w)));
        await refreshData();
      }
    } catch (err: any) {
      const msg = err instanceof ApiError ? err.message : 'Ishchini faollashtirishda xatolik';
      setError(msg);
      throw err;
    } finally {
      setIsMutating(false);
    }
  };

  const deleteWorker = async (id: string) => {
    if (isMutating) return;
    setIsMutating(true);
    setError(null);

    try {
      const res = await api.workers.delete(id);
      if (res.success) {
        setWorkers((prev) => prev.filter((w) => w.id !== id));
        await refreshData();
      }
    } catch (err: any) {
      const msg = err instanceof ApiError ? err.message : "Ishchini o'chirishda xatolik";
      setError(msg);
      throw err;
    } finally {
      setIsMutating(false);
    }
  };

  const purgeAllWorkers = async () => {
    if (isMutating) return;
    setIsMutating(true);
    setError(null);

    try {
      const res = await api.workers.purgeAll();
      if (res.success) {
        setWorkers([]);
        setAttendances([]);
        setDateAttendanceRecords([]);
        setPayments([]);
        setFinanceSummaries([]);
        setFinanceOverview({
          totalAccruedSalaries: 0,
          totalPaymentsDistributed: 0,
          totalPendingBalance: 0,
          activeWorkerCount: 0,
        });
        await refreshData();
      }
    } catch (err: any) {
      const msg = err instanceof ApiError ? err.message : "Barcha ma'lumotlarni o'chirishda xatolik";
      setError(msg);
      throw err;
    } finally {
      setIsMutating(false);
    }
  };

  const activeWorkers = workers.filter((w) => w.status === 'ACTIVE');
  const archivedWorkers = workers.filter((w) => w.status === 'ARCHIVED');

  const presentCount = dateAttendanceRecords.filter((r) => r.status === 'PRESENT').length;
  const todayAttendanceRatio = {
    present: presentCount,
    total: activeWorkers.length,
  };

  return (
    <AppStateContext.Provider
      value={{
        workers,
        attendances,
        dateAttendanceRecords,
        payments,
        selectedDate,
        setSelectedDate,
        isLoading,
        isMutating,
        error,
        clearError: () => setError(null),
        refreshData,
        markAttendance,
        bulkMarkAttendance,
        recordPayment,
        addWorker,
        updateWorker,
        archiveWorker,
        unarchiveWorker,
        deleteWorker,
        purgeAllWorkers,
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
