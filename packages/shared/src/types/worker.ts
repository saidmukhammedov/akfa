export type WorkerStatus = 'ACTIVE' | 'ARCHIVED';

export type WorkerRole = 'usta' | 'shogird' | 'yordamchi' | 'ornatuvchi' | 'boshqa';

export interface Worker {
  id: string;
  name: string;
  phone?: string | null;
  role: WorkerRole;
  dailyRate: number; // in UZS (so'm)
  ratePerM2: number; // in UZS (so'm) per m²
  status: WorkerStatus;
  archivedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WorkerCreateInput {
  name: string;
  phone?: string | null;
  role: WorkerRole;
  dailyRate: number;
  ratePerM2?: number;
}

export interface WorkerUpdateInput {
  name?: string;
  phone?: string | null;
  role?: WorkerRole;
  dailyRate?: number;
  ratePerM2?: number;
  status?: WorkerStatus;
}
