import { AttendanceStatus } from './attendance.js';
import { WorkerRole } from './worker.js';

export type VoiceIntent =
  | 'record_attendance'
  | 'record_volume'
  | 'get_daily_report'
  | 'get_monthly_report'
  | 'get_worker_salary'
  | 'get_volume_report'
  | 'correct_entry';

export interface VoiceAttendanceEntry {
  workerName: string;
  status: AttendanceStatus;
  isHalfDay?: boolean;
  notes?: string;
}

export interface VoiceVolumeEntry {
  workerName: string;
  squareMeters: number;
  ratePerM2?: number;
  notes?: string;
}

export interface VoiceParsedCommand {
  intent: VoiceIntent;
  date: string; // ISO YYYY-MM-DD in Asia/Tashkent
  entries?: Array<VoiceAttendanceEntry | VoiceVolumeEntry>;
  workerName?: string;
  notes?: string;
  needsClarification?: boolean;
  clarificationMessage?: string;
  rawTranscript: string;
}

export interface VoiceResolvedWorkerItem {
  workerId: string;
  workerName: string;
  workerRole: WorkerRole;
  currentDailyRate: number;
  currentRatePerM2: number;
  actionType: 'ATTENDANCE' | 'VOLUME';
  details: {
    status?: AttendanceStatus;
    isHalfDay?: boolean;
    squareMeters?: number;
    rateSnapshot?: number;
    totalAmount?: number;
    notes?: string;
  };
  warning?: string;
}

export interface VoiceDailyReportData {
  date: string;
  presentCount: number;
  absentCount: number;
  totalActiveWorkers: number;
  totalDailyWages: number;
  todayVolumeM2: number;
  todayVolumeEarnings: number;
  todayTotalEarnings: number;
  records: Array<{
    workerName: string;
    role: string;
    attendance: AttendanceStatus;
    volumeM2: number;
    totalEarnedToday: number;
  }>;
}

export interface VoiceMonthlyReportData {
  month: string;
  totalAccruedSalaries: number;
  totalBaseSalaries: number;
  totalVolumeEarnings: number;
  totalVolumeM2: number;
  totalPaymentsDistributed: number;
  totalPendingBalance: number;
  activeWorkerCount: number;
}

export interface VoiceWorkerSalaryData {
  workerId: string;
  workerName: string;
  workerRole: WorkerRole;
  daysWorked: number;
  baseSalary: number;
  totalVolumeM2: number;
  volumeEarnings: number;
  totalEarned: number;
  totalPaid: number;
  balanceOwed: number;
}

export interface VoiceVolumeReportData {
  period: string;
  totalSquareMeters: number;
  totalVolumeEarnings: number;
  workerBreakdown: Array<{
    workerName: string;
    role: string;
    squareMeters: number;
    earnings: number;
    ratePerM2: number;
  }>;
}

export type VoiceReportResult =
  | { type: 'DAILY_REPORT'; data: VoiceDailyReportData }
  | { type: 'MONTHLY_REPORT'; data: VoiceMonthlyReportData }
  | { type: 'WORKER_SALARY'; data: VoiceWorkerSalaryData }
  | { type: 'VOLUME_REPORT'; data: VoiceVolumeReportData };

export interface VoiceProcessResult {
  transcript: string;
  originalTranscript?: string;
  cleanedTranscript?: string;
  wasCleaned?: boolean;
  cleanReason?: string;
  cleaningMethod?: 'RULE_BASED' | 'AI_MODEL' | 'NONE';
  intent: VoiceIntent;
  date: string;
  requiresConfirmation: boolean;
  confirmationToken?: string;
  items?: VoiceResolvedWorkerItem[];
  report?: VoiceReportResult;
  needsClarification?: boolean;
  clarificationMessage?: string;
  executionResult?: {
    success: boolean;
    message: string;
    affectedCount: number;
  };
}

export interface VoiceAuditLogItem {
  id: string;
  ownerId: string;
  transcript: string;
  intent: string;
  status: 'PENDING_CONFIRMATION' | 'CONFIRMED' | 'REJECTED' | 'READ_ONLY' | 'FAILED';
  payload: any;
  resultSummary?: string | null;
  confirmationToken?: string | null;
  expiresAt?: string | Date | null;
  createdAt: string;
  confirmedAt?: string | null;
}
