import { initPi } from "@/lib/pi/piClient";

interface PaymentMetadata {
  type: string;
  [key: string]: unknown;
}

interface PaymentCallbacks {
  onReadyForServerApproval: (paymentId: string) => void;
  onReadyForServerCompletion: (paymentId: string, txid: string) => void;
  onCancel: () => void;
  onError: (error: Error) => void;
}

export const createPayment = () => {

  const Pi = initPi();

  const metadata: PaymentMetadata = { type: "reward" };
  
  const callbacks: PaymentCallbacks = {
    onReadyForServerApproval(paymentId: string) {
      console.log("Approve:", paymentId);
    },

    onReadyForServerCompletion(paymentId: string, txid: string) {
      console.log("Complete:", txid);
    },

    onCancel() {},
    onError(error: Error) {
      console.error(error);
    }
  };

  Pi.createPayment({
    amount: 5,
    memo: "TEC Reward",
    metadata

  }, callbacks);
};
