// Detect if running inside Pi Browser
export const isPiBrowser = (): boolean => {
  if (typeof window === 'undefined') return false;
  return typeof window.Pi !== 'undefined';
};

// Window.Pi type declaration
declare global {
  interface Window {
    Pi: {
      authenticate: (
        scopes: string[],
        onIncompletePayment: (payment: unknown) => void
      ) => Promise<{ accessToken: string; user: { uid: string; username: string } }>;
      createPayment: (
        paymentData: { amount: number; memo: string; metadata: Record<string, unknown> },
        callbacks: {
          onReadyForServerApproval: (paymentId: string) => void;
          onReadyForServerCompletion: (paymentId: string, txid: string) => void;
          onCancel: (paymentId: string) => void;
          onError: (error: Error, payment?: unknown) => void;
        }
      ) => void;
    };
  }
}
