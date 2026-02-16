export interface Wallet {
  id: string;
  user_id: string;
  wallet_address: string;
  wallet_type: 'pi' | 'crypto' | 'fiat';
  balance: number;
  currency: string;
  created_at: Date;
  updated_at: Date;
}

export interface Transaction {
  id: string;
  wallet_id: string;
  type: 'credit' | 'debit' | 'transfer';
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed';
  description?: string;
  created_at: Date;
}

export interface CreateWalletInput {
  user_id: string;
  wallet_type: 'pi' | 'crypto' | 'fiat';
  currency: string;
}
