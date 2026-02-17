# @tec/core-sdk

> **TEC Ecosystem Core SDK** — Unified Auth, Wallet, and Payment integration for all 24 TEC apps on Pi Network

## 🎯 Overview

The `@tec/core-sdk` is the **single source of truth** for client-side logic across the entire TEC ecosystem. It provides a consistent, type-safe interface for authentication, wallet management, and payments — eliminating code duplication across all 24 TEC applications.

## 📦 Installation

```bash
npm install @tec/core-sdk
# or
yarn add @tec/core-sdk
```

## 🚀 Quick Start

### 1. Wrap Your App with TecAuthProvider

{% raw %}
```tsx
import { TecAuthProvider } from '@tec/core-sdk';

function App() {
  return (
    <TecAuthProvider
      config={{
        apiUrl: 'https://api.tec.network',
        appName: 'tec-marketplace',
        sandbox: false,
        onTokenExpired: () => {
          console.log('Session expired, redirecting to login...');
        },
      }}
    >
      <YourApp />
    </TecAuthProvider>
  );
}
```
{% endraw %}

### 2. Use Authentication

```tsx
import { useTecAuth } from '@tec/core-sdk';

function LoginButton() {
  const { login, logout, isAuthenticated, user, isPiBrowserEnv } = useTecAuth();

  if (!isPiBrowserEnv) {
    return <p>Please open in Pi Browser</p>;
  }

  if (isAuthenticated) {
    return (
      <div>
        <p>Welcome, {user?.piUsername}!</p>
        <button onClick={logout}>Logout</button>
      </div>
    );
  }

  return <button onClick={login}>Login with Pi</button>;
}
```

### 3. Use Wallet Features

```tsx
import { useTecWallet } from '@tec/core-sdk';

function WalletDashboard() {
  const { balance, currency, wallets, isLoading, fetchWallets } = useTecWallet();

  if (isLoading) return <p>Loading...</p>;

  return (
    <div>
      <h2>Your Balance</h2>
      <p>{balance} {currency}</p>
      <button onClick={fetchWallets}>Refresh</button>
    </div>
  );
}
```

### 4. Use Payment Features

```tsx
import { useTecPayment } from '@tec/core-sdk';

function PaymentButton() {
  const { payPi, isProcessing, sdkAvailable } = useTecPayment();

  const handlePayment = async () => {
    try {
      const result = await payPi(10, 'Purchase Premium Subscription');
      console.log('Payment successful:', result);
    } catch (error) {
      console.error('Payment failed:', error);
    }
  };

  if (!sdkAvailable) {
    return <p>Pi SDK not available</p>;
  }

  return (
    <button onClick={handlePayment} disabled={isProcessing}>
      {isProcessing ? 'Processing...' : 'Pay 10 Pi'}
    </button>
  );
}
```

## 📚 API Reference

### TecAuthSDK

Core authentication SDK class.

```typescript
class TecAuthSDK {
  async loginWithPi(): Promise<TecAuthResponse>;
  getStoredUser(): TecUser | null;
  getAccessToken(): string | null;
  async getMe(): Promise<TecUser>;
  logout(): void;
  isAuthenticated(): boolean;
}
```

**Example:**
```typescript
import { TecAuthSDK, TecApiClient } from '@tec/core-sdk';

const client = new TecApiClient({ apiUrl: 'https://api.tec.network', appName: 'my-app' });
const authSDK = new TecAuthSDK(client);

const response = await authSDK.loginWithPi();
console.log(response.user);
```

### useTecAuth Hook

React hook for authentication state and actions.

```typescript
interface UseTecAuth {
  user: TecUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isNewUser: boolean;
  error: string | null;
  isPiBrowserEnv: boolean;
  login: () => Promise<TecAuthResponse>;
  logout: () => void;
  sdk: TecAuthSDK;
}
```

### TecWalletSDK

Wallet management SDK class.

```typescript
class TecWalletSDK {
  async getWallets(): Promise<Wallet[]>;
  async getBalance(walletId: string): Promise<WalletBalance>;
  async getPrimaryBalance(): Promise<WalletBalance | null>;
  async getTransactions(walletId: string, options?: TransactionHistoryOptions): Promise<PaginatedResponse<Transaction>>;
  async linkWallet(walletAddress: string, walletType: 'pi' | 'crypto' | 'fiat'): Promise<Wallet>;
}
```

### useTecWallet Hook

React hook for wallet management.

```typescript
interface UseTecWallet {
  wallets: Wallet[];
  primaryBalance: WalletBalance | null;
  isLoading: boolean;
  error: string | null;
  balance: number;
  currency: string;
  fetchWallets: () => Promise<void>;
  getTransactions: (walletId: string, options?: TransactionHistoryOptions) => Promise<PaginatedResponse<Transaction>>;
}
```

### TecPaymentSDK

Payment processing SDK class.

```typescript
class TecPaymentSDK {
  async createA2UPayment(data: A2UPaymentRequest): Promise<PaymentResult>;
  createU2APayment(amount: number, memo: string, metadata?: Record<string, unknown>): Promise<PaymentResult>;
  async getPaymentStatus(paymentId: string): Promise<Payment>;
  testSDK(): boolean;
}
```

**Example:**
```typescript
// User-to-App payment
const result = await paymentSDK.createU2APayment(50, 'Premium Feature Unlock');

// App-to-User payment
const a2uResult = await paymentSDK.createA2UPayment({
  recipientUid: 'user123',
  amount: 100,
  memo: 'Reward payment',
});
```

### useTecPayment Hook

React hook for payment processing.

```typescript
interface UseTecPayment {
  isProcessing: boolean;
  lastPayment: PaymentResult | null;
  error: string | null;
  sdkAvailable: boolean;
  payPi: (amount: number, memo?: string, metadata?: Record<string, unknown>) => Promise<PaymentResult>;
  sendPi: (data: A2UPaymentRequest) => Promise<PaymentResult>;
  testSDK: () => boolean;
  resetPayment: () => void;
}
```

## 🔧 Utilities

### isPiBrowser()

Detects if the app is running inside Pi Browser.

```typescript
import { isPiBrowser } from '@tec/core-sdk';

if (isPiBrowser()) {
  console.log('Running in Pi Browser');
}
```

### storage

SSR-safe localStorage wrapper.

```typescript
import { storage, STORAGE_KEYS } from '@tec/core-sdk';

storage.set(STORAGE_KEYS.ACCESS_TOKEN, 'token123');
const token = storage.get(STORAGE_KEYS.ACCESS_TOKEN);

// JSON helpers
storage.setJSON('user', { id: '1', name: 'Alice' });
const user = storage.getJSON<User>('user');
```

### TecApiClient

HTTP client with automatic token refresh.

```typescript
import { TecApiClient } from '@tec/core-sdk';

const client = new TecApiClient({
  apiUrl: 'https://api.tec.network',
  appName: 'my-app',
  onTokenExpired: () => console.log('Token expired'),
});

// Convenience methods
const data = await client.get<User>('/api/user');
const result = await client.post<Response>('/api/action', { key: 'value' });
```

## 🏗️ Architecture

```
┌─────────────────────────────────────┐
│        24 TEC Applications          │
│  (Marketplace, Freelance, Food,     │
│   Education, Healthcare, etc.)      │
└───────────────┬─────────────────────┘
                │
                │ imports
                ▼
┌─────────────────────────────────────┐
│       @tec/core-sdk Package         │
│  ┌─────────────────────────────┐   │
│  │   Auth SDK + Hooks          │   │
│  │   Wallet SDK + Hooks        │   │
│  │   Payment SDK + Hooks       │   │
│  │   TecApiClient (HTTP)       │   │
│  │   Utils (storage, detect)   │   │
│  └─────────────────────────────┘   │
└───────────────┬─────────────────────┘
                │
                │ HTTP/REST
                ▼
┌─────────────────────────────────────┐
│       TEC Core Services             │
│  ┌─────────────────────────────┐   │
│  │   Auth Service (Port 4001)  │   │
│  │   Wallet Service (Port 4002)│   │
│  │   Payment Service (Port 4003)   │
│  └─────────────────────────────┘   │
└───────────────┬─────────────────────┘
                │
                ▼
┌─────────────────────────────────────┐
│         Database (PostgreSQL)       │
└─────────────────────────────────────┘
```

## 📱 Apps Using This SDK

This SDK is consumed by all **24 TEC applications**:

1. **TEC Marketplace** — E-commerce platform
2. **TEC Freelance** — Gig economy marketplace
3. **TEC Food** — Food delivery service
4. **TEC Ride** — Ride-sharing platform
5. **TEC Education** — Online learning platform
6. **TEC Healthcare** — Telemedicine services
7. **TEC Real Estate** — Property listings
8. **TEC Jobs** — Job board
9. **TEC Hotels** — Hotel booking
10. **TEC Travel** — Travel booking
11. **TEC Events** — Event ticketing
12. **TEC Gaming** — Gaming marketplace
13. **TEC Social** — Social networking
14. **TEC Finance** — Financial services
15. **TEC Insurance** — Insurance platform
16. **TEC Legal** — Legal services
17. **TEC Utilities** — Bill payment
18. **TEC Charity** — Donation platform
19. **TEC Fitness** — Fitness tracking
20. **TEC Beauty** — Beauty services
21. **TEC Fashion** — Fashion marketplace
22. **TEC Electronics** — Electronics store
23. **TEC Books** — Book marketplace
24. **TEC Music** — Music streaming

## 🔐 Security

- All `any` types replaced with `unknown` or proper typed interfaces
- SSR-safe utilities prevent window/localStorage access during server-side rendering
- Automatic token refresh prevents session expiration
- Type-safe API responses with proper error handling

## 📝 Type Safety

All SDK methods and hooks are fully typed:

```typescript
import type {
  TecUser,
  TecAuthResponse,
  Wallet,
  WalletBalance,
  Payment,
  PaymentResult,
  A2UPaymentRequest,
  TransactionHistoryOptions,
} from '@tec/core-sdk';
```

## 🧪 Testing

```bash
npm test
```

The SDK includes comprehensive tests:
- `client.test.ts` — TecApiClient tests
- `auth.test.ts` — TecAuthSDK tests
- `wallet.test.ts` — TecWalletSDK tests
- `payment.test.ts` — TecPaymentSDK tests

## 📄 License

MIT © TEC Ecosystem

---

**Built with ❤️ for the Pi Network ecosystem**
