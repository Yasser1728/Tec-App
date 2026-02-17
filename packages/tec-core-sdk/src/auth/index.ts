import { TecApiClient } from '../client';
import { storage, STORAGE_KEYS } from '../utils/storage';
import { isPiBrowser } from '../utils/pi-browser';
import type { TecUser, TecAuthResponse } from '../types';

export class TecAuthSDK {
  private client: TecApiClient;

  constructor(client: TecApiClient) {
    this.client = client;
  }

  async loginWithPi(): Promise<TecAuthResponse> {
    if (!isPiBrowser()) {
      throw new Error('يجب فتح التطبيق داخل Pi Browser');
    }

    const piAuth = await window.Pi.authenticate(
      ['username', 'payments', 'wallet_address'],
      (payment) => console.warn('Incomplete payment detected:', payment)
    );

    const result = await this.client.post<TecAuthResponse>('/api/auth/pi-login', {
      accessToken: piAuth.accessToken,
      piUsername: piAuth.user.username,
      piUid: piAuth.user.uid,
    });

    storage.set(STORAGE_KEYS.ACCESS_TOKEN, result.tokens.accessToken);
    storage.set(STORAGE_KEYS.REFRESH_TOKEN, result.tokens.refreshToken);
    storage.setJSON(STORAGE_KEYS.USER, result.user);

    return result;
  }

  getStoredUser(): TecUser | null {
    return storage.getJSON<TecUser>(STORAGE_KEYS.USER);
  }

  getAccessToken(): string | null {
    return storage.get(STORAGE_KEYS.ACCESS_TOKEN);
  }

  async getMe(): Promise<TecUser> {
    return this.client.get<TecUser>('/api/auth/me');
  }

  logout(): void {
    storage.remove(STORAGE_KEYS.ACCESS_TOKEN);
    storage.remove(STORAGE_KEYS.REFRESH_TOKEN);
    storage.remove(STORAGE_KEYS.USER);
  }

  isAuthenticated(): boolean {
    return !!this.getStoredUser();
  }
}

export { isPiBrowser };
