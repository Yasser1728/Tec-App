"use client";

import { createPayment } from "@/services/piPayment";

export default function PaymentsPage() {

  return (
    <div className="p-10">
      <button
        onClick={createPayment}
        className="bg-green-600 text-white px-6 py-3 rounded"
      >
        Send Payment
      </button>
    </div>
  );
}
