'use client';

import { useState, useEffect, useCallback, useContext } from 'react';
import { TecAuthContext } from '../auth/provider';
import { TecWalletSDK } from './index';
import { TecApiClient } from '../client';
import type { Wallet, WalletBalance, Transaction, TransactionHistoryOptions, PaginatedResponse } from '../types';

interface WalletState {
  wallets: Wallet[];
  primaryBalance: WalletBalance | null;
  isLoading: boolean;
  error: string | null;
}

export const useTecWallet = () => {
  const authContext = useContext(TecAuthContext);
  if (!authContext) {
    throw new Error('useTecWallet must be used within <TecAuthProvider>');
  }

  const [walletSDK] = useState(() => {
    // Access the client from auth context's sdk
    const config = { apiUrl: '', appName: '' }; // Will be overridden
    return new TecWalletSDK(new TecApiClient(config));
  });

  const [state, setState] = useState<WalletState>({
    wallets: [],
    primaryBalance: null,
    isLoading: false,
    error: null,
  });

  const fetchWallets = useCallback(async () => {
    if (!authContext.isAuthenticated) return;
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const wallets = await walletSDK.getWallets();
      const primaryBalance = await walletSDK.getPrimaryBalance();
      setState({ wallets, primaryBalance, isLoading: false, error: null });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch wallets';
      setState(prev => ({ ...prev, isLoading: false, error: message }));
    }
  }, [authContext.isAuthenticated, walletSDK]);

  const getTransactions = useCallback(async (walletId: string, options?: TransactionHistoryOptions): Promise<PaginatedResponse<Transaction>> => {
    return walletSDK.getTransactions(walletId, options);
  }, [walletSDK]);

  useEffect(() => {
    fetchWallets();
  }, [fetchWallets]);

  return {
    ...state,
    fetchWallets,
    getTransactions,
    balance: state.primaryBalance?.balance ?? 0,
    currency: state.primaryBalance?.currency ?? 'PI',
  };
};
