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
  errorType: 'not_pi_browser' | 'auth_failed' | 'timeout' | 'storage' | null;
  isPiBrowserEnv: boolean;
}

export const usePiAuth = () => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    isNewUser: false,
    error: null,
    errorType: null,
    isPiBrowserEnv: false,
  });

  useEffect(() => {
    // Load stored user immediately
    const stored = getStoredUser();
    const piDetected = isPiBrowser();
    
    // Check if Pi SDK is already ready (event may have fired before component mounted)
    const piAlreadyReady = typeof window !== 'undefined' && (window as any).__TEC_PI_READY;
    
    setState(prev => ({
      ...prev,
      user: stored,
      isAuthenticated: !!stored,
      isLoading: !piDetected && !stored && !piAlreadyReady, // Keep loading if Pi not detected yet and no stored user
      isPiBrowserEnv: piDetected || piAlreadyReady,
    }));

    // If Pi SDK not detected yet and no stored user, listen for events and poll as fallback
    // Skip if user is already authenticated - they don't need Pi SDK for initial load
    if (!piDetected && !stored && !piAlreadyReady) {
      let eventHandled = false;
      
      // Event-based approach (preferred)
      const handlePiSdkReady = () => {
        console.log('[TEC usePiAuth] Pi SDK ready event received');
        eventHandled = true;
        setState(prev => ({
          ...prev,
          isPiBrowserEnv: true,
          isLoading: false,
        }));
      };
      
      const handlePiSdkError = () => {
        console.error('[TEC usePiAuth] Pi SDK error event received');
        eventHandled = true;
        setState(prev => ({
          ...prev,
          isLoading: false,
          isPiBrowserEnv: false,
        }));
      };
      
      window.addEventListener('tec-pi-ready', handlePiSdkReady);
      window.addEventListener('tec-pi-error', handlePiSdkError);
      
      // Polling as fallback (in case events are missed)
      let attempts = 0;
      const maxAttempts = 25; // 25 * 200ms = 5 seconds max
      
      const interval = setInterval(() => {
        if (eventHandled) {
          clearInterval(interval);
          return;
        }
        
        attempts++;
        if (isPiBrowser()) {
          console.log('[TEC usePiAuth] Pi SDK detected via polling');
          clearInterval(interval);
          setState(prev => ({
            ...prev,
            isPiBrowserEnv: true,
            isLoading: false,
          }));
        } else if (attempts >= maxAttempts) {
          console.log('[TEC usePiAuth] Max polling attempts reached');
          clearInterval(interval);
          setState(prev => ({
            ...prev,
            isLoading: false,
            // isPiBrowserEnv stays false — user is genuinely not in Pi Browser
          }));
        }
      }, 200);

      return () => {
        clearInterval(interval);
        window.removeEventListener('tec-pi-ready', handlePiSdkReady);
        window.removeEventListener('tec-pi-error', handlePiSdkError);
      };
    }
  }, []);

  const login = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null, errorType: null }));
    try {
      const result = await loginWithPi();
      setState(prev => ({
        ...prev,
        user: result.user,
        isAuthenticated: true,
        isNewUser: result.isNewUser,
        isLoading: false,
        error: null,
        errorType: null,
      }));
      return result;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'فشل تسجيل الدخول';
      
      // Determine error type based on error message
      let errorType: AuthState['errorType'] = 'auth_failed';
      if (message.includes('Pi Browser') || message.includes('متصفح Pi')) {
        errorType = 'not_pi_browser';
      } else if (message.includes('timed out') || message.includes('انتهت مهلة')) {
        errorType = 'timeout';
      } else if (message.includes('localStorage') || message.includes('بيانات المصادقة')) {
        errorType = 'storage';
      }
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: message,
        errorType,
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
      error: null,
      errorType: null,
    }));
  }, []);

  return { ...state, login, logout };
};
