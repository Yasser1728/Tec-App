'use client';

import { useState, useEffect, useCallback } from 'react';
import { loginWithPi, getStoredUser, logout as piLogout, isPiBrowser } from '@/lib/pi/pi-auth';
import { TecUser } from '@/types/pi.types';

interface AuthState {
  user: TecUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isNewUser: boolean;
  error: string | null;
  isPiBrowserEnv: boolean;
}

export const usePiAuth = () => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    isNewUser: false,
    error: null,
    isPiBrowserEnv: false,
  });

  useEffect(() => {
    const stored = getStoredUser();
    setState(prev => ({
      ...prev,
      user: stored,
      isAuthenticated: !!stored,
      isLoading: false,
      isPiBrowserEnv: isPiBrowser(),
    }));
  }, []);

  const login = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const result = await loginWithPi();
      setState(prev => ({
        ...prev,
        user: result.user,
        isAuthenticated: true,
        isNewUser: result.isNewUser,
        isLoading: false,
        error: null,
      }));
      return result;
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err.message || 'فشل تسجيل الدخول',
      }));
      throw err;
    }
  }, []);

  const logout = useCallback(() => {
    piLogout();
    setState(prev => ({
      ...prev,
      user: null,
      isAuthenticated: false,
      isNewUser: false,
    }));
  }, []);

  return { ...state, login, logout };
};
