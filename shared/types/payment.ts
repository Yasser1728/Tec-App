export interface Payment {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'approved' | 'completed' | 'failed' | 'cancelled';
  payment_method: 'pi' | 'card' | 'wallet';
  pi_payment_id?: string;
  metadata?: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface CreatePaymentInput {
  user_id: string;
  amount: number;
  currency: string;
  payment_method: 'pi' | 'card' | 'wallet';
  metadata?: Record<string, any>;
}

export interface ApprovePaymentInput {
  payment_id: string;
  pi_payment_id?: string;
}

export interface PaymentStatus {
  id: string;
  status: string;
  amount: number;
  currency: string;
  created_at: Date;
}
