export interface TradingPair {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  displayName: string;
}

export interface CandlestickData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketStats {
  symbol: string;
  priceChange: string;
  priceChangePercent: string;
  weightedAvgPrice: string;
  prevClosePrice: string;
  lastPrice: string;
  lastQty: string;
  bidPrice: string;
  askPrice: string;
  openPrice: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  quoteVolume: string;
  openTime: number;
  closeTime: number;
  firstId: number;
  lastId: number;
  count: number;
}

export interface BinanceKlineMessage {
  e: 'kline';
  E: number;
  s: string;
  k: {
    t: number;         // Kline start time
    T: number;         // Kline close time
    s: string;         // Symbol
    i: string;         // Interval
    f: number;         // First trade ID
    L: number;         // Last trade ID
    o: string;         // Open price
    c: string;         // Close price
    h: string;         // High price
    l: string;         // Low price
    v: string;         // Base asset volume
    n: number;         // Number of trades
    x: boolean;        // Is this kline closed?
    q: string;         // Quote asset volume
    V: string;         // Taker buy base asset volume
    Q: string;         // Taker buy quote asset volume
  };
}

export interface ChartProps {
  data: CandlestickData[];
  chartType: 'candlestick' | 'line' | 'ohlc';
  isLoading: boolean;
  onZoomChange?: (zoomLevel: number) => void;
}

export interface PairSelectorProps {
  selectedPair: TradingPair;
  availablePairs: TradingPair[];
  onChange: (pair: TradingPair) => void;
}

export interface IntervalSelectorProps {
  selectedInterval: string;
  availableIntervals: string[];
  onChange: (interval: string) => void;
}

export interface MarketInfoProps {
  currentPrice: number;
  priceChange: number;
  priceChangePercent: number;
  volume: number;
  isLoading?: boolean;
}

export interface WebSocketContextType {
  isConnected: boolean;
  subscribe: (symbol: string, interval: string) => void;
  unsubscribe: (symbol: string, interval: string) => void;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
}

export interface ChartDataContextType {
  candlestickData: CandlestickData[];
  isLoading: boolean;
  error: string | null;
  updateData: (newData: CandlestickData) => void;
  setData: (data: CandlestickData[]) => void;
  clearData: () => void;
}

export interface UserPreferencesContextType {
  theme: 'light' | 'dark';
  defaultPair: TradingPair;
  defaultInterval: string;
  chartType: 'candlestick' | 'line' | 'ohlc';
  setTheme: (theme: 'light' | 'dark') => void;
  setDefaultPair: (pair: TradingPair) => void;
  setDefaultInterval: (interval: string) => void;
  setChartType: (type: 'candlestick' | 'line' | 'ohlc') => void;
}

export type TimeInterval = '1s' | '5s' | '1m' | '5m' | '15m' | '1h' | '4h' | '1d';

export interface APIError {
  code: number;
  message: string;
  timestamp: number;
}

export interface WebSocketState {
  connection: WebSocket | null;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
  reconnectDelay: number;
  isReconnecting: boolean;
}

export interface ChartConfiguration {
  maxDataPoints: number;
  updateThrottleMs: number;
  animationDuration: number;
  retentionWindowHours: number;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: any;
}

export interface OrderBookLevel {
  price: string;
  quantity: string;
}

export interface OrderBookData {
  symbol: string;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  lastUpdateId: number;
  timestamp: number;
}

export interface BinanceDepthMessage {
  e: 'depthUpdate';
  E: number;
  s: string;
  U: number;
  u: number;
  b: [string, string][];
  a: [string, string][];
}

export interface TradeData {
  id: number;
  price: string;
  quantity: string;
  timestamp: number;
  isBuyerMaker: boolean;
}

export interface BinanceTradeMessage {
  e: 'trade';
  E: number;
  s: string;
  t: number;
  p: string;
  q: string;
  b: number;
  a: number;
  T: number;
  m: boolean;
}