'use client';

import { useState } from 'react';
import { PiPaymentCallbacks, PaymentStatus } from '@/types/pi';

type AuthStatus = 'idle' | 'connecting' | 'authenticated' | 'auth_failed';

interface PiPaymentButtonProps {
  amount: number;
  memo: string;
  onSuccess?: (txid: string) => void;
  onError?: (errorMessage: string) => void;
}

// Handle incomplete payments from previous sessions
const onIncompletePaymentFound = (payment: unknown) => {
  console.warn('Incomplete payment found during connect:', payment);
};

export default function PiPaymentButton({
  amount,
  memo,
  onSuccess,
  onError,
}: PiPaymentButtonProps) {
  const [status, setStatus] = useState<PaymentStatus | 'idle'>('idle');
  const [authStatus, setAuthStatus] = useState<AuthStatus>('idle');
  const [userId, setUserId] = useState<string | null>(null);

  const handlePiConnect = async () => {
    try {
      setAuthStatus('connecting');

      if (typeof window === 'undefined' || !(window as any).Pi) {
        throw new Error('Pi Network SDK is not loaded.');
      }

      const scopes = ['payments', 'username'];
      const authResult = await (window as any).Pi.authenticate(scopes, onIncompletePaymentFound);

      console.log('Pi Auth Result:', authResult);

      // Send to our Next.js auth route which proxies to the backend
      const res = await fetch('/api/auth/pi-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authResult }),
      });

      const data = await res.json();

      // Support both { token, user } and { tokens: { accessToken }, data: { user } } response shapes
      const token = data.token ?? data.tokens?.accessToken ?? data.data?.tokens?.accessToken;
      const user = data.user ?? data.data?.user;

      if (token && user) {
        try {
          localStorage.setItem('tec_token', token);
          localStorage.setItem('tec_user', JSON.stringify(user));
        } catch (err) {
          console.error('Failed to save auth data to localStorage:', err);
          setAuthStatus('auth_failed');
          if (onError)
            onError('Failed to save session. Please disable private browsing mode and try again.');
          return;
        }
        // user.id is from the existing backend format; user.piId is a normalised alias
        setUserId(user.id ?? user.piId ?? null);
        setAuthStatus('authenticated');
      } else {
        throw new Error(data.error || 'Authentication failed: no token received');
      }
    } catch (error: any) {
      console.error('Pi Auth Error:', error);
      setAuthStatus('auth_failed');
      if (onError) onError(error.message || 'Pi authentication failed');
    }
  };

  const handlePayment = async () => {
    try {
      setStatus('pending');

      if (typeof window === 'undefined' || !(window as any).Pi) {
        throw new Error('Pi Network SDK is not loaded.');
      }

      const Pi = (window as any).Pi;

      const callbacks: PiPaymentCallbacks = {
        onReadyForServerApproval: async (paymentId) => {
          console.log('Ready for server approval:', paymentId);
          try {
            const res = await fetch('/api/payment/approve', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ paymentId, amount, userId }),
            });
            if (!res.ok) throw new Error('Approval failed on server');
          } catch (err) {
            console.error(err);
            setStatus('failed');
            if (onError) onError('Server approval failed');
          }
        },
        onReadyForServerCompletion: async (paymentId, txid) => {
          console.log('Ready for server completion:', paymentId, txid);
          try {
            const res = await fetch('/api/payment/complete', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ paymentId, txid }),
            });
            if (!res.ok) throw new Error('Completion failed on server');

            setStatus('success');
            if (onSuccess) onSuccess(txid);
          } catch (err) {
            console.error(err);
            setStatus('failed');
            if (onError) onError('Server completion failed');
          }
        },
        onCancel: (paymentId) => {
          console.log('Payment cancelled:', paymentId);
          setStatus('cancelled');
          if (onError) onError('Payment was cancelled by the user.');
        },
        onError: (error, payment) => {
          console.error('Payment error:', error, payment);
          setStatus('failed');
          if (onError) onError(error.message);
        },
      };

      await Pi.createPayment(
        {
          amount,
          memo,
          metadata: { orderId: '12345' },
        },
        callbacks
      );
    } catch (error: any) {
      setStatus('failed');
      if (onError) onError(error.message || 'An unexpected error occurred.');
    }
  };

  if (authStatus !== 'authenticated') {
    return (
      <button
        onClick={handlePiConnect}
        disabled={authStatus === 'connecting'}
        className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded flex items-center justify-center transition-colors disabled:opacity-50"
      >
        {authStatus === 'connecting' ? (
          <span className="animate-pulse">Connecting...</span>
        ) : authStatus === 'auth_failed' ? (
          <span>Retry Connect with Pi</span>
        ) : (
          <span>Connect with Pi</span>
        )}
      </button>
    );
  }

  return (
    <button
      onClick={handlePayment}
      disabled={status === 'pending'}
      className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded flex items-center justify-center transition-colors disabled:opacity-50"
    >
      {status === 'pending' ? (
        <span className="animate-pulse">Processing...</span>
      ) : (
        <span>Pay {amount} Pi</span>
      )}
    </button>
  );
}
