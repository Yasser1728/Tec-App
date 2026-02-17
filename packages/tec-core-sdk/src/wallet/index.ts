import { TecApiClient } from '../client';
import type { Wallet, Transaction, WalletBalance, TransactionHistoryOptions, PaginatedResponse } from '../types';

export class TecWalletSDK {
  private client: TecApiClient;

  constructor(client: TecApiClient) {
    this.client = client;
  }

  async getWallets(): Promise<Wallet[]> {
    return this.client.get<Wallet[]>('/api/wallets');
  }

  async getBalance(walletId: string): Promise<WalletBalance> {
    return this.client.get<WalletBalance>(`/api/wallets/${walletId}/balance`);
  }

  async getPrimaryBalance(): Promise<WalletBalance | null> {
    const wallets = await this.getWallets();
    const primary = wallets.find(w => w.is_primary);
    if (!primary) return null;
    return this.getBalance(primary.id);
  }

  async getTransactions(walletId: string, options: TransactionHistoryOptions = {}): Promise<PaginatedResponse<Transaction>> {
    const params = new URLSearchParams();
    if (options.page) params.set('page', String(options.page));
    if (options.limit) params.set('limit', String(options.limit));
    if (options.type) params.set('type', options.type);
    if (options.status) params.set('status', options.status);

    const query = params.toString();
    return this.client.get<PaginatedResponse<Transaction>>(
      `/api/wallets/${walletId}/transactions${query ? `?${query}` : ''}`
    );
  }

  async linkWallet(walletAddress: string, walletType: 'pi' | 'crypto' | 'fiat'): Promise<Wallet> {
    return this.client.post<Wallet>('/api/wallets/link', { wallet_address: walletAddress, wallet_type: walletType });
  }
}
