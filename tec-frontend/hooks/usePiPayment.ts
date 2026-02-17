'use client';

import { useState, useCallback } from 'react';
import { createU2APayment, testPiSDK, PaymentResult } from '@/lib/pi/pi-payment';
import { isPiBrowser } from '@/lib/pi/pi-auth';

interface PaymentState {
  isProcessing: boolean;
  lastPayment: PaymentResult | null;
  error: string | null;
  sdkAvailable: boolean;
}

export const usePiPayment = () => {
  const [state, setState] = useState<PaymentState>({
    isProcessing: false,
    lastPayment: null,
    error: null,
    sdkAvailable: isPiBrowser(),
  });

  const payDemoPi = useCallback(async (amount: number = 1) => {
    setState(prev => ({ ...prev, isProcessing: true, error: null }));
    try {
      const result = await createU2APayment(amount, `TEC Demo Payment - ${amount} Pi`, { type: 'demo' });
      setState(prev => ({
        ...prev,
        isProcessing: false,
        lastPayment: result,
        error: null,
      }));
      return result;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'فشل الدفع';
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: message,
      }));
      throw err;
    }
  }, []);

  const testSDK = useCallback(() => {
    const available = testPiSDK();
    setState(prev => ({ ...prev, sdkAvailable: available }));
    return available;
  }, []);

  const resetPayment = useCallback(() => {
    setState(prev => ({ ...prev, lastPayment: null, error: null }));
  }, []);

  return { ...state, payDemoPi, testSDK, resetPayment };
};
