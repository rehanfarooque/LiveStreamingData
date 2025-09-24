import { CandlestickData, BinanceKlineMessage } from '@/types';

/**
 * Format price with appropriate decimal places
 */
export const formatPrice = (price: number, decimals: number = 4): string => {
  return price.toFixed(decimals);
};

/**
 * Format percentage change with color indication
 */
export const formatPercentage = (percentage: number, decimals: number = 2): string => {
  const sign = percentage >= 0 ? '+' : '';
  return `${sign}${percentage.toFixed(decimals)}%`;
};

/**
 * Format volume for display
 */
export const formatVolume = (volume: number): string => {
  if (volume >= 1000000) {
    return `${(volume / 1000000).toFixed(2)}M`;
  }
  if (volume >= 1000) {
    return `${(volume / 1000).toFixed(2)}K`;
  }
  return volume.toFixed(2);
};

/**
 * Convert Binance kline message to CandlestickData
 */
export const transformKlineData = (message: BinanceKlineMessage): CandlestickData => {
  const { k } = message;
  return {
    timestamp: k.t,
    open: parseFloat(k.o),
    high: parseFloat(k.h),
    low: parseFloat(k.l),
    close: parseFloat(k.c),
    volume: parseFloat(k.v)
  };
};

/**
 * Convert Binance REST API kline array to CandlestickData
 */
export const transformRestKlineData = (kline: any[]): CandlestickData => {
  return {
    timestamp: kline[0],
    open: parseFloat(kline[1]),
    high: parseFloat(kline[2]),
    low: parseFloat(kline[3]),
    close: parseFloat(kline[4]),
    volume: parseFloat(kline[5])
  };
};

/**
 * Get price change color class
 */
export const getPriceChangeColor = (change: number): string => {
  if (change > 0) return 'text-bull';
  if (change < 0) return 'text-bear';
  return 'text-neutral-500';
};

/**
 * Get background color for price change
 */
export const getPriceChangeBgColor = (change: number): string => {
  if (change > 0) return 'bg-bull/10';
  if (change < 0) return 'bg-bear/10';
  return 'bg-neutral-100';
};

/**
 * Debounce function for performance optimization
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(null, args), wait);
  };
};

/**
 * Throttle function for performance optimization
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func.apply(null, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * Calculate exponential backoff delay
 */
export const calculateBackoffDelay = (
  attempt: number,
  baseDelay: number = 1000,
  maxDelay: number = 30000
): number => {
  const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
  // Add jitter to prevent thundering herd
  return delay + Math.random() * 1000;
};

/**
 * Validate if a string is a valid JSON
 */
export const isValidJSON = (str: string): boolean => {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
};

/**
 * Get trading pair from symbol
 */
export const getPairFromSymbol = (symbol: string): { base: string; quote: string } => {
  // Simple implementation for USDT pairs
  if (symbol.endsWith('USDT')) {
    return {
      base: symbol.replace('USDT', ''),
      quote: 'USDT'
    };
  }
  return { base: symbol, quote: '' };
};

/**
 * Generate WebSocket stream name
 */
export const generateStreamName = (symbol: string, interval: string): string => {
  return `${symbol.toLowerCase()}@kline_${interval}`;
};

/**
 * Safe number parsing with fallback
 */
export const safeParseFloat = (value: string | number, fallback: number = 0): number => {
  const parsed = typeof value === 'string' ? parseFloat(value) : value;
  return isNaN(parsed) ? fallback : parsed;
};

/**
 * Format timestamp to readable string
 */
export const formatTimestamp = (timestamp: number, options?: Intl.DateTimeFormatOptions): string => {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    ...options
  };
  return new Date(timestamp).toLocaleTimeString(undefined, defaultOptions);
};