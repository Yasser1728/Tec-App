"use client";

import { useState, useCallback } from "react";
// نستخدم الدالة الأصلية الخاصة بمشروعك لضمان عدم وجود أخطاء في الـ Backend
import { loginWithPi } from "@/lib-client/pi/pi-auth"; 

export default function PiPaymentButton() {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [balance, setBalance] = useState<number | string>("...");
  const [statusMsg, setStatusMsg] = useState('');

  // 1. جلب الرصيد
  const fetchBalance = async (userId: string) => {
    try {
      const res = await fetch(`/api/wallet/balance?userId=${userId}`);
      if (!res.ok) return setBalance(0);
      const data = await res.json();
      if (data && data.balance !== undefined) {
        setBalance(data.balance);
      } else {
        setBalance(0);
      }
    } catch (err) {
      setBalance(0);
    }
  };

  // 2. تسجيل الدخول
  const handleAuth = async () => {
    try {
      setLoading(true);
      setStatusMsg('');
      
      // نستخدم الدالة الأصلية في مشروعك اللي بتعرف تتعامل مع الـ 400 error
      const authResponse = await loginWithPi();
      
      if (authResponse && authResponse.user) {
        const uid = authResponse.user.piId || authResponse.user.id || authResponse.user.piUid;
        setUser({
          username: authResponse.user.piUsername || authResponse.user.username || 'User',
          uid: uid
        });
        fetchBalance(uid);
      }
    } catch (error: any) {
      console.error("Auth Error:", error);
      setStatusMsg(error.message || 'Failed to authenticate. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // 3. الدفع
  const handlePayment = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      setStatusMsg('Initiating payment...');
      // @ts-ignore
      await window.Pi.createPayment({
        amount: 1,
        memo: "Purchase 0.1 TEC",
        metadata: { userId: user.uid },
      }, {
        onReadyForServerApproval: (paymentId: string) => {
          fetch('/api/payment/approve', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paymentId, amount: 1, userId: user.uid })
          });
        },
        onReadyForServerCompletion: (paymentId: string, txid: string) => {
          fetch('/api/payment/complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paymentId, txid })
          }).then(() => {
            setStatusMsg("Payment successful! Balance updated.");
            setTimeout(() => fetchBalance(user.uid), 2000);
          });
        },
        onCancel: () => setStatusMsg("Payment cancelled."),
        onError: () => setStatusMsg("Payment error occurred."),
      });
    } catch (error) {
      setStatusMsg("Payment failed.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  return (
    <div className="w-full max-w-sm mx-auto my-6 p-4">
      {!user ? (
        <div className="flex flex-col items-center">
          <button
            onClick={handleAuth}
            disabled={loading}
            className="w-full bg-[#1e1e1e] border border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37] hover:text-black font-semibold py-3 px-6 rounded-lg transition-all text-lg tracking-wide disabled:opacity-50"
          >
            {loading ? 'CONNECTING...' : 'CONNECT PI WALLET'}
          </button>
          {statusMsg && (
            <p className="text-red-500 mt-4 text-sm text-center">{statusMsg}</p>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center w-full">
          {/* بيانات المستخدم متناسقة مع تصميم TEC */}
          <div className="w-full bg-[#1e1e1e] border border-[#333] rounded-lg p-5 mb-6">
            <h3 className="text-[#d4af37] font-semibold text-lg mb-4 text-center">
              WELCOME, @{user.username.toUpperCase()}
            </h3>
            
            <div className="flex justify-between items-center mb-2 text-sm">
              <span className="text-gray-400">UID:</span>
              <span className="text-gray-200 ml-2 truncate w-32">{user.uid}</span>
            </div>
            
            <div className="flex justify-between items-center text-sm border-t border-[#333] pt-3 mt-3">
              <span className="text-gray-400">TEC BALANCE:</span>
              <span className="text-[#d4af37] font-bold text-xl">{balance} TEC</span>
            </div>
          </div>

          <button
            onClick={handlePayment}
            disabled={loading}
            className="w-full bg-[#d4af37] hover:bg-[#b89528] text-black font-bold py-3 px-6 rounded-lg transition-all text-lg shadow-lg disabled:opacity-50"
          >
            {loading ? 'PROCESSING...' : 'PAY 1 PI = 0.1 TEC'}
          </button>

          {statusMsg && (
            <p className={`mt-4 text-sm text-center ${statusMsg.includes('successful') ? 'text-green-500' : 'text-gray-400'}`}>
              {statusMsg}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
