export interface Wallet {
  id: string;
  user_id: string;
  wallet_address: string;
  wallet_type: string;
  balance: number;
  currency: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateWalletData {
  user_id: string;
  wallet_address: string;
  wallet_type: string;
  currency?: string;
}
