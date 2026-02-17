// SSR-safe localStorage wrapper

export const storage = {
  get(key: string): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(key);
  },
  set(key: string, value: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, value);
  },
  remove(key: string): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(key);
  },
  getJSON<T>(key: string): T | null {
    const value = storage.get(key);
    if (!value) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  },
  setJSON<T>(key: string, value: T): void {
    storage.set(key, JSON.stringify(value));
  },
};

// Storage keys — centralized to prevent typos
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'tec_access_token',
  REFRESH_TOKEN: 'tec_refresh_token',
  USER: 'tec_user',
  LOCALE: 'tec_locale',
} as const;
