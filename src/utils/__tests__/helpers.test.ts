import {
  formatPrice,
  formatPercentage,
  formatVolume,
  transformKlineData,
  transformRestKlineData,
  getPriceChangeColor,
  getPriceChangeBgColor,
  debounce,
  throttle,
  calculateBackoffDelay,
  isValidJSON,
  getPairFromSymbol,
  generateStreamName,
  safeParseFloat,
  formatTimestamp,
} from '../helpers';

describe('Utility Functions', () => {
  describe('formatPrice', () => {
    it('should format price with default 4 decimal places', () => {
      expect(formatPrice(50000.123456)).toBe('50000.1235');
    });

    it('should format price with custom decimal places', () => {
      expect(formatPrice(50000.123456, 2)).toBe('50000.12');
    });

    it('should handle zero values', () => {
      expect(formatPrice(0)).toBe('0.0000');
    });
  });

  describe('formatPercentage', () => {
    it('should format positive percentage with plus sign', () => {
      expect(formatPercentage(5.25)).toBe('+5.25%');
    });

    it('should format negative percentage with minus sign', () => {
      expect(formatPercentage(-3.75)).toBe('-3.75%');
    });

    it('should format zero percentage', () => {
      expect(formatPercentage(0)).toBe('+0.00%');
    });

    it('should respect custom decimal places', () => {
      expect(formatPercentage(5.256789, 3)).toBe('+5.257%');
    });
  });

  describe('formatVolume', () => {
    it('should format large volumes with M suffix', () => {
      expect(formatVolume(1500000)).toBe('1.50M');
    });

    it('should format medium volumes with K suffix', () => {
      expect(formatVolume(1500)).toBe('1.50K');
    });

    it('should format small volumes without suffix', () => {
      expect(formatVolume(150)).toBe('150.00');
    });
  });

  describe('transformKlineData', () => {
    it('should transform Binance kline message to CandlestickData', () => {
      const mockMessage = {
        e: 'kline' as const,
        E: 1640995200000,
        s: 'BTCUSDT',
        k: {
          t: 1640995200000,
          T: 1640995259999,
          s: 'BTCUSDT',
          i: '1m',
          f: 1,
          L: 100,
          o: '50000.00',
          c: '50500.00',
          h: '51000.00',
          l: '49500.00',
          v: '100.5',
          n: 50,
          x: true,
          q: '5050000.00',
          V: '50.25',
          Q: '2525000.00',
        },
      };

      const result = transformKlineData(mockMessage);
      
      expect(result).toEqual({
        timestamp: 1640995200000,
        open: 50000,
        high: 51000,
        low: 49500,
        close: 50500,
        volume: 100.5,
      });
    });
  });

  describe('transformRestKlineData', () => {
    it('should transform REST API kline array to CandlestickData', () => {
      const mockKline = [
        1640995200000,
        '50000.00',
        '51000.00',
        '49500.00',
        '50500.00',
        '100.5',
      ];

      const result = transformRestKlineData(mockKline);
      
      expect(result).toEqual({
        timestamp: 1640995200000,
        open: 50000,
        high: 51000,
        low: 49500,
        close: 50500,
        volume: 100.5,
      });
    });
  });

  describe('getPriceChangeColor', () => {
    it('should return bull color for positive change', () => {
      expect(getPriceChangeColor(100)).toBe('text-bull');
    });

    it('should return bear color for negative change', () => {
      expect(getPriceChangeColor(-100)).toBe('text-bear');
    });

    it('should return neutral color for zero change', () => {
      expect(getPriceChangeColor(0)).toBe('text-neutral-500');
    });
  });

  describe('getPriceChangeBgColor', () => {
    it('should return bull background for positive change', () => {
      expect(getPriceChangeBgColor(100)).toBe('bg-bull/10');
    });

    it('should return bear background for negative change', () => {
      expect(getPriceChangeBgColor(-100)).toBe('bg-bear/10');
    });

    it('should return neutral background for zero change', () => {
      expect(getPriceChangeBgColor(0)).toBe('bg-neutral-100');
    });
  });

  describe('debounce', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should debounce function calls', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn('test1');
      debouncedFn('test2');
      debouncedFn('test3');

      expect(mockFn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(100);

      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('test3');
    });
  });

  describe('throttle', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should throttle function calls', () => {
      const mockFn = jest.fn();
      const throttledFn = throttle(mockFn, 100);

      throttledFn('test1');
      throttledFn('test2');
      throttledFn('test3');

      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('test1');

      jest.advanceTimersByTime(100);

      throttledFn('test4');
      expect(mockFn).toHaveBeenCalledTimes(2);
      expect(mockFn).toHaveBeenCalledWith('test4');
    });
  });

  describe('calculateBackoffDelay', () => {
    it('should calculate exponential backoff delay', () => {
      expect(calculateBackoffDelay(0, 1000, 30000)).toBeGreaterThan(1000);
      expect(calculateBackoffDelay(0, 1000, 30000)).toBeLessThanOrEqual(2000);
    });

    it('should respect maximum delay', () => {
      const delay = calculateBackoffDelay(10, 1000, 5000);
      expect(delay).toBeLessThanOrEqual(6000); // 5000 + 1000 jitter
    });
  });

  describe('isValidJSON', () => {
    it('should return true for valid JSON', () => {
      expect(isValidJSON('{"test": true}')).toBe(true);
      expect(isValidJSON('[]')).toBe(true);
      expect(isValidJSON('null')).toBe(true);
    });

    it('should return false for invalid JSON', () => {
      expect(isValidJSON('invalid')).toBe(false);
      expect(isValidJSON('{"test"}')).toBe(false);
      expect(isValidJSON('')).toBe(false);
    });
  });

  describe('getPairFromSymbol', () => {
    it('should extract base and quote from USDT symbol', () => {
      expect(getPairFromSymbol('BTCUSDT')).toEqual({
        base: 'BTC',
        quote: 'USDT',
      });
    });

    it('should handle non-USDT symbols', () => {
      expect(getPairFromSymbol('BTCETH')).toEqual({
        base: 'BTCETH',
        quote: '',
      });
    });
  });

  describe('generateStreamName', () => {
    it('should generate correct stream name', () => {
      expect(generateStreamName('BTCUSDT', '1m')).toBe('btcusdt@kline_1m');
    });

    it('should handle case conversion', () => {
      expect(generateStreamName('BtCuSdT', '5m')).toBe('btcusdt@kline_5m');
    });
  });

  describe('safeParseFloat', () => {
    it('should parse valid numbers', () => {
      expect(safeParseFloat('123.45')).toBe(123.45);
      expect(safeParseFloat(67.89)).toBe(67.89);
    });

    it('should return fallback for invalid values', () => {
      expect(safeParseFloat('invalid')).toBe(0);
      expect(safeParseFloat('invalid', 99)).toBe(99);
    });

    it('should handle NaN', () => {
      expect(safeParseFloat(NaN)).toBe(0);
    });
  });

  describe('formatTimestamp', () => {
    it('should format timestamp with default options', () => {
      const timestamp = 1640995200000; // 2022-01-01 00:00:00 UTC
      const formatted = formatTimestamp(timestamp);
      expect(formatted).toMatch(/\d{2}:\d{2}:\d{2}/);
    });

    it('should format timestamp with custom options', () => {
      const timestamp = 1640995200000;
      const formatted = formatTimestamp(timestamp, { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
      expect(formatted).toContain('2022');
    });
  });
});