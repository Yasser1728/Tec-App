export interface User {
  id: string;
  email: string;
  username: string;
  password_hash: string;
  kyc_status: 'pending' | 'verified' | 'rejected';
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserInput {
  email: string;
  username: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface UserResponse {
  id: string;
  email: string;
  username: string;
  kyc_status: string;
  created_at: Date;
  updated_at: Date;
}
