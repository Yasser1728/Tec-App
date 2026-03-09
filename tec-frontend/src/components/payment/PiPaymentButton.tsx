"use client";

import { useState, useEffect, useCallback } from "react";

export default function PiPaymentButton() {
  const [status, setStatus] = useState("idle"); // idle, loading, paying, success, error
  const [user, setUser] = useState<any>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [isPiBrowser, setIsPiBrowser] = useState(true);

  // 1. دالة جلب الرصيد من الـ API
  const fetchBalance = async (userId: string) => {
    try {
      const res = await fetch(`/api/wallet/balance?userId=${userId}`);
      const data = await res.json();
      if (data && data.balance !== undefined) {
        setBalance(data.balance);
      }
    } catch (err) {
      console.error("Error fetching balance:", err);
    }
  };

  // 2. تسجيل الدخول التلقائي (مثل LIFE-APP تماماً)
  useEffect(() => {
    const initPiAuth = async () => {
      if (typeof window === 'undefined') return;

      // التأكد أن المستخدم يفتح من متصفح Pi
      if (!window.Pi) {
        setIsPiBrowser(false);
        return;
      }

      try {
        setStatus("loading");
        const scopes = ['payments', 'username'];
        
        // تسجيل الدخول صامتاً في الخلفية
        // @ts-ignore
        const authResult = await window.Pi.authenticate(scopes, onIncompletePaymentFound);
        
        if (authResult?.user?.uid) {
          // إرسال البيانات للباك-إند الخاص بنا
          const res = await fetch('/api/auth/pi-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ authResult }),
          });
          
          const data = await res.json();
          if (data.token) {
            setUser(data.user);
            setStatus("idle"); // جاهز للدفع
            fetchBalance(data.user.piUid); // جلب الرصيد
          }
        }
      } catch (error) {
        console.error("Pi Auth Error:", error);
        setStatus("error");
      }
    };

    initPiAuth();
  }, []);

  // 3. دالة الدفع (الزر الوحيد)
  const handlePayment = useCallback(async () => {
    if (!user) return alert("Please wait for authentication...");
    
    try {
      setStatus("paying");
      // @ts-ignore
      const payment = await window.Pi.createPayment({
        amount: 1,
        memo: "Purchase 0.1 TEC",
        metadata: { userId: user.piUid }, // ID المستخدم الحقيقي
      }, {
        onReadyForServerApproval: (paymentId: string) => {
          fetch('/api/payment/approve', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paymentId, amount: 1, userId: user.piUid })
          });
        },
        onReadyForServerCompletion: (paymentId: string, txid: string) => {
          fetch('/api/payment/complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paymentId, txid })
          }).then(() => {
            setStatus("success");
            // تحديث الرصيد بعد نجاح الدفع
            setTimeout(() => fetchBalance(user.piUid), 2000);
          });
        },
        onCancel: () => setStatus("idle"),
        onError: () => setStatus("error"),
      });
    } catch (error) {
      console.error(error);
      setStatus("error");
    }
  }, [user]);

  const onIncompletePaymentFound = (payment: any) => {
    console.warn("Incomplete payment found", payment);
  };

  // 4. الواجهة المبسطة
  if (!isPiBrowser) {
    return (
      <div className="p-4 bg-yellow-100 border border-yellow-400 text-yellow-800 rounded-lg text-center">
        🌐 <strong>Pi Browser Required</strong><br/>
        Please open this app inside the Pi Browser to authenticate and pay.
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 p-6 bg-gray-900 rounded-xl text-white w-full max-w-md mx-auto">
      {/* حالة التحميل المخفية */}
      {status === "loading" && (
        <p className="text-teal-400 animate-pulse">Authenticating with Pi...</p>
      )}

      {/* لوحة التحكم والزر الوحيد (تظهر فقط بعد الـ Auth التلقائي) */}
      {user && (
        <div className="text-center w-full">
          <h2 className="text-2xl font-bold text-teal-400 mb-2">Welcome, {user.username}!</h2>
          <div className="bg-gray-800 p-4 rounded-lg my-4 border border-teal-500/30">
            <p className="text-gray-400 text-sm">Your TEC Balance</p>
            <p className="text-4xl font-black text-white">
              {balance !== null ? balance : "..."} <span className="text-teal-400 text-xl">TEC</span>
            </p>
          </div>

          <button 
            onClick={handlePayment}
            disabled={status === "paying"}
            className="w-full bg-gradient-to-r from-pink-500 to-orange-400 text-white px-6 py-4 rounded-lg font-bold text-lg shadow-lg hover:opacity-90 transition-all disabled:opacity-50"
          >
            {status === "paying" ? "Processing..." : "💎 Pay 1 Pi = 0.1 TEC"}
          </button>
          
          {status === "success" && (
            <p className="text-green-400 mt-3 font-semibold">Payment successful! Balance updated.</p>
          )}
        </div>
      )}
    </div>
  );
}
