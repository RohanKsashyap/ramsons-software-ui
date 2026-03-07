export interface User {
  _id: string;
  email: string;
  name?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  success: boolean;
  data: User;
  token: string;
  message?: string;
}

export interface ResetTokenResponse {
  success: boolean;
  message: string;
  resetToken: string;
  expiresAt: string;
}