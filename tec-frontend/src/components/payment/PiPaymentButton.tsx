"use client";

import { useState, useCallback } from "react";

export default function PiPaymentButton() {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [statusMsg, setStatusMsg] = useState('');

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

  const handleAuth = async () => {
    try {
      setLoading(true);
      setStatusMsg('');
      const scopes = ['payments', 'username'];
      
      // @ts-ignore
      const authResult = await window.Pi.authenticate(scopes, onIncompletePaymentFound);
      
      if (authResult?.user?.uid) {
        // 💡 التعديل هنا: إرسال البيانات بنفس الشكل اللي Auth Service متوقعاه في الـ Gateway
        const res = await fetch('/api/auth/pi-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            authResult: authResult // بنبعت كل الـ authResult لأن الـ Gateway متوقعها
          }),
        });
        
        if (!res.ok) {
           throw new Error("Backend rejected the login request");
        }

        const data = await res.json();
        
        // 💡 التعديل هنا: التعامل مع الرد سواء كان جوه `data.data.user` أو `data.user`
        const userData = data.user || (data.data && data.data.user);
        
        if (userData) {
          // توحيد اسم المتغيرات عشان لو الباك إند بيرجع piId بدل piUid
          const safeUser = {
            username: userData.username || userData.piUsername || userData.pi_username || authResult.user.username,
            uid: userData.piUid || userData.piId || userData.pi_uid || authResult.user.uid
          };
          
          setUser(safeUser);
          fetchBalance(safeUser.uid);
          setStatusMsg('Authenticated successfully!');
        } else {
           throw new Error("Invalid response format from backend");
        }
      }
    } catch (error: any) {
      console.error("Auth Error:", error);
      setStatusMsg(error.message || 'Failed to authenticate.');
    } finally {
      setLoading(false);
    }
  };

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

  const onIncompletePaymentFound = (payment: any) => {
    console.warn("Incomplete payment found", payment);
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 my-10" style={{ minHeight: '400px' }}>
      <div 
        className="bg-white p-8 rounded-2xl shadow-xl text-center text-black" 
        style={{ width: '100%', maxWidth: '400px', backgroundColor: '#ffffff' }}
      >
        <h1 className="text-3xl font-bold mb-4" style={{ color: '#9333ea' }}>LIFE-APP UI</h1>

        {!user ? (
          <>
            <p className="mb-8 font-semibold" style={{ color: '#4b5563' }}>
              Welcome to Pi Network Integration
            </p>
            {/* زرار Connect مجبر على الستايل عشان ميبقاش صغير */}
            <button
              onClick={handleAuth}
              disabled={loading}
              style={{
                backgroundColor: '#9333ea',
                color: 'white',
                fontWeight: 'bold',
                padding: '12px 24px',
                borderRadius: '8px',
                width: '100%',
                fontSize: '18px',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? 'Connecting...' : 'Connect Pi Wallet'}
            </button>
            {statusMsg && <p style={{ color: 'red', marginTop: '16px', fontSize: '14px' }}>{statusMsg}</p>}
          </>
        ) : (
          <>
            <p className="font-bold mb-4 text-xl" style={{ color: '#16a34a' }}>
              Welcome, @{user.username}!
            </p>
            
            <div 
              className="p-4 rounded-lg mb-6 text-sm text-left border"
              style={{ backgroundColor: '#f9fafb', borderColor: '#e5e7eb' }}
            >
              <p className="mb-2">
                <strong style={{ color: '#9333ea' }}>UID:</strong> <br/>
                <span style={{ color: '#4b5563', fontSize: '12px', wordBreak: 'break-all' }}>{user.uid}</span>
              </p>
              <p>
                <strong style={{ color: '#9333ea' }}>TEC Balance:</strong> <br/>
                <span className="font-bold text-lg" style={{ color: '#000' }}>
                  {balance !== null ? balance : "..."} TEC
                </span>
              </p>
            </div>

            <button
              onClick={handlePayment}
              disabled={loading}
              style={{
                backgroundColor: '#22c55e',
                color: 'white',
                fontWeight: 'bold',
                padding: '12px 24px',
                borderRadius: '8px',
                width: '100%',
                fontSize: '18px',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? 'Processing...' : 'Pay 1 Pi (Test)'}
            </button>

            {statusMsg && (
              <p style={{ 
                marginTop: '16px', 
                fontWeight: 'bold', 
                color: statusMsg.includes('successful') ? '#16a34a' : '#4b5563' 
              }}>
                {statusMsg}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
                      }
