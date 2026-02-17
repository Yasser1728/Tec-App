import { TecAuthSDK } from '../src/auth';
import { TecApiClient } from '../src/client';
import { storage, STORAGE_KEYS } from '../src/utils/storage';
import { isPiBrowser } from '../src/utils/pi-browser';

jest.mock('../src/utils/storage');
jest.mock('../src/utils/pi-browser');
jest.mock('../src/client');

describe('TecAuthSDK', () => {
  let authSDK: TecAuthSDK;
  let mockClient: jest.Mocked<TecApiClient>;

  beforeEach(() => {
    mockClient = {
      post: jest.fn(),
      get: jest.fn(),
    } as unknown as jest.Mocked<TecApiClient>;
    authSDK = new TecAuthSDK(mockClient);
    jest.clearAllMocks();
  });

  describe('getStoredUser', () => {
    it('should return stored user from storage', () => {
      const mockUser = {
        id: '1',
        piId: 'pi123',
        piUsername: 'testuser',
        role: 'user',
        subscriptionPlan: null,
        createdAt: '2024-01-01',
      };
      (storage.getJSON as jest.Mock).mockReturnValue(mockUser);

      const user = authSDK.getStoredUser();

      expect(storage.getJSON).toHaveBeenCalledWith(STORAGE_KEYS.USER);
      expect(user).toEqual(mockUser);
    });

    it('should return null if no user stored', () => {
      (storage.getJSON as jest.Mock).mockReturnValue(null);

      const user = authSDK.getStoredUser();

      expect(user).toBeNull();
    });
  });

  describe('getAccessToken', () => {
    it('should return access token from storage', () => {
      (storage.get as jest.Mock).mockReturnValue('test-token');

      const token = authSDK.getAccessToken();

      expect(storage.get).toHaveBeenCalledWith(STORAGE_KEYS.ACCESS_TOKEN);
      expect(token).toBe('test-token');
    });
  });

  describe('logout', () => {
    it('should remove all auth data from storage', () => {
      authSDK.logout();

      expect(storage.remove).toHaveBeenCalledWith(STORAGE_KEYS.ACCESS_TOKEN);
      expect(storage.remove).toHaveBeenCalledWith(STORAGE_KEYS.REFRESH_TOKEN);
      expect(storage.remove).toHaveBeenCalledWith(STORAGE_KEYS.USER);
    });
  });

  describe('isAuthenticated', () => {
    it('should return true if user is stored', () => {
      (storage.getJSON as jest.Mock).mockReturnValue({ id: '1' });

      expect(authSDK.isAuthenticated()).toBe(true);
    });

    it('should return false if no user is stored', () => {
      (storage.getJSON as jest.Mock).mockReturnValue(null);

      expect(authSDK.isAuthenticated()).toBe(false);
    });
  });

  describe('loginWithPi', () => {
    it('should throw error if not in Pi Browser', async () => {
      (isPiBrowser as jest.Mock).mockReturnValue(false);

      await expect(authSDK.loginWithPi()).rejects.toThrow('يجب فتح التطبيق داخل Pi Browser');
    });
  });

  describe('getMe', () => {
    it('should fetch current user from API', async () => {
      const mockUser = { id: '1', piUsername: 'testuser' };
      mockClient.get.mockResolvedValue(mockUser);

      const user = await authSDK.getMe();

      expect(mockClient.get).toHaveBeenCalledWith('/api/auth/me');
      expect(user).toEqual(mockUser);
    });
  });
});
