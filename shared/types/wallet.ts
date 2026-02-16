// Wallet and Transaction types

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
