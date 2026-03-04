'use client';

import { useState, useEffect, useCallback, useContext } from 'react';
import { TecAuthContext } from '../auth/provider';
import { TecWalletSDK } from './index';
import type { Wallet, WalletBalance, TransactionHistoryOptions } from '../types';
import type { WalletTransactionsResponse } from './index';

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

  const [walletSDK] = useState(() => new TecWalletSDK(authContext.client));

  const [state, setState] = useState<WalletState>({
    wallets: [],
    primaryBalance: null,
    isLoading: false,
    error: null,
  });

  const fetchWallets = useCallback(async () => {
    if (!authContext.isAuthenticated || !authContext.user) return;
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await walletSDK.getWallets(authContext.user.id);
      const wallets = response.data.wallets;
      const primary = wallets.find(w => w.is_primary);
      let primaryBalance: WalletBalance | null = null;
      if (primary) {
        const balanceResponse = await walletSDK.getBalance(primary.id);
        primaryBalance = balanceResponse.data.wallet;
      }
      setState({ wallets, primaryBalance, isLoading: false, error: null });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch wallets';
      setState(prev => ({ ...prev, isLoading: false, error: message }));
    }
  }, [authContext.isAuthenticated, authContext.user, walletSDK]);

  const getTransactions = useCallback(async (walletId: string, options?: TransactionHistoryOptions): Promise<WalletTransactionsResponse> => {
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
