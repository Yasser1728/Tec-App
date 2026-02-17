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
    // Load stored user immediately
    const stored = getStoredUser();
    const piDetected = isPiBrowser();
    
    setState(prev => ({
      ...prev,
      user: stored,
      isAuthenticated: !!stored,
      isLoading: !piDetected && !stored, // Keep loading if Pi not detected yet
      isPiBrowserEnv: piDetected,
    }));

    // If Pi SDK not detected yet, poll for it (it loads async)
    if (!piDetected) {
      let attempts = 0;
      const maxAttempts = 25; // 25 * 200ms = 5 seconds max
      
      const interval = setInterval(() => {
        attempts++;
        if (isPiBrowser()) {
          clearInterval(interval);
          setState(prev => ({
            ...prev,
            isPiBrowserEnv: true,
            isLoading: false,
          }));
        } else if (attempts >= maxAttempts) {
          clearInterval(interval);
          setState(prev => ({
            ...prev,
            isLoading: false,
            // isPiBrowserEnv stays false — user is genuinely not in Pi Browser
          }));
        }
      }, 200);

      return () => clearInterval(interval);
    }
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'فشل تسجيل الدخول';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: message,
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
