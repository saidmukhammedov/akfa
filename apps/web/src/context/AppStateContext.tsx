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
  markAttendance: (workerId: string, status: AttendanceStatus, notes?: string) => Promise<void>;
  bulkMarkAttendance: (status: AttendanceStatus) => Promise<void>;
  recordPayment: (workerId: string, amount: number, paymentMethod: PaymentMethod, notes?: string) => Promise<void>;
  addWorker: (input: WorkerCreateInput) => Promise<void>;
  updateWorker: (id: string, input: WorkerUpdateInput) => Promise<void>;
  archiveWorker: (id: string) => Promise<void>;
  unarchiveWorker: (id: string) => Promise<void>;
  financeSummaries: WorkerFinanceSummary[];
  financeOverview: WorkshopFinanceOverview;
  activeWorkers: Worker[];
  archivedWorkers: Worker[];
  todayAttendanceRatio: { present: number; total: number };
}

const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

export const AppStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();

  const [workers, setWorkers] = useState<Worker[]>([]);
  const [dateAttendanceRecords, setDateAttendanceRecords] = useState<DateAttendanceRecord[]>([]);
  const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [financeSummaries, setFinanceSummaries] = useState<WorkerFinanceSummary[]>([]);
  const [financeOverview, setFinanceOverview] = useState<WorkshopFinanceOverview>({
    totalAccruedSalaries: 0,
    totalPaymentsDistributed: 0,
    totalPendingBalance: 0,
    activeWorkerCount: 0,
  });

  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isMutating, setIsMutating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAttendanceForDate = useCallback(async (date: string) => {
    if (!isAuthenticated) return;
    try {
      const res = await api.attendance.getByDate(date);
      if (res.success && res.data) {
        setDateAttendanceRecords(res.data.records);
        // Also map to AttendanceRecord array
        const mapped = res.data.records
          .filter((r) => r.isMarked)
          .map((r) => ({
            id: `att-${r.workerId}-${date}`,
            workerId: r.workerId,
            date,
            status: r.status,
            rateSnapshot: r.rateSnapshot,
            notes: r.notes,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }));
        setAttendances(mapped);
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

    setIsLoading(true);
    setError(null);

    try {
      const [workersRes, overviewRes, summariesRes, paymentsRes] = await Promise.all([
        api.workers.list(),
        api.finance.getOverview(),
        api.finance.getSummaries(),
        api.finance.getPayments(30),
      ]);

      if (workersRes.success) setWorkers(workersRes.data);
      if (overviewRes.success) setFinanceOverview(overviewRes.data);
      if (summariesRes.success) setFinanceSummaries(summariesRes.data);
      if (paymentsRes.success) setPayments(paymentsRes.data);

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

  // Real API Mutations
  const markAttendance = async (workerId: string, status: AttendanceStatus, notes?: string) => {
    if (isMutating) return;
    setIsMutating(true);
    setError(null);

    try {
      await api.attendance.mark({
        workerId,
        date: selectedDate,
        status,
        notes: notes || null,
      });

      // Refetch attendance and finance data to guarantee honest server state
      await Promise.all([
        fetchAttendanceForDate(selectedDate),
        api.finance.getOverview().then((res) => res.success && setFinanceOverview(res.data)),
        api.finance.getSummaries().then((res) => res.success && setFinanceSummaries(res.data)),
      ]);
    } catch (err: any) {
      const msg = err instanceof ApiError ? err.message : 'Davomatni saqlashda xatolik';
      setError(msg);
      throw err;
    } finally {
      setIsMutating(false);
    }
  };

  const bulkMarkAttendance = async (status: AttendanceStatus) => {
    if (isMutating) return;
    setIsMutating(true);
    setError(null);

    try {
      const active = workers.filter((w) => w.status === 'ACTIVE');
      const records = active.map((w) => ({
        workerId: w.id,
        status,
        notes: null,
      }));

      await api.attendance.bulkMark({
        date: selectedDate,
        records,
      });

      await Promise.all([
        fetchAttendanceForDate(selectedDate),
        api.finance.getOverview().then((res) => res.success && setFinanceOverview(res.data)),
        api.finance.getSummaries().then((res) => res.success && setFinanceSummaries(res.data)),
      ]);
    } catch (err: any) {
      const msg = err instanceof ApiError ? err.message : 'Barcha davomatni saqlashda xatolik';
      setError(msg);
      throw err;
    } finally {
      setIsMutating(false);
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
