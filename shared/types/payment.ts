// Payment types

export interface Payment {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  status: 'created' | 'approved' | 'completed' | 'failed' | 'cancelled';
  payment_method: 'pi' | 'card' | 'wallet';
  pi_payment_id?: string;
  metadata?: Record<string, any>;
  created_at: Date;
  approved_at?: Date;
  completed_at?: Date;
  updated_at: Date;
}

export interface CreatePaymentDto {
  amount: number;
  currency?: string;
  payment_method: 'pi' | 'card' | 'wallet';
  metadata?: Record<string, any>;
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
