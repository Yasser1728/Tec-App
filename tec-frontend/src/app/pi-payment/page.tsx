'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredUser, getAccessToken } from '@/lib-client/pi/pi-auth';
import { createA2UPayment } from '@/lib-client/pi/pi-payment';
import type { TecUser } from '@/types/pi.types';

// Build-time env checks
const isSandboxMode = process.env.NEXT_PUBLIC_PI_SANDBOX === 'true';

export default function PiPaymentPage() {
  const router = useRouter();
  const [user, setUser] = useState<TecUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState<number | string>('...');
  const [statusMsg, setStatusMsg] = useState<{ text: string; isError: boolean } | null>(null);
  const [a2uMsg, setA2uMsg] = useState<{ text: string; isError: boolean } | null>(null);

  // ── Helpers ────────────────────────────────────────────────────────────────

  const setError = (text: string) => setStatusMsg({ text, isError: true });
  const setInfo = (text: string) => setStatusMsg({ text, isError: false });
  const clearStatus = () => setStatusMsg(null);

  const fetchBalance = useCallback(async (userId: string) => {
    try {
      const res = await fetch(`/api/wallet/balance?userId=${userId}`);
      const data = await res.json();
      setBalance(data?.balance ?? 0);
    } catch {
      setBalance(0);
    }
  }, []);

  // Load user from stored session on mount; redirect to home if not authenticated
  useEffect(() => {
    const stored = getStoredUser();
    if (!stored) {
      router.replace('/');
      return;
    }
    setUser(stored);
    fetchBalance(stored.id);
  }, [router, fetchBalance]);

  // ── Pay 1 Pi ──────────────────────────────────────────────────────────────

  const handlePayment = useCallback(async () => {
    if (!user) return;

    const token = getAccessToken();
    if (!token) {
      setError(
        'Session expired. Please reconnect your wallet. / انتهت الجلسة، يرجى إعادة الاتصال.'
      );
      return;
    }

    try {
      setLoading(true);
      setInfo('Processing payment... / جاري معالجة الدفع...');

      // Create an internal payment record first
      const createRes = await fetch('/api/payment/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: user.id,
          amount: 1,
          currency: 'PI',
          payment_method: 'pi',
          metadata: { piUserId: user.piId },
        }),
      });

      if (!createRes.ok) {
        const err = await createRes.json().catch(() => ({}));
        throw new Error(err?.error?.message || 'Failed to initiate payment / فشل بدء عملية الدفع');
      }

      const createData = await createRes.json();
      const internalPaymentId: string = createData?.data?.payment?.id ?? createData?.data?.id;

      if (!internalPaymentId) {
        throw new Error('Invalid payment response from server / استجابة غير صالحة من الخادم');
      }

      // Open Pi Network payment dialog
      // @ts-ignore – window.Pi is injected by the Pi Browser SDK
      window.Pi.createPayment(
        {
          amount: 1,
          memo: 'Purchase 0.1 TEC',
          metadata: { internalPaymentId },
        },
        {
          onReadyForServerApproval: async (piPaymentId: string) => {
            try {
              const approveRes = await fetch('/api/payment/approve', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  payment_id: internalPaymentId,
                  pi_payment_id: piPaymentId,
                }),
              });
              if (!approveRes.ok) {
                const err = await approveRes.json().catch(() => ({}));
                console.error('[TEC Payment] Approval failed:', err);
              }
            } catch (err) {
              console.error('[TEC Payment] Approval request error:', err);
            }
          },

          onReadyForServerCompletion: async (piPaymentId: string, txid: string) => {
            try {
              const completeRes = await fetch('/api/payment/complete', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  payment_id: internalPaymentId,
                  transaction_id: txid,
                }),
              });

              if (completeRes.ok) {
                setInfo('✅ Payment successful! Balance updated. / تمت عملية الدفع بنجاح!');
                setTimeout(() => fetchBalance(user.id), 2000);
              } else {
                const err = await completeRes.json().catch(() => ({}));
                console.error('[TEC Payment] Completion failed:', err);
                setError(
                  'Payment completion failed. Please contact support. / فشل إتمام الدفع، تواصل مع الدعم.'
                );
              }
            } catch (err) {
              console.error('[TEC Payment] Completion request error:', err);
              setError(
                'Network error during payment completion. / خطأ في الشبكة أثناء إتمام الدفع.'
              );
            } finally {
              setLoading(false);
            }
          },

          onCancel: (_piPaymentId: string) => {
            setError('Payment cancelled. / تم إلغاء الدفع.');
            setLoading(false);
          },

          onError: (error: Error) => {
            console.error('[TEC Payment] Pi SDK error:', error);
            setError('Payment error. Please try again. / حدث خطأ، يرجى المحاولة مرة أخرى.');
            setLoading(false);
          },
        }
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Payment failed / فشل الدفع';
      setError(message);
      setLoading(false);
    }
  }, [user, fetchBalance]);

  // ── A2U: Receive Test-Pi ───────────────────────────────────────────────────

  const handleA2U = useCallback(async () => {
    if (!user) return;
    setA2uMsg(null);

    if (isSandboxMode) {
      setA2uMsg({ text: 'ℹ️ A2U is not available in Sandbox mode yet.', isError: false });
      return;
    }

    const token = getAccessToken();
    if (!token) {
      setA2uMsg({ text: 'Session expired. Please reconnect. / انتهت الجلسة.', isError: true });
      return;
    }

    try {
      setA2uMsg({ text: 'Processing A2U payment… / جاري معالجة الدفعة...', isError: false });
      await createA2UPayment({
        recipientUid: user.piId,
        amount: 0.1,
        memo: 'TEC A2U reward',
        metadata: { userId: user.id },
      });
      setA2uMsg({ text: '✅ A2U payment sent! / تم إرسال الدفعة!', isError: false });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'A2U payment failed / فشل الدفع';
      setA2uMsg({ text: msg, isError: true });
    }
  }, [user]);

  // ── Render ─────────────────────────────────────────────────────────────────

  if (!user) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--black)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ color: 'var(--gold)', fontSize: '1.2rem' }}>Loading…</div>
      </div>
    );
  }

  const combinedStatus = statusMsg ?? a2uMsg;

  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'var(--black)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        position: 'relative',
      }}
    >
      {/* Background orbs matching home page */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-200px',
            right: '-100px',
            width: '600px',
            height: '600px',
            background: 'radial-gradient(circle, rgba(201,168,76,0.08) 0%, transparent 70%)',
            borderRadius: '50%',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-200px',
            left: '-100px',
            width: '500px',
            height: '500px',
            background: 'radial-gradient(circle, rgba(201,168,76,0.05) 0%, transparent 70%)',
            borderRadius: '50%',
          }}
        />
      </div>

      {/* Card */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          maxWidth: '480px',
          background: 'var(--surface)',
          border: '1px solid rgba(201,168,76,0.2)',
          borderRadius: '20px',
          padding: '40px 32px',
          boxShadow: '0 0 60px rgba(201,168,76,0.06)',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center' }}>
          <h1
            className="gold-text"
            style={{
              fontFamily: 'var(--font-cormorant), Cormorant Garamond, serif',
              fontSize: 'clamp(28px, 6vw, 40px)',
              marginBottom: '8px',
              lineHeight: 1.2,
            }}
          >
            Welcome, @{user.piUsername}!
          </h1>
          <p
            style={{
              fontSize: '12px',
              color: 'var(--muted)',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }}
          >
            Pi Network · TEC Dashboard
          </p>
        </div>

        {/* User info */}
        <div
          style={{
            background: 'rgba(201,168,76,0.04)',
            border: '1px solid rgba(201,168,76,0.12)',
            borderRadius: '12px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div>
            <p
              style={{
                fontSize: '10px',
                color: 'var(--muted)',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                marginBottom: '4px',
              }}
            >
              User ID (UID)
            </p>
            <p
              style={{
                fontSize: '12px',
                color: 'var(--white)',
                fontFamily: 'monospace',
                wordBreak: 'break-all',
                lineHeight: 1.6,
              }}
            >
              {user.piId}
            </p>
          </div>

          {user.role && (
            <div>
              <p
                style={{
                  fontSize: '10px',
                  color: 'var(--muted)',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  marginBottom: '4px',
                }}
              >
                Roles
              </p>
              <span
                style={{
                  display: 'inline-block',
                  background: 'rgba(201,168,76,0.12)',
                  border: '1px solid rgba(201,168,76,0.25)',
                  borderRadius: '6px',
                  padding: '3px 10px',
                  fontSize: '12px',
                  color: 'var(--gold)',
                  letterSpacing: '0.05em',
                  textTransform: 'capitalize',
                }}
              >
                {user.role}
              </span>
            </div>
          )}

          <div>
            <p
              style={{
                fontSize: '10px',
                color: 'var(--muted)',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                marginBottom: '4px',
              }}
            >
              TEC Balance
            </p>
            <p
              style={{
                fontFamily: 'var(--font-cormorant), Cormorant Garamond, serif',
                fontSize: '28px',
                color: 'var(--gold)',
              }}
            >
              {balance} <span style={{ fontSize: '14px', color: 'var(--muted)' }}>TEC</span>
            </p>
          </div>
        </div>

        {/* Pay 1 Pi button */}
        <button
          onClick={handlePayment}
          disabled={loading}
          style={{
            width: '100%',
            padding: '18px 24px',
            background: loading
              ? 'rgba(22,163,74,0.4)'
              : 'linear-gradient(135deg, #16a34a, #15803d)',
            border: '1px solid rgba(22,163,74,0.4)',
            borderRadius: '14px',
            color: '#fff',
            fontSize: '18px',
            fontWeight: '700',
            letterSpacing: '0.05em',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            boxShadow: loading ? 'none' : '0 4px 20px rgba(22,163,74,0.3)',
          }}
        >
          {loading ? (
            <>
              <svg
                className="animate-spin"
                style={{ width: '20px', height: '20px' }}
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <circle
                  style={{ opacity: 0.25 }}
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  style={{ opacity: 0.75 }}
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              <span>Processing...</span>
            </>
          ) : (
            <>
              <span style={{ fontSize: '22px', fontFamily: 'serif' }}>π</span>
              <span>Pay 1 Pi (Test)</span>
            </>
          )}
        </button>

        {/* Receive A2U button */}
        <button
          onClick={handleA2U}
          disabled={loading}
          style={{
            width: '100%',
            padding: '18px 24px',
            background: 'linear-gradient(135deg, #1d4ed8, #1e40af)',
            border: '1px solid rgba(59,130,246,0.4)',
            borderRadius: '14px',
            color: '#fff',
            fontSize: '18px',
            fontWeight: '700',
            letterSpacing: '0.05em',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            boxShadow: '0 4px 20px rgba(29,78,216,0.3)',
          }}
        >
          <span style={{ fontSize: '22px', fontFamily: 'serif' }}>π</span>
          <span>Receive 0.1 Test-Pi (A2U)</span>
        </button>

        {/* Status message */}
        {combinedStatus && (
          <div
            style={{
              padding: '14px 18px',
              background: combinedStatus.isError ? 'rgba(231,76,60,0.1)' : 'rgba(46,204,113,0.1)',
              border: `1px solid ${combinedStatus.isError ? 'rgba(231,76,60,0.3)' : 'rgba(46,204,113,0.3)'}`,
              borderRadius: '10px',
              color: combinedStatus.isError ? '#e74c3c' : '#2ecc71',
              fontSize: '13px',
              fontWeight: '500',
              lineHeight: 1.6,
              textAlign: 'center',
              whiteSpace: 'pre-line',
            }}
          >
            {combinedStatus.text}
          </div>
        )}

        {/* Back button */}
        <button
          onClick={() => router.push('/')}
          style={{
            background: 'none',
            border: '1px solid rgba(201,168,76,0.2)',
            borderRadius: '10px',
            color: 'var(--muted)',
            fontSize: '13px',
            padding: '10px',
            cursor: 'pointer',
            transition: 'color 0.2s',
            letterSpacing: '0.05em',
          }}
        >
          ← Back to Home
        </button>
      </div>
    </main>
  );
}
