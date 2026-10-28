export type AttendanceStatus = 'PRESENT' | 'ABSENT';

export interface AttendanceRecord {
  id: string;
  workerId: string;
  date: string; // ISO date format YYYY-MM-DD
  status: AttendanceStatus;
  rateSnapshot: number; // Historical rate snapshot in UZS for this day
  isHalfDay?: boolean;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceWithWorker extends AttendanceRecord {
  workerName: string;
  workerRole: string;
}

export interface MarkAttendanceInput {
  workerId: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  isHalfDay?: boolean;
  rateSnapshot?: number;
  notes?: string | null;
}

export interface BulkAttendanceInput {
  date: string; // YYYY-MM-DD
  records: Array<{
    workerId: string;
    status: AttendanceStatus;
    isHalfDay?: boolean;
    rateSnapshot?: number;
    notes?: string | null;
  }>;
}

export interface DailyAttendanceSummary {
  date: string;
  totalActiveWorkers: number;
  presentCount: number;
  absentCount: number;
  totalAccruedAmount: number;
}
