import { TecApiClient } from '../client';
import type {
  Wallet,
  WalletBalance,
  Transaction,
  LinkWalletDto,
  TransactionHistoryOptions,
} from '../types';

export interface WalletListResponse {
  success: boolean;
  data: { wallets: Wallet[] };
}

export interface WalletBalanceResponse {
  success: boolean;
  data: { wallet: WalletBalance };
}

export interface WalletTransactionsResponse {
  success: boolean;
  data: {
    transactions: Transaction[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
}

export interface WalletOperationResponse {
  success: boolean;
  data: {
    wallet: Wallet;
    transaction: Transaction;
  };
}

export interface LinkWalletResponse {
  success: boolean;
  data: { wallet: Wallet };
}

export interface TransferResponse {
  success: boolean;
  data: {
    fromWallet: Wallet;
    toWallet: Wallet;
    debitTransaction: Transaction;
    creditTransaction: Transaction;
  };
}

export class TecWalletSDK {
  private client: TecApiClient;

  constructor(client: TecApiClient) {
    this.client = client;
  }

  // Get all wallets for a user
  async getWallets(userId: string): Promise<WalletListResponse> {
    if (!userId) throw new Error('userId is required');
    return this.client.get<WalletListResponse>(`/api/wallets?userId=${encodeURIComponent(userId)}`);
  }

  // Link a new wallet
  async linkWallet(data: LinkWalletDto & { userId: string; currency: string }): Promise<LinkWalletResponse> {
    return this.client.post('/api/wallets/link', data);
  }

  // Get wallet balance
  async getBalance(walletId: string): Promise<WalletBalanceResponse> {
    if (!walletId) throw new Error('walletId is required');
    return this.client.get<WalletBalanceResponse>(`/api/wallets/${encodeURIComponent(walletId)}/balance`);
  }

  // Get wallet transactions (paginated)
  async getTransactions(walletId: string, options?: TransactionHistoryOptions): Promise<WalletTransactionsResponse> {
    if (!walletId) throw new Error('walletId is required');
    const params = new URLSearchParams();
    if (options?.page) params.set('page', String(options.page));
    if (options?.limit) params.set('limit', String(options.limit));
    if (options?.type) params.set('type', options.type);
    if (options?.status) params.set('status', options.status);
    const qs = params.toString();
    return this.client.get<WalletTransactionsResponse>(
      `/api/wallets/${encodeURIComponent(walletId)}/transactions${qs ? `?${qs}` : ''}`
    );
  }

  // Deposit funds to a wallet
  async deposit(walletId: string, amount: number, options?: { assetType?: string; description?: string }): Promise<WalletOperationResponse> {
    if (!walletId) throw new Error('walletId is required');
    if (!Number.isFinite(amount) || amount <= 0) throw new Error('amount must be a positive number');
    return this.client.post<WalletOperationResponse>(`/api/wallets/${encodeURIComponent(walletId)}/deposit`, {
      amount,
      ...(options?.assetType ? { assetType: options.assetType } : {}),
      ...(options?.description ? { description: options.description } : {}),
    });
  }

  // Withdraw funds from a wallet
  async withdraw(walletId: string, amount: number, options?: { assetType?: string; description?: string }): Promise<WalletOperationResponse> {
    if (!walletId) throw new Error('walletId is required');
    if (!Number.isFinite(amount) || amount <= 0) throw new Error('amount must be a positive number');
    return this.client.post<WalletOperationResponse>(`/api/wallets/${encodeURIComponent(walletId)}/withdraw`, {
      amount,
      ...(options?.assetType ? { assetType: options.assetType } : {}),
      ...(options?.description ? { description: options.description } : {}),
    });
  }

  // Transfer funds between wallets
  async transfer(fromWalletId: string, toWalletId: string, amount: number, options?: { assetType?: string; description?: string }): Promise<TransferResponse> {
    if (!fromWalletId || !toWalletId) throw new Error('Both fromWalletId and toWalletId are required');
    if (fromWalletId === toWalletId) throw new Error('Cannot transfer to the same wallet');
    if (!Number.isFinite(amount) || amount <= 0) throw new Error('amount must be a positive number');
    return this.client.post<TransferResponse>('/api/wallets/transfer', {
      fromWalletId,
      toWalletId,
      amount,
      ...(options?.assetType ? { assetType: options.assetType } : {}),
      ...(options?.description ? { description: options.description } : {}),
    });
  }
}
