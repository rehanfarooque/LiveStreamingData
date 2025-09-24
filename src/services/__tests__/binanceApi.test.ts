import axios from 'axios';
import { binanceAPI } from '../binanceApi';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('BinanceAPI Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedAxios.create.mockReturnValue(mockedAxios);
  });

  describe('getKlines', () => {
    it('should fetch kline data successfully', async () => {
      const mockKlineData = [
        [1640995200000, '50000.00', '51000.00', '49500.00', '50500.00', '100.5'],
        [1640995260000, '50500.00', '51500.00', '50000.00', '51200.00', '95.3'],
      ];

      mockedAxios.get.mockResolvedValueOnce({ data: mockKlineData });

      const result = await binanceAPI.getKlines('BTCUSDT', '1m', 200);

      expect(mockedAxios.get).toHaveBeenCalledWith('/api/v3/klines', {
        params: {
          symbol: 'BTCUSDT',
          interval: '1m',
          limit: 200,
        },
      });

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        timestamp: 1640995200000,
        open: 50000,
        high: 51000,
        low: 49500,
        close: 50500,
        volume: 100.5,
      });
    });

    it('should handle API errors', async () => {
      const errorResponse = {
        response: {
          status: 400,
          data: { msg: 'Invalid symbol' },
        },
      };

      mockedAxios.get.mockRejectedValueOnce(errorResponse);

      await expect(binanceAPI.getKlines('INVALID', '1m')).rejects.toEqual({
        code: 400,
        message: 'Invalid symbol',
        timestamp: expect.any(Number),
      });
    });

    it('should limit request size to maximum allowed', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: [] });

      await binanceAPI.getKlines('BTCUSDT', '1m', 1500);

      expect(mockedAxios.get).toHaveBeenCalledWith('/api/v3/klines', {
        params: {
          symbol: 'BTCUSDT',
          interval: '1m',
          limit: 1000, // Should be capped at 1000
        },
      });
    });
  });

  describe('get24hrStats', () => {
    it('should fetch 24hr statistics successfully', async () => {
      const mockStats = {
        symbol: 'BTCUSDT',
        priceChange: '1000.00',
        priceChangePercent: '2.00',
        lastPrice: '50500.00',
        volume: '1000.00',
      };

      mockedAxios.get.mockResolvedValueOnce({ data: mockStats });

      const result = await binanceAPI.get24hrStats('BTCUSDT');

      expect(mockedAxios.get).toHaveBeenCalledWith('/api/v3/ticker/24hr', {
        params: { symbol: 'BTCUSDT' },
      });

      expect(result).toEqual(mockStats);
    });
  });

  describe('getCurrentPrice', () => {
    it('should fetch current price successfully', async () => {
      const mockPrice = { symbol: 'BTCUSDT', price: '50500.00' };

      mockedAxios.get.mockResolvedValueOnce({ data: mockPrice });

      const result = await binanceAPI.getCurrentPrice('BTCUSDT');

      expect(mockedAxios.get).toHaveBeenCalledWith('/api/v3/ticker/price', {
        params: { symbol: 'BTCUSDT' },
      });

      expect(result).toBe(50500);
    });
  });

  describe('healthCheck', () => {
    it('should return true when API is healthy', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: {} });

      const result = await binanceAPI.healthCheck();

      expect(mockedAxios.get).toHaveBeenCalledWith('/api/v3/ping');
      expect(result).toBe(true);
    });

    it('should return false when API is unhealthy', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));

      const result = await binanceAPI.healthCheck();

      expect(result).toBe(false);
    });
  });

  describe('getServerTime', () => {
    it('should fetch server time successfully', async () => {
      const mockTime = { serverTime: 1640995200000 };

      mockedAxios.get.mockResolvedValueOnce({ data: mockTime });

      const result = await binanceAPI.getServerTime();

      expect(mockedAxios.get).toHaveBeenCalledWith('/api/v3/time');
      expect(result).toBe(1640995200000);
    });
  });

  describe('getExchangeInfo', () => {
    it('should fetch exchange info successfully', async () => {
      const mockExchangeInfo = {
        symbols: [
          {
            symbol: 'BTCUSDT',
            status: 'TRADING',
            baseAsset: 'BTC',
            quoteAsset: 'USDT',
          },
        ],
      };

      mockedAxios.get.mockResolvedValueOnce({ data: mockExchangeInfo });

      const result = await binanceAPI.getExchangeInfo('BTCUSDT');

      expect(mockedAxios.get).toHaveBeenCalledWith('/api/v3/exchangeInfo', {
        params: { symbol: 'BTCUSDT' },
      });

      expect(result).toEqual(mockExchangeInfo);
    });

    it('should fetch all exchange info when no symbol provided', async () => {
      const mockExchangeInfo = { symbols: [] };

      mockedAxios.get.mockResolvedValueOnce({ data: mockExchangeInfo });

      await binanceAPI.getExchangeInfo();

      expect(mockedAxios.get).toHaveBeenCalledWith('/api/v3/exchangeInfo', {
        params: {},
      });
    });
  });

  describe('getMultiple24hrStats', () => {
    it('should fetch multiple 24hr stats successfully', async () => {
      const mockStats = [
        { symbol: 'BTCUSDT', lastPrice: '50500.00' },
        { symbol: 'ETHUSDT', lastPrice: '3500.00' },
      ];

      mockedAxios.get.mockResolvedValueOnce({ data: mockStats });

      const result = await binanceAPI.getMultiple24hrStats(['BTCUSDT', 'ETHUSDT']);

      expect(mockedAxios.get).toHaveBeenCalledWith('/api/v3/ticker/24hr', {
        params: { symbols: JSON.stringify(['BTCUSDT', 'ETHUSDT']) },
      });

      expect(result).toEqual(mockStats);
    });

    it('should fetch all stats when no symbols provided', async () => {
      const mockStats = [];

      mockedAxios.get.mockResolvedValueOnce({ data: mockStats });

      await binanceAPI.getMultiple24hrStats();

      expect(mockedAxios.get).toHaveBeenCalledWith('/api/v3/ticker/24hr', {
        params: {},
      });
    });
  });
});