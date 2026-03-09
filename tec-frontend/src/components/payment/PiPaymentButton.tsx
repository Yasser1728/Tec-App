"use client";

import { useState } from "react";
import { PiPaymentCallbacks, PaymentStatus } from "@/types/pi";

interface PiPaymentButtonProps {
  amount: number;
  memo: string;
  onSuccess?: (txid: string) => void;
  onError?: (errorMessage: string) => void;
}

export default function PiPaymentButton({
  amount,
  memo,
  onSuccess,
  onError,
}: PiPaymentButtonProps) {
  const [status, setStatus] = useState<PaymentStatus | "idle">("idle");

  const handlePayment = async () => {
    try {
      setStatus("pending");

      if (typeof window === "undefined" || !(window as any).Pi) {
        throw new Error("Pi Network SDK is not loaded.");
      }

      const Pi = (window as any).Pi;

      const callbacks: PiPaymentCallbacks = {
        onReadyForServerApproval: async (paymentId) => {
          console.log("Ready for server approval:", paymentId);
          try {
            const res = await fetch('/api/payment/approve', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ paymentId }),
            });
            if (!res.ok) throw new Error("Approval failed on server");
          } catch (err) {
            console.error(err);
            setStatus("failed");
            if (onError) onError("Server approval failed");
          }
        },
        onReadyForServerCompletion: async (paymentId, txid) => {
          console.log("Ready for server completion:", paymentId, txid);
          try {
            const res = await fetch('/api/payment/complete', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ paymentId, txid }),
            });
            if (!res.ok) throw new Error("Completion failed on server");

            setStatus("success");
            if (onSuccess) onSuccess(txid);
          } catch (err) {
            console.error(err);
            setStatus("failed");
            if (onError) onError("Server completion failed");
          }
        },
        onCancel: (paymentId) => {
          console.log("Payment cancelled:", paymentId);
          setStatus("cancelled");
          if (onError) onError("Payment was cancelled by the user.");
        },
        onError: (error, payment) => {
          console.error("Payment error:", error, payment);
          setStatus("failed");
          if (onError) onError(error.message);
        },
      };

      await Pi.createPayment({
        amount,
        memo,
        metadata: { orderId: "12345" },
      }, callbacks);

    } catch (error: any) {
      setStatus("failed");
      if (onError) onError(error.message || "An unexpected error occurred.");
    }
  };

  return (
    <button
      onClick={handlePayment}
      disabled={status === "pending"}
      className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded flex items-center justify-center transition-colors disabled:opacity-50"
    >
      {status === "pending" ? (
        <span className="animate-pulse">Processing...</span>
      ) : (
        <span>Pay {amount} Pi</span>
      )}
    </button>
  );
}
