// User and Session types

export interface User {
  id: string;
  email: string;
  username: string;
  kyc_status: 'pending' | 'verified' | 'rejected';
  role: 'user' | 'admin';
  created_at: Date;
  updated_at: Date;
}

export interface Session {
  id: string;
  user_id: string;
  device?: string;
  ip_address?: string;
  token: string;
  expires_at: Date;
  created_at: Date;
}

export interface CreateUserDto {
  email: string;
  username: string;
  password: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}
