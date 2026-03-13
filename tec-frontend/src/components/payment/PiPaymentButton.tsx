'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { loginWithPi, getAccessToken } from '@/lib-client/pi/pi-auth';
import { createA2UPayment } from '@/lib-client/pi/pi-payment';
import type { TecUser } from '@/types/pi.types';

// Build-time env checks (NEXT_PUBLIC_* are inlined at compile time)
const isSandboxMode = process.env.NEXT_PUBLIC_PI_SANDBOX === 'true';
const appId = process.env.NEXT_PUBLIC_PI_APP_ID;
const gatewayUrl = process.env.NEXT_PUBLIC_API_GATEWAY_URL;
const missingEnvVars = isSandboxMode && (!appId || !gatewayUrl);

export default function PiPaymentButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<TecUser | null>(null);
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

  // ── Step 0: Authenticate with Pi and TEC backend ───────────────────────────

  const handleAuth = async () => {
    try {
      setLoading(true);
      clearStatus();

      const authData = await loginWithPi();

      setUser(authData.user);
      fetchBalance(authData.user.id);
      router.push('/pi-payment');
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Authentication failed / فشل تسجيل الدخول';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // ── Step 1: Create internal payment record, then open Pi payment dialog ────

  const handlePayment = useCallback(async () => {
    if (!user) return;

    const token = getAccessToken();
    if (!token) {
      setError(
        'Session expired. Please reconnect your wallet. / انتهت الجلسة، يرجى إعادة الاتصال.'
      );
      setUser(null);
      setBalance('...');
      return;
    }

    try {
      setLoading(true);
      setInfo('Processing payment... / جاري معالجة الدفع...');

      // Create an internal payment record first to get a backend UUID
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
          // ── Approval callback (Step 2) ────────────────────────────────────
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

          // ── Completion callback (Step 3) ──────────────────────────────────
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
                setInfo('Payment successful! Balance updated. / تمت عملية الدفع بنجاح!');
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

  // ── A2U: App-to-User payment ───────────────────────────────────────────────

  const handleA2U = useCallback(async () => {
    if (!user) return;
    setA2uMsg(null);

    // In Sandbox mode the A2U endpoint is not yet available
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
        amount: 0.001,
        memo: 'TEC A2U reward',
        metadata: { userId: user.id },
      });
      setA2uMsg({ text: 'A2U payment sent! / تم إرسال الدفعة!', isError: false });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'A2U payment failed / فشل الدفع';
      setA2uMsg({ text: msg, isError: true });
    }
  }, [user]);

  // ── Render ─────────────────────────────────────────────────────────────────

  // Startup diagnostics: missing required env vars in Sandbox mode
  if (missingEnvVars) {
    const missing: string[] = [];
    if (!appId) missing.push('NEXT_PUBLIC_PI_APP_ID');
    if (!gatewayUrl) missing.push('NEXT_PUBLIC_API_GATEWAY_URL');
    return (
      <div className="w-full max-w-md mx-auto text-center p-4">
        <div className="rounded-2xl border border-yellow-500/40 bg-yellow-500/10 p-4 text-sm text-yellow-300 text-left">
          <p className="font-semibold mb-2">⚠️ Sandbox configuration incomplete</p>
          <p className="mb-1">The following required environment variables are not set:</p>
          <ul className="list-disc list-inside mb-2">
            {missing.map((v) => (
              <li key={v}>
                <code>{v}</code>
              </li>
            ))}
          </ul>
          <p className="text-yellow-400/70 text-xs">
            Add these variables to your production environment configuration and redeploy. Connect
            and Pay actions are disabled until they are set.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        {!user ? (
          <>
            {/* Sign in with Pi — TEC gold/dark design */}
            <button
              onClick={handleAuth}
              disabled={loading}
              className="
                w-full
                bg-gradient-to-b from-[#d4af37] to-[#b8882a]
                hover:brightness-110
                disabled:opacity-50 disabled:cursor-not-allowed
                text-[#1a1208] font-bold
                py-6 px-10 rounded-xl
                transition duration-200
                shadow-xl hover:shadow-2xl
                text-2xl tracking-widest uppercase
                border-2 border-[#e8d5a3]/40
                min-w-[340px]
              "
            >
              {/* Button content */}
              <span className="flex items-center justify-center gap-3">
                {loading ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5 text-[#1a1208]"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <span className="text-3xl font-serif leading-none">π</span>
                    <span>SIGN IN WITH PI</span>
                  </>
                )}
              </span>
            </button>

            {/* Error / info message */}
            {statusMsg && (
              <p
                className={`mt-4 text-sm font-medium leading-relaxed whitespace-pre-line ${
                  statusMsg.isError ? 'text-red-400' : 'text-[#d4af37]'
                }`}
              >
                {statusMsg.text}
              </p>
            )}
          </>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Welcome message */}
            <p className="text-[#d4af37] font-semibold text-lg tracking-wide">
              Welcome, @{user.piUsername}!
            </p>

            {/* User info card */}
            <div className="bg-gray-900/60 p-4 rounded-2xl text-sm text-left border border-[#d4af37]/20 backdrop-blur-sm">
              <p className="text-gray-400 mb-2">
                <span className="text-gray-200 font-medium">User ID: </span>
                <span className="text-xs break-all text-gray-400">{user.id}</span>
              </p>
              <p className="text-gray-400">
                <span className="text-gray-200 font-medium">TEC Balance: </span>
                <span className="font-bold text-lg text-[#d4af37] ml-1">{balance} TEC</span>
              </p>
            </div>

            {/* Pay button */}
            <button
              onClick={handlePayment}
              disabled={loading}
              className="
                w-full relative overflow-hidden
                bg-gradient-to-r from-[#0a1f0f] via-[#0f2e16] to-[#0a1f0f]
                hover:from-[#0f2e16] hover:via-[#174021] hover:to-[#0f2e16]
                disabled:opacity-50 disabled:cursor-not-allowed
                text-emerald-400 font-semibold
                py-4 px-6 rounded-2xl
                transition-all duration-300
                shadow-[0_0_20px_rgba(52,211,153,0.1)]
                hover:shadow-[0_0_30px_rgba(52,211,153,0.25)]
                border border-emerald-500/30 hover:border-emerald-500/60
                text-base tracking-widest uppercase
                group
              "
            >
              <span
                className="
                  absolute inset-0
                  bg-gradient-to-r from-transparent via-emerald-400/8 to-transparent
                  translate-x-[-100%] group-hover:translate-x-[100%]
                  transition-transform duration-700
                "
              />
              <span className="relative flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>Pay 1 π = 0.1 TEC</span>
                )}
              </span>
            </button>

            {/* A2U button */}
            <button
              onClick={handleA2U}
              className="
                w-full relative overflow-hidden
                bg-gradient-to-r from-[#0a0f1f] via-[#0e1530] to-[#0a0f1f]
                hover:from-[#0e1530] hover:via-[#152045] hover:to-[#0e1530]
                text-blue-400 font-semibold
                py-4 px-6 rounded-2xl
                transition-all duration-300
                shadow-[0_0_20px_rgba(96,165,250,0.1)]
                hover:shadow-[0_0_30px_rgba(96,165,250,0.25)]
                border border-blue-500/30 hover:border-blue-500/60
                text-base tracking-widest uppercase
                group
              "
            >
              <span
                className="
                  absolute inset-0
                  bg-gradient-to-r from-transparent via-blue-400/8 to-transparent
                  translate-x-[-100%] group-hover:translate-x-[100%]
                  transition-transform duration-700
                "
              />
              <span className="relative flex items-center justify-center gap-2">
                <span className="text-xl font-serif leading-none">π</span>
                <span>A2U Transfer</span>
              </span>
            </button>

            {/* A2U status message */}
            {a2uMsg && (
              <p
                className={`text-sm font-medium leading-relaxed whitespace-pre-line ${
                  a2uMsg.isError ? 'text-red-400' : 'text-blue-400'
                }`}
              >
                {a2uMsg.text}
              </p>
            )}

            {/* Status message */}
            {statusMsg && (
              <p
                className={`mt-2 text-sm font-medium leading-relaxed whitespace-pre-line ${
                  statusMsg.isError ? 'text-red-400' : 'text-emerald-400'
                }`}
              >
                {statusMsg.text}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
