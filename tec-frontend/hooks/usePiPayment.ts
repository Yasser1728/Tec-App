'use client';

import { useState, useCallback } from 'react';
import { testPiSdk, createAppToUserPayment, PaymentResult } from '@/lib/pi/pi-payment';

interface PaymentState {
  isLoading: boolean;
  result: PaymentResult | null;
  error: string | null;
}

export const usePiPayment = () => {
  const [state, setState] = useState<PaymentState>({
    isLoading: false,
    result: null,
    error: null,
  });

  const testSdk = useCallback(() => {
    const isAvailable = testPiSdk();
    return isAvailable;
  }, []);

  const payDemo = useCallback(async () => {
    setState({ isLoading: true, result: null, error: null });
    
    try {
      const result = await createAppToUserPayment({
        amount: 1,
        memo: 'TEC Demo Payment - 1 Pi',
        metadata: { type: 'demo', app: 'tec' },
      });

      setState({
        isLoading: false,
        result,
        error: result.success ? null : result.error || 'Payment failed',
      });

      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Payment failed';
      setState({
        isLoading: false,
        result: null,
        error: errorMsg,
      });
      throw err;
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      result: null,
      error: null,
    });
  }, []);

  return {
    ...state,
    testSdk,
    payDemo,
    reset,
  };
};
