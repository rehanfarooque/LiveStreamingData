import { TradingPair, TimeInterval } from '@/types';

export const SUPPORTED_PAIRS: TradingPair[] = [
  {
    symbol: 'BTCUSDT',
    baseAsset: 'BTC',
    quoteAsset: 'USDT',
    displayName: 'Bitcoin / USDT'
  },
  {
    symbol: 'ETHUSDT',
    baseAsset: 'ETH',
    quoteAsset: 'USDT',
    displayName: 'Ethereum / USDT'
  },
  {
    symbol: 'BNBUSDT',
    baseAsset: 'BNB',
    quoteAsset: 'USDT',
    displayName: 'Binance Coin / USDT'
  },
  {
    symbol: 'ADAUSDT',
    baseAsset: 'ADA',
    quoteAsset: 'USDT',
    displayName: 'Cardano / USDT'
  },
  {
    symbol: 'SOLUSDT',
    baseAsset: 'SOL',
    quoteAsset: 'USDT',
    displayName: 'Solana / USDT'
  },
  {
    symbol: 'DOTUSDT',
    baseAsset: 'DOT',
    quoteAsset: 'USDT',
    displayName: 'Polkadot / USDT'
  },
  {
    symbol: 'LINKUSDT',
    baseAsset: 'LINK',
    quoteAsset: 'USDT',
    displayName: 'Chainlink / USDT'
  },
  {
    symbol: 'MATICUSDT',
    baseAsset: 'MATIC',
    quoteAsset: 'USDT',
    displayName: 'Polygon / USDT'
  },
  {
    symbol: 'AVAXUSDT',
    baseAsset: 'AVAX',
    quoteAsset: 'USDT',
    displayName: 'Avalanche / USDT'
  },
  {
    symbol: 'LTCUSDT',
    baseAsset: 'LTC',
    quoteAsset: 'USDT',
    displayName: 'Litecoin / USDT'
  }
];

export const SUPPORTED_INTERVALS: TimeInterval[] = ['1s', '5s', '1m', '5m', '15m', '1h', '4h', '1d'];

export const INTERVAL_DISPLAY_NAMES: Record<TimeInterval, string> = {
  '1s': '1 Second',
  '5s': '5 Seconds',
  '1m': '1 Minute',
  '5m': '5 Minutes',
  '15m': '15 Minutes',
  '1h': '1 Hour',
  '4h': '4 Hours',
  '1d': '1 Day'
};

export const BINANCE_BASE_URL = 'https://api.binance.com';
export const BINANCE_WS_URL = 'wss://stream.binance.com:9443/ws';
export const BINANCE_COMBINED_WS_URL = 'wss://stream.binance.com:9443/stream';

export const CHART_CONFIG = {
  MAX_DATA_POINTS: 500,
  UPDATE_THROTTLE_MS: 0,   // No throttling for TradingView-like streaming
  ANIMATION_DURATION: 0,   // No animations for instant updates
  RETENTION_WINDOW_HOURS: 24,
  DEFAULT_CANDLE_LIMIT: 200
};

export const WS_CONFIG = {
  MAX_RECONNECT_ATTEMPTS: 5,
  INITIAL_RECONNECT_DELAY: 5000,
  MAX_RECONNECT_DELAY: 30000,
  HEARTBEAT_INTERVAL: 60000,
  CONNECTION_TIMEOUT: 20000
};

export const UI_CONFIG = {
  PRICE_DECIMAL_PLACES: 4,
  VOLUME_DECIMAL_PLACES: 2,
  PERCENTAGE_DECIMAL_PLACES: 2,
  ANIMATION_DURATION: 300
};

export const COLORS = {
  BULL: '#10b981',
  BEAR: '#ef4444',
  NEUTRAL: '#6b7280',
  BACKGROUND: {
    LIGHT: '#ffffff',
    DARK: '#1f2937'
  },
  TEXT: {
    LIGHT: '#111827',
    DARK: '#f9fafb'
  }
};