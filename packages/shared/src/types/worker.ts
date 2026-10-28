export type WorkerStatus = 'ACTIVE' | 'ARCHIVED';

export type WorkerRole = 'usta' | 'shogird' | 'yordamchi' | 'ornatuvchi' | 'boshqa';

export interface Worker {
  id: string;
  name: string;
  phone?: string | null;
  role: WorkerRole;
  dailyRate: number; // in UZS (so'm)
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
}

export interface WorkerUpdateInput {
  name?: string;
  phone?: string | null;
  role?: WorkerRole;
  dailyRate?: number;
  status?: WorkerStatus;
}
