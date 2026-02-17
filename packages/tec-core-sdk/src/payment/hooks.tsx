'use client';

import { useState, useCallback, useContext } from 'react';
import { TecAuthContext } from '../auth/provider';
import { TecPaymentSDK } from './index';
import { TecApiClient } from '../client';
import { isPiBrowser } from '../utils/pi-browser';
import type { PaymentResult, A2UPaymentRequest } from '../types';

interface PaymentHookState {
  isProcessing: boolean;
  lastPayment: PaymentResult | null;
  error: string | null;
  sdkAvailable: boolean;
}

export const useTecPayment = () => {
  const authContext = useContext(TecAuthContext);
  if (!authContext) {
    throw new Error('useTecPayment must be used within <TecAuthProvider>');
  }

  const [paymentSDK] = useState(() => {
    const config = { apiUrl: '', appName: '' };
    return new TecPaymentSDK(new TecApiClient(config));
  });

  const [state, setState] = useState<PaymentHookState>({
    isProcessing: false,
    lastPayment: null,
    error: null,
    sdkAvailable: isPiBrowser(),
  });

  const payPi = useCallback(async (amount: number, memo: string = 'TEC Payment', metadata: Record<string, unknown> = {}) => {
    setState(prev => ({ ...prev, isProcessing: true, error: null }));
    try {
      const result = await paymentSDK.createU2APayment(amount, memo, metadata);
      setState(prev => ({
        ...prev,
        isProcessing: false,
        lastPayment: result,
        error: null,
      }));
      return result;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Payment failed';
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: message,
      }));
      throw err;
    }
  }, [paymentSDK]);

  const sendPi = useCallback(async (data: A2UPaymentRequest) => {
    setState(prev => ({ ...prev, isProcessing: true, error: null }));
    try {
      const result = await paymentSDK.createA2UPayment(data);
      setState(prev => ({
        ...prev,
        isProcessing: false,
        lastPayment: result,
        error: null,
      }));
      return result;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Payment failed';
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: message,
      }));
      throw err;
    }
  }, [paymentSDK]);

  const testSDK = useCallback(() => {
    const available = paymentSDK.testSDK();
    setState(prev => ({ ...prev, sdkAvailable: available }));
    return available;
  }, [paymentSDK]);

  const resetPayment = useCallback(() => {
    setState(prev => ({ ...prev, lastPayment: null, error: null }));
  }, []);

  return { ...state, payPi, sendPi, testSDK, resetPayment };
};
