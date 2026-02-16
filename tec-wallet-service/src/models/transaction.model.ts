export interface Transaction {
  id: string;
  wallet_id: string;
  type: string;
  amount: number;
  currency: string;
  status: string;
  description?: string;
  created_at: Date;
}

export interface CreateTransactionData {
  wallet_id: string;
  type: string;
  amount: number;
  currency?: string;
  description?: string;
}
