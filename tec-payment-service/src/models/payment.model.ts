export interface Payment {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  status: string;
  payment_method: string;
  pi_payment_id?: string;
  metadata?: any;
  created_at: Date;
  updated_at: Date;
}

export interface CreatePaymentData {
  user_id: string;
  amount: number;
  currency?: string;
  payment_method: string;
  metadata?: any;
}
