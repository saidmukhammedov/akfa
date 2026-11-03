import { WorkerRole } from './worker.js';

export interface VolumeRecord {
  id: string;
  workerId: string;
  workerName?: string;
  workerRole?: WorkerRole;
  date: string; // YYYY-MM-DD
  squareMeters: number; // Completed m² (supports decimals)
  rateSnapshot: number; // Rate per m² at recording time
  totalAmount: number; // squareMeters * rateSnapshot
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VolumeCreateInput {
  workerId: string;
  date: string; // YYYY-MM-DD
  squareMeters: number; // > 0
  rateSnapshot?: number; // Optional custom rate, otherwise worker.ratePerM2 is used
  notes?: string | null;
}

export interface VolumeUpdateInput {
  date?: string;
  squareMeters?: number; // > 0
  rateSnapshot?: number;
  notes?: string | null;
}

export interface DailyVolumeSummary {
  date: string;
  totalSquareMeters: number;
  totalAmount: number;
  recordsCount: number;
}

export interface WorkerVolumeSummary {
  workerId: string;
  workerName: string;
  workerRole: WorkerRole;
  currentRatePerM2: number;
  totalSquareMeters: number;
  totalVolumeEarnings: number;
  entriesCount: number;
}

export interface VolumeOverview {
  todaySquareMeters: number;
  todayEarnings: number;
  monthlySquareMeters: number;
  monthlyEarnings: number;
  totalSquareMetersAllTime: number;
  totalEarningsAllTime: number;
}
