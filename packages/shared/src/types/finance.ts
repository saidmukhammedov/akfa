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
  daysWorked: number; // Count of 'PRESENT' days
  totalAccruedSalary: number; // Sum of (rateSnapshot * 1) for PRESENT days
  totalPaid: number; // Sum of recorded payments
  balanceOwed: number; // totalAccruedSalary - totalPaid (positive = shop owes worker, negative = overpaid/advance)
}

export interface WorkshopFinanceOverview {
  totalAccruedSalaries: number;
  totalPaymentsDistributed: number;
  totalPendingBalance: number;
  activeWorkerCount: number;
}
