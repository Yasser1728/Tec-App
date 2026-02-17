import { TecApiClient } from '../src/client';
import { storage, STORAGE_KEYS } from '../src/utils/storage';

// Mock fetch
global.fetch = jest.fn();

// Mock storage
jest.mock('../src/utils/storage', () => ({
  storage: {
    get: jest.fn(),
    set: jest.fn(),
    remove: jest.fn(),
  },
  STORAGE_KEYS: {
    ACCESS_TOKEN: 'tec_access_token',
    REFRESH_TOKEN: 'tec_refresh_token',
    USER: 'tec_user',
    LOCALE: 'tec_locale',
  },
}));

describe('TecApiClient', () => {
  let client: TecApiClient;
  const mockConfig = {
    apiUrl: 'https://api.test.com',
    appName: 'test-app',
  };

  beforeEach(() => {
    client = new TecApiClient(mockConfig);
    jest.clearAllMocks();
  });

  describe('request', () => {
    it('should make successful GET request with token', async () => {
      (storage.get as jest.Mock).mockReturnValue('test-token');
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ data: 'test' }),
      });

      const result = await client.get('/test');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.test.com/test',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      );
      expect(result).toEqual({ data: 'test' });
    });

    it('should make request without token if not available', async () => {
      (storage.get as jest.Mock).mockReturnValue(null);
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ data: 'test' }),
      });

      await client.get('/test');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.test.com/test',
        expect.objectContaining({
          headers: expect.not.objectContaining({
            Authorization: expect.anything(),
          }),
        })
      );
    });

    it('should handle non-OK responses', async () => {
      (storage.get as jest.Mock).mockReturnValue('test-token');
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ message: 'Server error' }),
      });

      await expect(client.get('/test')).rejects.toThrow('Server error');
    });
  });

  describe('POST request', () => {
    it('should send POST request with body', async () => {
      (storage.get as jest.Mock).mockReturnValue('test-token');
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      const body = { key: 'value' };
      await client.post('/test', body);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.test.com/test',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(body),
        })
      );
    });
  });

  describe('Token refresh', () => {
    it('should refresh token on 401 response', async () => {
      (storage.get as jest.Mock)
        .mockReturnValueOnce('expired-token')
        .mockReturnValueOnce('refresh-token')
        .mockReturnValueOnce('new-token');

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ accessToken: 'new-token' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: 'success' }),
        });

      const result = await client.get('/test');

      expect(storage.set).toHaveBeenCalledWith(STORAGE_KEYS.ACCESS_TOKEN, 'new-token');
      expect(result).toEqual({ data: 'success' });
    });
  });
});
