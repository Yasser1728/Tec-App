// @tec/core-sdk Types
// Merged from shared/types and tec-frontend/types with all 'any' types replaced with 'unknown' or proper types

// ===== API Types (from shared/types/api.ts) =====
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    timestamp: string;
    requestId?: string;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'AUTHENTICATION_ERROR'
  | 'AUTHORIZATION_ERROR'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'INTERNAL_ERROR'
  | 'SERVICE_UNAVAILABLE';

// ===== Payment Types (from shared/types/payment.ts) =====
export interface Payment {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  status: 'created' | 'approved' | 'completed' | 'failed' | 'cancelled';
  payment_method: 'pi' | 'card' | 'wallet';
  pi_payment_id?: string;
  metadata?: Record<string, unknown>;
  created_at: Date;
  approved_at?: Date;
  completed_at?: Date;
  updated_at: Date;
}

export interface CreatePaymentDto {
  amount: number;
  currency?: string;
  payment_method: 'pi' | 'card' | 'wallet';
  metadata?: Record<string, unknown>;
}

export interface ApprovePaymentDto {
  payment_id: string;
  pi_payment_id?: string;
}

export interface CompletePaymentDto {
  payment_id: string;
  transaction_id?: string;
}

export interface PaymentStatus {
  payment_id: string;
  status: Payment['status'];
  amount: number;
  currency: string;
  created_at: Date;
  updated_at: Date;
}

// ===== Wallet Types (from shared/types/wallet.ts) =====
export interface Wallet {
  id: string;
  user_id: string;
  wallet_address?: string;
  wallet_type: 'pi' | 'crypto' | 'fiat';
  balance: number;
  currency: string;
  is_primary: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Transaction {
  id: string;
  wallet_id: string;
  type: 'deposit' | 'withdrawal' | 'transfer' | 'payment';
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed';
  tx_hash?: string;
  from_addr?: string;
  to_addr?: string;
  memo?: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateWalletDto {
  wallet_type: 'pi' | 'crypto' | 'fiat';
  wallet_address?: string;
  currency: string;
}

export interface LinkWalletDto {
  wallet_address: string;
  wallet_type: 'pi' | 'crypto' | 'fiat';
}

export interface TransactionQuery {
  page?: number;
  limit?: number;
  type?: string;
  status?: string;
}

// ===== User Types (from shared/types/user.ts) =====
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

// ===== Pi Network Types (from tec-frontend/types/pi.types.ts) =====
export interface PiUser {
  uid: string;
  username: string;
}

export interface PiAuthResult {
  accessToken: string;
  user: PiUser;
}

export interface TecUser {
  id: string;
  piId: string;
  piUsername: string;
  role: string;
  subscriptionPlan: string | null;
  createdAt: string;
}

export interface TecAuthResponse {
  success: boolean;
  isNewUser: boolean;
  user: TecUser;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

export interface PiPaymentData {
  amount: number;
  memo: string;
  metadata: Record<string, unknown>;
}

export interface PiPaymentCallbacks {
  onReadyForServerApproval: (paymentId: string) => void;
  onReadyForServerCompletion: (paymentId: string, txid: string) => void;
  onCancel: (paymentId: string) => void;
  onError: (error: Error, payment?: unknown) => void;
}

export type PaymentStatusType = 'idle' | 'pending' | 'approved' | 'completing' | 'completed' | 'cancelled' | 'error';

export interface PaymentState {
  status: PaymentStatusType;
  paymentId: string | null;
  txid: string | null;
  error: string | null;
  amount: number;
}

// ===== SDK-Specific Types (from tec-frontend/lib/pi/pi-payment.ts) =====
export interface A2UPaymentRequest {
  recipientUid: string;
  amount: number;
  memo: string;
  metadata?: Record<string, unknown>;
}

export interface PaymentResult {
  success: boolean;
  paymentId?: string;
  txid?: string;
  status: 'pending' | 'approved' | 'completed' | 'cancelled' | 'failed';
  amount: number;
  memo: string;
}

// ===== New SDK Configuration Types =====
export interface TecSDKConfig {
  apiUrl: string;
  appName: string;
  appDomain?: string;
  sandbox?: boolean;
  onTokenExpired?: () => void;
}

export interface WalletBalance {
  walletId: string;
  balance: number;
  currency: string;
  walletType: 'pi' | 'crypto' | 'fiat';
  isPrimary: boolean;
}

export interface TransactionHistoryOptions {
  page?: number;
  limit?: number;
  type?: 'deposit' | 'withdrawal' | 'transfer' | 'payment';
  status?: 'pending' | 'completed' | 'failed';
}
