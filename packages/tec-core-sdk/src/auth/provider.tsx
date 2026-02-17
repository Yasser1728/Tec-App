'use client';

import { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { TecAuthSDK } from './index';
import { TecApiClient } from '../client';
import { isPiBrowser } from '../utils/pi-browser';
import type { TecUser, TecAuthResponse, TecSDKConfig } from '../types';

export interface TecAuthContextValue {
  user: TecUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isNewUser: boolean;
  error: string | null;
  isPiBrowserEnv: boolean;
  login: () => Promise<TecAuthResponse>;
  logout: () => void;
  sdk: TecAuthSDK;
}

export const TecAuthContext = createContext<TecAuthContextValue | undefined>(undefined);

interface TecAuthProviderProps {
  children: ReactNode;
  config: TecSDKConfig;
}

export function TecAuthProvider({ children, config }: TecAuthProviderProps) {
  const [client] = useState(() => new TecApiClient(config));
  const [authSDK] = useState(() => new TecAuthSDK(client));

  const [state, setState] = useState({
    user: null as TecUser | null,
    isLoading: true,
    isAuthenticated: false,
    isNewUser: false,
    error: null as string | null,
    isPiBrowserEnv: false,
  });

  useEffect(() => {
    const stored = authSDK.getStoredUser();
    setState(prev => ({
      ...prev,
      user: stored,
      isAuthenticated: !!stored,
      isLoading: false,
      isPiBrowserEnv: isPiBrowser(),
    }));
  }, [authSDK]);

  const login = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const result = await authSDK.loginWithPi();
      setState(prev => ({
        ...prev,
        user: result.user,
        isAuthenticated: true,
        isNewUser: result.isNewUser,
        isLoading: false,
        error: null,
      }));
      return result;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Authentication failed';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: message,
      }));
      throw err;
    }
  }, [authSDK]);

  const logout = useCallback(() => {
    authSDK.logout();
    setState(prev => ({
      ...prev,
      user: null,
      isAuthenticated: false,
      isNewUser: false,
    }));
  }, [authSDK]);

  const value: TecAuthContextValue = {
    ...state,
    login,
    logout,
    sdk: authSDK,
  };

  return <TecAuthContext.Provider value={value}>{children}</TecAuthContext.Provider>;
}
