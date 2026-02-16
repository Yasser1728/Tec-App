import { initPi } from "@/lib/pi/piClient";

export const createPayment = () => {

  const Pi = initPi();

  Pi.createPayment({
    amount: 5,
    memo: "TEC Reward",
    metadata: { type: "reward" }

  }, {
    onReadyForServerApproval(paymentId: string) {
      console.log("Approve:", paymentId);
    },

    onReadyForServerCompletion(paymentId: string, txid: string) {
      console.log("Complete:", txid);
    },

    onCancel() {},
    onError(error: any) {
      console.error(error);
    }
  });
};
