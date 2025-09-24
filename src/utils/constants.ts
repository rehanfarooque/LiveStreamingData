import { TradingPair, TimeInterval } from '@/types';

export const SUPPORTED_PAIRS: TradingPair[] = [
  // Major Cryptocurrencies
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

  // Top Altcoins
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
    symbol: 'XRPUSDT',
    baseAsset: 'XRP',
    quoteAsset: 'USDT',
    displayName: 'XRP / USDT'
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
  },
  {
    symbol: 'UNIUSDT',
    baseAsset: 'UNI',
    quoteAsset: 'USDT',
    displayName: 'Uniswap / USDT'
  },

  // DeFi Tokens
  {
    symbol: 'AAVEUSDT',
    baseAsset: 'AAVE',
    quoteAsset: 'USDT',
    displayName: 'Aave / USDT'
  },
  {
    symbol: 'MKRUSDT',
    baseAsset: 'MKR',
    quoteAsset: 'USDT',
    displayName: 'Maker / USDT'
  },
  {
    symbol: 'COMPUSDT',
    baseAsset: 'COMP',
    quoteAsset: 'USDT',
    displayName: 'Compound / USDT'
  },
  {
    symbol: 'CRVUSDT',
    baseAsset: 'CRV',
    quoteAsset: 'USDT',
    displayName: 'Curve / USDT'
  },

  // Layer 1 & Layer 2
  {
    symbol: 'NEARUSDT',
    baseAsset: 'NEAR',
    quoteAsset: 'USDT',
    displayName: 'NEAR Protocol / USDT'
  },
  {
    symbol: 'ATOMUSDT',
    baseAsset: 'ATOM',
    quoteAsset: 'USDT',
    displayName: 'Cosmos / USDT'
  },
  {
    symbol: 'ALGOUSDT',
    baseAsset: 'ALGO',
    quoteAsset: 'USDT',
    displayName: 'Algorand / USDT'
  },
  {
    symbol: 'FTMUSDT',
    baseAsset: 'FTM',
    quoteAsset: 'USDT',
    displayName: 'Fantom / USDT'
  },

  // Meme Coins & Popular
  {
    symbol: 'DOGEUSDT',
    baseAsset: 'DOGE',
    quoteAsset: 'USDT',
    displayName: 'Dogecoin / USDT'
  },
  {
    symbol: 'SHIBUSDT',
    baseAsset: 'SHIB',
    quoteAsset: 'USDT',
    displayName: 'Shiba Inu / USDT'
  },
  {
    symbol: 'PEPEUSDT',
    baseAsset: 'PEPE',
    quoteAsset: 'USDT',
    displayName: 'Pepe / USDT'
  },

  // Enterprise & Institutional
  {
    symbol: 'XLMUSDT',
    baseAsset: 'XLM',
    quoteAsset: 'USDT',
    displayName: 'Stellar / USDT'
  },
  {
    symbol: 'TRXUSDT',
    baseAsset: 'TRX',
    quoteAsset: 'USDT',
    displayName: 'TRON / USDT'
  },
  {
    symbol: 'ETCUSDT',
    baseAsset: 'ETC',
    quoteAsset: 'USDT',
    displayName: 'Ethereum Classic / USDT'
  },
  {
    symbol: 'BCHUSDT',
    baseAsset: 'BCH',
    quoteAsset: 'USDT',
    displayName: 'Bitcoin Cash / USDT'
  },

  // Gaming & Metaverse
  {
    symbol: 'SANDUSDT',
    baseAsset: 'SAND',
    quoteAsset: 'USDT',
    displayName: 'The Sandbox / USDT'
  },
  {
    symbol: 'MANAUSDT',
    baseAsset: 'MANA',
    quoteAsset: 'USDT',
    displayName: 'Decentraland / USDT'
  },
  {
    symbol: 'AXSUSDT',
    baseAsset: 'AXS',
    quoteAsset: 'USDT',
    displayName: 'Axie Infinity / USDT'
  },

  // AI & Data
  {
    symbol: 'FETUSDT',
    baseAsset: 'FET',
    quoteAsset: 'USDT',
    displayName: 'Fetch.ai / USDT'
  },
  {
    symbol: 'OCEANUSDT',
    baseAsset: 'OCEAN',
    quoteAsset: 'USDT',
    displayName: 'Ocean Protocol / USDT'
  },
  {
    symbol: 'AIUSDT',
    baseAsset: 'AI',
    quoteAsset: 'USDT',
    displayName: 'Sleepless AI / USDT'
  },

  // Popular & Trending
  {
    symbol: 'ORDIUSDT',
    baseAsset: 'ORDI',
    quoteAsset: 'USDT',
    displayName: 'ORDI / USDT'
  },
  {
    symbol: '1000SATSUSDT',
    baseAsset: '1000SATS',
    quoteAsset: 'USDT',
    displayName: '1000SATS / USDT'
  },
  {
    symbol: 'TIAUSDT',
    baseAsset: 'TIA',
    quoteAsset: 'USDT',
    displayName: 'Celestia / USDT'
  },
  {
    symbol: 'INJUSDT',
    baseAsset: 'INJ',
    quoteAsset: 'USDT',
    displayName: 'Injective / USDT'
  },
  {
    symbol: 'SUIUSDT',
    baseAsset: 'SUI',
    quoteAsset: 'USDT',
    displayName: 'Sui / USDT'
  },
  {
    symbol: 'APTUSDT',
    baseAsset: 'APT',
    quoteAsset: 'USDT',
    displayName: 'Aptos / USDT'
  },
  {
    symbol: 'ARBUSDT',
    baseAsset: 'ARB',
    quoteAsset: 'USDT',
    displayName: 'Arbitrum / USDT'
  },
  {
    symbol: 'OPUSDT',
    baseAsset: 'OP',
    quoteAsset: 'USDT',
    displayName: 'Optimism / USDT'
  },

  // Additional DeFi & Layer 2
  {
    symbol: '1INCHUSDT',
    baseAsset: '1INCH',
    quoteAsset: 'USDT',
    displayName: '1inch / USDT'
  },
  {
    symbol: 'GRTUSDT',
    baseAsset: 'GRT',
    quoteAsset: 'USDT',
    displayName: 'The Graph / USDT'
  },
  {
    symbol: 'LRCUSDT',
    baseAsset: 'LRC',
    quoteAsset: 'USDT',
    displayName: 'Loopring / USDT'
  },
  {
    symbol: 'ENJUSDT',
    baseAsset: 'ENJ',
    quoteAsset: 'USDT',
    displayName: 'Enjin Coin / USDT'
  },
  {
    symbol: 'CHZUSDT',
    baseAsset: 'CHZ',
    quoteAsset: 'USDT',
    displayName: 'Chiliz / USDT'
  },

  // Stablecoins & Major Pairs
  {
    symbol: 'BTCBUSD',
    baseAsset: 'BTC',
    quoteAsset: 'BUSD',
    displayName: 'Bitcoin / BUSD'
  },
  {
    symbol: 'ETHBUSD',
    baseAsset: 'ETH',
    quoteAsset: 'BUSD',
    displayName: 'Ethereum / BUSD'
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
  CONNECTION_TIMEOUT: 10000 // Reduced timeout for faster connection
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