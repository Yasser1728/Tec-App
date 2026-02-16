export interface User {
  id: string;
  email: string;
  username: string;
  password_hash: string;
  kyc_status: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserData {
  email: string;
  username: string;
  password_hash: string;
}
