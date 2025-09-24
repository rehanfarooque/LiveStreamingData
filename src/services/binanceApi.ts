import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { CandlestickData, MarketStats, APIError } from '@/types';
import { BINANCE_BASE_URL, CHART_CONFIG } from '@/utils/constants';
import { transformRestKlineData } from '@/utils/helpers';

class BinanceAPIService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: BINANCE_BASE_URL,
      timeout: 30000, // Increased timeout
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor for logging
    this.api.interceptors.request.use(
      (config) => {
        console.log(`Making API request to: ${config.url}`);
        return config;
      },
      (error) => {
        console.error('API request error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling and retry logic
    this.api.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error) => {
        const config = error.config;

        // Retry logic for network errors and timeouts
        if (!config || !config.retry) {
          config.retry = 3;
          config.retryCount = config.retryCount || 0;
        }

        const shouldRetry = (
          config.retryCount < config.retry &&
          (error.code === 'ECONNABORTED' || // timeout
           error.code === 'ENOTFOUND' || // DNS resolution failed
           error.code === 'ECONNREFUSED' || // connection refused
           (error.response && [429, 502, 503, 504].includes(error.response.status)) // rate limit or server errors
          )
        );

        if (shouldRetry) {
          config.retryCount += 1;
          const delay = Math.min(1000 * Math.pow(2, config.retryCount), 10000);
          console.log(`Retrying API request (${config.retryCount}/${config.retry}) after ${delay}ms...`);

          await new Promise(resolve => setTimeout(resolve, delay));
          return this.api(config);
        }

        const apiError: APIError = {
          code: error.response?.status || 0,
          message: error.response?.data?.msg || error.message || 'Unknown error',
          timestamp: Date.now()
        };
        console.error('API response error:', apiError);
        return Promise.reject(apiError);
      }
    );
  }

  /**
   * Fetch historical kline data for a symbol and interval
   */
  async getKlines(
    symbol: string,
    interval: string,
    limit: number = CHART_CONFIG.DEFAULT_CANDLE_LIMIT
  ): Promise<CandlestickData[]> {
    try {
      const response = await this.api.get('/api/v3/klines', {
        params: {
          symbol: symbol.toUpperCase(),
          interval,
          limit: Math.min(limit, 1000) // Binance max limit is 1000
        },
        timeout: 25000 // Extended timeout for klines
      });

      const klines = response.data.map((kline: any[]) => transformRestKlineData(kline));
      console.log(`✅ Successfully fetched ${klines.length} klines for ${symbol}`);
      return klines;
    } catch (error) {
      console.error(`Failed to fetch klines for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Fetch 24hr ticker statistics for a symbol
   */
  async get24hrStats(symbol: string): Promise<MarketStats> {
    try {
      const response = await this.api.get('/api/v3/ticker/24hr', {
        params: {
          symbol: symbol.toUpperCase()
        }
      });

      return response.data;
    } catch (error) {
      console.error(`Failed to fetch 24hr stats for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Fetch current price for a symbol
   */
  async getCurrentPrice(symbol: string): Promise<number> {
    try {
      const response = await this.api.get('/api/v3/ticker/price', {
        params: {
          symbol: symbol.toUpperCase()
        }
      });

      return parseFloat(response.data.price);
    } catch (error) {
      console.error(`Failed to fetch current price for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Fetch exchange info to validate symbol
   */
  async getExchangeInfo(symbol?: string): Promise<any> {
    try {
      const params = symbol ? { symbol: symbol.toUpperCase() } : {};
      const response = await this.api.get('/api/v3/exchangeInfo', { params });
      
      return response.data;
    } catch (error) {
      console.error('Failed to fetch exchange info:', error);
      throw error;
    }
  }

  /**
   * Health check for Binance API
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.api.get('/api/v3/ping');
      return true;
    } catch (error) {
      console.error('Binance API health check failed:', error);
      return false;
    }
  }

  /**
   * Get server time from Binance
   */
  async getServerTime(): Promise<number> {
    try {
      const response = await this.api.get('/api/v3/time');
      return response.data.serverTime;
    } catch (error) {
      console.error('Failed to fetch server time:', error);
      throw error;
    }
  }

  /**
   * Fetch multiple symbols data in batch
   */
  async getMultiple24hrStats(symbols?: string[]): Promise<MarketStats[]> {
    try {
      const params = symbols ? { symbols: JSON.stringify(symbols.map(s => s.toUpperCase())) } : {};
      const response = await this.api.get('/api/v3/ticker/24hr', { params });
      
      return response.data;
    } catch (error) {
      console.error('Failed to fetch multiple 24hr stats:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const binanceAPI = new BinanceAPIService();
export default binanceAPI;