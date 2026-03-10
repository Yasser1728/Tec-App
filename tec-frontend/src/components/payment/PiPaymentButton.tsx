"use client";

import { useState, useCallback } from "react";

export default function PiPaymentButton() {
  const [loading, setLoading] = useState(false);
  const [a2uLoading, setA2ULoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [balance, setBalance] = useState<number | string>("...");
  const [statusMsg, setStatusMsg] = useState('');

  const fetchBalance = async (userId: string) => {
    try {
      const res = await fetch(`/api/wallet/balance?userId=${userId}`);
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

  const handleAuth = async () => {
    try {
      setLoading(true);
      setStatusMsg('');
      const scopes = ['payments', 'username'];
      
      // @ts-ignore
      const authResult = await window.Pi.authenticate(scopes, onIncompletePaymentFound);
      
      if (!authResult?.accessToken) {
         throw new Error("لم يتم الحصول على مصادقة من Pi");
      }

      // 💡 الحل الجذري: الاتصال بالباك إند المباشر (Gateway) المرفوع على Railway 
      // بالصيغة الدقيقة اللي الباك إند متوقعها عشان نمنع خطأ 400 نهائياً
      const backendUrl = process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'https://api-gateway-production-6a68.up.railway.app';
      
      const res = await fetch(`${backendUrl}/api/auth/pi-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          accessToken: authResult.accessToken,
          piUsername: authResult.user.username,
          piUid: authResult.user.uid
        }),
      });
      
      if (!res.ok) {
         const errData = await res.json().catch(()=>({}));
         throw new Error(errData.message || "فشل الاتصال بالخادم (Backend Error)");
      }

      const rawData = await res.json();
      const userData = rawData.data?.user || rawData.user;
      
      if (userData) {
        const safeUser = {
          username: userData.piUsername || userData.username || authResult.user.username,
          uid: userData.piUid || userData.piId || authResult.user.uid
        };
        setUser(safeUser);
        fetchBalance(safeUser.uid);
        setStatusMsg('');
      } else {
         throw new Error("صيغة البيانات غير صحيحة من الخادم");
      }
    } catch (error: any) {
      console.error("Auth Error:", error);
      setStatusMsg(error.message || 'فشل تسجيل الدخول.');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      setStatusMsg('جاري معالجة الدفع...');
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
        onCancel: () => setStatusMsg("تم إلغاء الدفع."),
        onError: () => setStatusMsg("حدث خطأ أثناء الدفع."),
      });
    } catch (error) {
      setStatusMsg("فشل الدفع.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  const handleA2UPayment = async () => {
    setA2ULoading(true);
    setStatusMsg('Initiating App-to-User payment...');
    // وضعنا الزرار كشكل حالياً لتطابق لايف آب (سيتم برمجته لاحقاً)
    setTimeout(() => {
      setStatusMsg('A2U endpoint is ready to be linked!');
      setA2ULoading(false);
    }, 1500);
  };

  const onIncompletePaymentFound = (payment: any) => {
    console.warn("Incomplete payment found", payment);
  };

  return (
    <div className="w-full flex flex-col items-center justify-center p-4">
      {/* شلنا المربع الأبيض وخلينا العرض مناسب ومندمج مع الخلفية */}
      <div className="w-full max-w-md text-center">
        
        {!user ? (
          <>
            {/* زرار واحد فقط للدخول (موف) */}
            <button
              onClick={handleAuth}
              disabled={loading}
              className="w-full bg-[#8B5CF6] hover:bg-[#7C3AED] disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-lg text-lg border border-[#7C3AED]/30"
            >
              {loading ? 'Connecting...' : 'Connect Pi Wallet'}
            </button>
            {statusMsg && <p className="text-red-400 mt-4 font-semibold text-sm">{statusMsg}</p>}
          </>
        ) : (
          <div className="flex flex-col gap-4">
            <p className="text-green-400 font-semibold text-lg">
              Welcome, @{user.username}!
            </p>
            
            {/* مربع شفاف وأنيق للبيانات عشان يليق على الخلفية الغامقة */}
            <div className="bg-gray-800/40 p-4 rounded-xl text-sm text-left border border-gray-700/50 backdrop-blur-sm">
              <p className="text-gray-400 mb-2">
                <strong className="text-gray-200">UID:</strong> <span className="text-xs break-all">{user.uid}</span>
              </p>
              <p className="text-gray-400">
                <strong className="text-gray-200">TEC Balance:</strong> <span className="font-bold text-lg text-[#8B5CF6] ml-1">{balance} TEC</span>
              </p>
            </div>

            {/* الزرار الأول (الدفع) - أخضر */}
            <button
              onClick={handlePayment}
              disabled={loading || a2uLoading}
              className="w-full bg-[#10B981] hover:bg-[#059669] disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-lg text-lg border border-[#059669]/30"
            >
              {loading ? 'Processing...' : 'Pay 1 Pi = 0.1 TEC'}
            </button>

            {/* الزرار الثاني (الاستقبال A2U) - أزرق زي لايف آب */}
            <button
              onClick={handleA2UPayment}
              disabled={loading || a2uLoading}
              className="w-full bg-[#3B82F6] hover:bg-[#2563EB] disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-lg text-lg border border-[#2563EB]/30"
            >
              Receive 0.1 Test-Pi (A2U)
            </button>

            {statusMsg && (
              <p className={`mt-2 text-sm font-semibold ${statusMsg.includes('نجاح') || statusMsg.includes('successful') ? 'text-green-400' : 'text-red-400'}`}>
                {statusMsg}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
        }
