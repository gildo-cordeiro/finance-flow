export interface UserProfile {
  id: string;
  email: string;
  name: string;
  timeZone: string;
  currency: string;
  budgetClosingDay: number;
  dateFormat: string;
}

export interface RegisterPayload {
  email: string;
  name: string;
  password?: string; // Optional if UI handles it separately, but required in API
  timeZone: string;
  currency: string;
  budgetClosingDay: number;
  dateFormat?: string;
}

export interface LoginPayload {
  email: string;
  password?: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

export interface UpdateProfilePayload {
  name: string;
  timeZone: string;
  currency: string;
  budgetClosingDay: number;
  dateFormat: string;
}

export interface ApiError {
  code: string;
  message: string;
  errors?: { field: string; message: string }[];
  status?: number;
}

export interface ChangePasswordPayload {
  currentPassword?: string;
  newPassword?: string;
}

