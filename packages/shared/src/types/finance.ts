import { WorkerRole, WorkerStatus } from './worker.js';

export type PaymentMethod = 'CASH' | 'CARD' | 'BANK_TRANSFER';

export interface PaymentRecord {
  id: string;
  workerId: string;
  amount: number; // in UZS (so'm)
  paymentDate: string; // YYYY-MM-DD
  paymentMethod: PaymentMethod;
  notes?: string | null;
  createdAt: string;
  workerName?: string;
}

export interface PaymentCreateInput {
  workerId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  notes?: string | null;
}

export interface WorkerFinanceSummary {
  workerId: string;
  name: string;
  role: WorkerRole;
  status: WorkerStatus;
  currentDailyRate: number;
  currentRatePerM2?: number;
  daysWorked: number; // Count of 'PRESENT' days
  baseSalary?: number; // Base earnings from attendance (daily wages)
  volumeM2?: number; // Total completed square meters
  volumeEarnings?: number; // Total volume earnings from daily entries
  totalAccruedSalary: number; // Combined Total Earnings: Base Salary + Volume Earnings
  totalPaid: number; // Sum of recorded payments
  balanceOwed: number; // totalAccruedSalary - totalPaid (positive = shop owes worker, negative = overpaid/advance)
}

export interface WorkshopFinanceOverview {
  totalAccruedSalaries: number; // Combined total earnings across all workers
  totalBaseSalaries?: number; // Total base wages from attendance
  totalVolumeEarnings?: number; // Total volume-based earnings
  totalVolumeM2?: number; // Total square meters across workers
  totalPaymentsDistributed: number;
  totalPendingBalance: number;
  activeWorkerCount: number;
}
