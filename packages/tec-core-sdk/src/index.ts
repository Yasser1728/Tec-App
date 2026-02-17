// @tec/core-sdk — Unified SDK for TEC Ecosystem
// Auth
export { TecAuthSDK } from './auth';
export { useTecAuth } from './auth/hooks';
export { TecAuthProvider, TecAuthContext } from './auth/provider';

// Wallet
export { TecWalletSDK } from './wallet';
export { useTecWallet } from './wallet/hooks';

// Payment
export { TecPaymentSDK } from './payment';
export { useTecPayment } from './payment/hooks';

// Client
export { TecApiClient } from './client';

// Utils
export { isPiBrowser } from './utils/pi-browser';
export { storage, STORAGE_KEYS } from './utils/storage';

// Types
export type * from './types';
