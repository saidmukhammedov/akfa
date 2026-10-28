export type Language = 'uz' | 'ru';

export interface OwnerProfile {
  id: string;
  username: string;
  fullName: string;
  workshopName: string;
  language: Language;
  createdAt: string;
  updatedAt: string;
}

export interface AuthSession {
  token: string;
  user: OwnerProfile;
}

export interface LoginPayload {
  username: string;
  password: string;
}
