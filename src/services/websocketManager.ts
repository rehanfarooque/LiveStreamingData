import { BinanceKlineMessage, CandlestickData, BinanceDepthMessage, BinanceTradeMessage, OrderBookData, TradeData } from '@/types';
import { BINANCE_WS_URL, WS_CONFIG } from '@/utils/constants';
import {
  transformKlineData,
  generateStreamName,
  calculateBackoffDelay,
  isValidJSON
} from '@/utils/helpers';

type MessageHandler = (data: CandlestickData) => void;
type OrderBookHandler = (data: OrderBookData) => void;
type TradeHandler = (data: TradeData) => void;
type ConnectionHandler = (status: 'connecting' | 'connected' | 'disconnected' | 'error') => void;

export class WebSocketManager {
  private ws: WebSocket | null = null;
  private messageHandlers = new Map<string, MessageHandler>();
  private orderBookHandlers = new Map<string, OrderBookHandler>();
  private tradeHandlers = new Map<string, TradeHandler>();
  private connectionHandlers = new Set<ConnectionHandler>();
  private activeStreams = new Set<string>();
  private reconnectAttempts = 0;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private isReconnecting = false;
  private baseUrl = 'wss://stream.binance.com:9443/stream';
  private connectionInProgress = false;
  private lastConnectionAttempt = 0;
  private connectionQueue: Array<() => void> = [];
  private isProcessingQueue = false;
  private maxConcurrentStreams = 1; // Only one stream at a time for single product focus
  private connectionBackoffMs = 1000; // Reduced minimum time between connections

  constructor() {
    // Bind methods to preserve 'this' context
    this.handleMessage = this.handleMessage.bind(this);
    this.handleOpen = this.handleOpen.bind(this);
    this.handleClose = this.handleClose.bind(this);
    this.handleError = this.handleError.bind(this);
  }

  /**
   * Connect to Binance WebSocket with improved connection management
   */
  public connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Skip if already connected to the same streams
      if (this.isConnected()) {
        console.log('✅ Already connected to WebSocket');
        resolve();
        return;
      }

      // Skip if connection is in progress
      if (this.connectionInProgress) {
        console.log('⏳ Connection already in progress, skipping...');
        resolve();
        return;
      }

      try {
        this.connectionInProgress = true;
        this.lastConnectionAttempt = Date.now();
        this.notifyConnectionHandlers('connecting');

        // Gracefully close existing connection
        this.disconnect(false);

        const allStreams = Array.from(this.activeStreams);

        if (allStreams.length === 0) {
          console.log('⚠️ No streams to connect to yet');
          this.connectionInProgress = false;
          resolve();
          return;
        }

        const streamsParam = allStreams.join('/');
        const wsUrl = `${this.baseUrl}?streams=${streamsParam}`;

        console.log(`🚀 CONNECTING to ${allStreams.length} streams (attempt ${this.reconnectAttempts + 1})`);
        console.log(`📡 STREAMS REQUESTED:`, allStreams);
        console.log(`🌐 WEBSOCKET URL:`, wsUrl);
        console.log(`🔍 MESSAGE HANDLERS READY:`, Array.from(this.messageHandlers.keys()));

        // Create WebSocket with error handling
        try {
          this.ws = new WebSocket(wsUrl);
        } catch (wsError) {
          console.error('Failed to create WebSocket:', wsError);
          this.connectionInProgress = false;
          this.notifyConnectionHandlers('error');
          reject(wsError);
          return;
        }

        // Shorter connection timeout for faster feedback
        const connectionTimeout = setTimeout(() => {
          if (this.ws?.readyState === WebSocket.CONNECTING) {
            console.error(`⏰ WebSocket connection timeout after ${WS_CONFIG.CONNECTION_TIMEOUT}ms`);
            if (this.ws) {
              this.ws.close();
            }
            this.connectionInProgress = false;
            reject(new Error('WebSocket connection timeout'));
          }
        }, WS_CONFIG.CONNECTION_TIMEOUT);

        // Set up event listeners with proper error handling
        this.ws.onopen = () => {
          clearTimeout(connectionTimeout);
          this.connectionInProgress = false;
          this.handleOpen();
          resolve();
          this.processQueue();
        };

        this.ws.onmessage = this.handleMessage;

        this.ws.onclose = (event) => {
          clearTimeout(connectionTimeout);
          this.connectionInProgress = false;
          this.handleClose(event);
        };

        this.ws.onerror = (event) => {
          clearTimeout(connectionTimeout);
          this.connectionInProgress = false;
          this.handleError(event);
          reject(new Error('WebSocket connection failed'));
        };

      } catch (error) {
        console.error('Failed to setup WebSocket connection:', error);
        this.connectionInProgress = false;
        this.notifyConnectionHandlers('error');
        reject(error);
      }
    });
  }

  /**
   * Process queued connection requests
   */
  private processQueue(): void {
    if (this.isProcessingQueue || this.connectionQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;
    const nextRequest = this.connectionQueue.shift();

    if (nextRequest) {
      setTimeout(() => {
        this.isProcessingQueue = false;
        nextRequest();
      }, 1000); // Delay between queue processing
    } else {
      this.isProcessingQueue = false;
    }
  }

  /**
   * Improved disconnect with option to skip notifications
   */
  public disconnect(notify = true): void {
    // Clear heartbeat
    if ((this as any).heartbeatInterval) {
      clearInterval((this as any).heartbeatInterval);
      (this as any).heartbeatInterval = null;
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      // Remove event listeners to prevent callbacks during cleanup
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onclose = null;
      this.ws.onerror = null;

      if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
        this.ws.close(1000, 'Normal closure');
      }

      this.ws = null;
    }

    this.isReconnecting = false;
    this.connectionInProgress = false;

    if (notify) {
      this.notifyConnectionHandlers('disconnected');
    }
  }

  /**
   * Subscribe with trade stream for ALL crypto products real-time updates
   */
  public subscribe(symbol: string, interval: string, handler: MessageHandler): void {
    const klineStreamName = generateStreamName(symbol, interval);
    const tradeStreamName = `${symbol.toLowerCase()}@trade`;
    const tickerStreamName = `${symbol.toLowerCase()}@ticker`;

    console.log(`🚀 SUBSCRIBING TO ${symbol} ${interval}:`);
    console.log(`  📈 Kline: ${klineStreamName}`);
    console.log(`  ⚡ Trade: ${tradeStreamName}`);
    console.log(`  💰 Ticker: ${tickerStreamName}`);

    // Clear all existing streams and handlers
    this.messageHandlers.clear();
    this.activeStreams.clear();
    this.tradeHandlers.clear();

    // Add handlers for ALL crypto products
    this.messageHandlers.set(klineStreamName, handler);
    this.activeStreams.add(klineStreamName);
    console.log(`✅ Added kline handler for ${symbol}`);

    // Add trade handler for continuous updates
    this.messageHandlers.set(tradeStreamName, handler);
    this.activeStreams.add(tradeStreamName);
    console.log(`✅ Added trade handler for ${symbol}`);

    // Add ticker for price updates
    this.messageHandlers.set(tickerStreamName, handler);
    this.activeStreams.add(tickerStreamName);
    console.log(`✅ Added ticker handler for ${symbol}`);

    console.log(`📡 TOTAL ACTIVE STREAMS (${this.activeStreams.size}):`, Array.from(this.activeStreams));

    // Immediate connection for real-time streaming
    this.connect().catch(error => {
      console.error(`❌ ${symbol} subscription failed:`, error);
    });
  }

  /**
   * Immediate connection for better responsiveness
   */
  private immediateConnect(): void {
    if (!this.isConnected() && !this.connectionInProgress) {
      console.log('🚀 Immediate connection attempt');
      this.connect().catch(error => {
        console.error('❌ Immediate connection failed:', error);
      });
    }
  }

  /**
   * Unsubscribe from stream
   */
  public unsubscribe(symbol: string, interval: string): void {
    const streamName = generateStreamName(symbol, interval);
    console.log('Unsubscribing from stream:', streamName);

    this.messageHandlers.delete(streamName);
    this.activeStreams.delete(streamName);

    // Only disconnect if no more streams are active
    if (this.activeStreams.size === 0) {
      console.log('No more active streams, disconnecting');
      this.disconnect();
    } else {
      // Reconnect with fewer streams
      this.immediateConnect();
    }
  }

  /**
   * Subscribe to order book with stream limit awareness
   */
  public subscribeToOrderBook(symbol: string, handler: OrderBookHandler): void {
    const streamName = `${symbol.toLowerCase()}@depth5@100ms`;
    console.log('Subscribing to order book:', streamName);

    this.orderBookHandlers.set(symbol.toUpperCase(), handler);

    // Check stream limits
    if (this.activeStreams.size >= this.maxConcurrentStreams && !this.activeStreams.has(streamName)) {
      console.warn('⚠️ Order book subscription deferred due to stream limit');
      return;
    }

    this.activeStreams.add(streamName);
    this.debouncedConnect();
  }

  /**
   * Subscribe to trades with stream limit awareness
   */
  public subscribeToTrades(symbol: string, handler: TradeHandler): void {
    const streamName = `${symbol.toLowerCase()}@trade`;
    console.log('Subscribing to trades:', streamName);

    this.tradeHandlers.set(symbol.toUpperCase(), handler);

    // Check stream limits
    if (this.activeStreams.size >= this.maxConcurrentStreams && !this.activeStreams.has(streamName)) {
      console.warn('⚠️ Trade subscription deferred due to stream limit');
      return;
    }

    this.activeStreams.add(streamName);
    this.debouncedConnect();
  }

  /**
   * Add connection status handler
   */
  public onConnectionChange(handler: ConnectionHandler): () => void {
    this.connectionHandlers.add(handler);

    // Return unsubscribe function
    return () => {
      this.connectionHandlers.delete(handler);
    };
  }

  /**
   * Check if WebSocket is connected
   */
  public isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Get current connection status
   */
  public getConnectionStatus(): 'connecting' | 'connected' | 'disconnected' | 'error' {
    if (!this.ws) return 'disconnected';

    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting';
      case WebSocket.OPEN:
        return 'connected';
      case WebSocket.CLOSING:
      case WebSocket.CLOSED:
        return 'disconnected';
      default:
        return 'error';
    }
  }

  /**
   * Handle WebSocket open event
   */
  private handleOpen(): void {
    console.log('✅ WebSocket connected successfully');
    this.reconnectAttempts = 0; // Reset on successful connection
    this.isReconnecting = false;

    this.notifyConnectionHandlers('connected');
    this.setupHeartbeat();
  }

  /**
   * Setup heartbeat with reduced frequency
   */
  private setupHeartbeat(): void {
    // Clear any existing heartbeat
    if ((this as any).heartbeatInterval) {
      clearInterval((this as any).heartbeatInterval);
    }

    // Reduced heartbeat frequency to minimize resource usage
    (this as any).heartbeatInterval = setInterval(() => {
      if (this.isConnected()) {
        console.log('💓 WebSocket connection healthy');
      } else if (this.activeStreams.size > 0 && !this.connectionInProgress) {
        console.warn('⚠️ WebSocket connection lost, attempting recovery...');
        this.attemptReconnection();
      }
    }, WS_CONFIG.HEARTBEAT_INTERVAL);
  }

  /**
   * Handle WebSocket message with extensive debugging
   */
  private handleMessage(event: MessageEvent): void {
    try {
      if (!isValidJSON(event.data)) {
        console.warn('Received invalid JSON message:', event.data);
        return;
      }

      const data = JSON.parse(event.data);
      console.log(`📨 Raw WebSocket message:`, data);

      if (data.data && data.stream) {
        const streamData = data.data;
        const streamName = data.stream;
        console.log(`📺 Processing stream: ${streamName}`, streamData.e || 'unknown event');

        // Handle kline messages for ALL crypto products
        if (streamData.e === 'kline') {
          const message = streamData as BinanceKlineMessage;
          const handlerStreamName = generateStreamName(message.s, message.k.i);
          console.log(`📈 Kline received: ${message.s} ${message.k.i} - looking for handler: ${handlerStreamName}`);
          console.log(`🔍 Available handlers:`, Array.from(this.messageHandlers.keys()));

          const handler = this.messageHandlers.get(handlerStreamName);

          if (handler) {
            const candlestickData = transformKlineData(message);
            candlestickData.timestamp = message.k.t;

            console.log(`✅ KLINE SUCCESS: ${message.s} ${message.k.i} - $${candlestickData.close}`);
            handler(candlestickData);
          } else {
            console.error(`❌ NO HANDLER for ${handlerStreamName}! Available:`, Array.from(this.messageHandlers.keys()));
          }
        }
        // Handle 24hr ticker messages for ALL crypto products
        else if (streamData.e === '24hrTicker') {
          const tickerMessage = streamData as any;
          const tickerStreamName = `${tickerMessage.s.toLowerCase()}@ticker`;
          const handler = this.messageHandlers.get(tickerStreamName);

          if (handler) {
            const currentPrice = parseFloat(tickerMessage.c);
            const candlestickData: CandlestickData = {
              timestamp: tickerMessage.E,
              open: currentPrice,
              high: currentPrice,
              low: currentPrice,
              close: currentPrice,
              volume: parseFloat(tickerMessage.v) || 0
            };

            console.log(`💰 LIVE ${tickerMessage.s} ticker: $${currentPrice}`);
            handler(candlestickData);
          }
        }
        // Handle order book depth messages
        else if (streamData.e === 'depthUpdate') {
          const depthMessage = streamData as BinanceDepthMessage;
          const handler = this.orderBookHandlers.get(depthMessage.s);

          if (handler) {
            const orderBookData: OrderBookData = {
              symbol: depthMessage.s,
              bids: depthMessage.b.map(([price, quantity]) => ({ price, quantity })),
              asks: depthMessage.a.map(([price, quantity]) => ({ price, quantity })),
              lastUpdateId: depthMessage.u,
              timestamp: depthMessage.E
            };

            handler(orderBookData);
          }
        }
        // Handle trade messages for ALL crypto products with TradingView-like streaming
        else if (streamData.e === 'trade') {
          const tradeMessage = streamData as BinanceTradeMessage;
          const tradeStreamName = `${tradeMessage.s.toLowerCase()}@trade`;
          console.log(`⚡ Trade received: ${tradeMessage.s} - looking for handler: ${tradeStreamName}`);

          const handler = this.messageHandlers.get(tradeStreamName);

          if (handler) {
            const tradePrice = parseFloat(tradeMessage.p);
            const tradeVolume = parseFloat(tradeMessage.q);

            // Create REAL-TIME candle from trade data for ALL crypto products
            const realtimeCandle: CandlestickData = {
              timestamp: tradeMessage.T,
              open: tradePrice,
              high: tradePrice,
              low: tradePrice,
              close: tradePrice,
              volume: tradeVolume
            };

            console.log(`✅ TRADE SUCCESS: ${tradeMessage.s} - $${tradePrice} (Vol: ${tradeVolume})`);
            handler(realtimeCandle);
          } else {
            console.error(`❌ NO TRADE HANDLER for ${tradeStreamName}! Available:`, Array.from(this.messageHandlers.keys()));
          }

          // Also handle in trade handlers for order book and trades view
          const tradeHandler = this.tradeHandlers.get(tradeMessage.s);
          if (tradeHandler) {
            const tradeData: TradeData = {
              id: tradeMessage.t,
              price: tradeMessage.p,
              quantity: tradeMessage.q,
              timestamp: tradeMessage.T,
              isBuyerMaker: tradeMessage.m
            };
            tradeHandler(tradeData);
          }
        }
      }
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }

  /**
   * Handle WebSocket close event
   */
  private handleClose(event: CloseEvent): void {
    console.log(`WebSocket closed: code=${event.code}, reason="${event.reason}"`);

    // Attempt reconnection only for unexpected closures
    if (event.code !== 1000 && !this.isReconnecting && this.activeStreams.size > 0) {
      this.attemptReconnection();
    } else {
      this.notifyConnectionHandlers('disconnected');
    }
  }

  /**
   * Handle WebSocket error event
   */
  private handleError(event: Event): void {
    console.error('❌ WebSocket error occurred:', event);
    this.notifyConnectionHandlers('error');
  }

  /**
   * Improved reconnection with exponential backoff and limits
   */
  private attemptReconnection(): void {
    if (this.reconnectAttempts >= WS_CONFIG.MAX_RECONNECT_ATTEMPTS) {
      console.error(`💥 Max reconnection attempts (${WS_CONFIG.MAX_RECONNECT_ATTEMPTS}) reached, giving up`);
      this.notifyConnectionHandlers('error');
      return;
    }

    if (this.isReconnecting || this.connectionInProgress) {
      console.log('⏳ Reconnection already in progress, skipping...');
      return;
    }

    this.isReconnecting = true;
    this.reconnectAttempts++;

    const delay = calculateBackoffDelay(
      this.reconnectAttempts - 1,
      WS_CONFIG.INITIAL_RECONNECT_DELAY,
      WS_CONFIG.MAX_RECONNECT_DELAY
    );

    console.log(`🔄 Attempting reconnection ${this.reconnectAttempts}/${WS_CONFIG.MAX_RECONNECT_ATTEMPTS} in ${delay}ms`);

    this.reconnectTimeout = setTimeout(() => {
      this.isReconnecting = false;
      this.connect().catch(error => {
        console.error('❌ Reconnection failed:', error);
        // Try again with increased delay
        setTimeout(() => this.attemptReconnection(), delay * 2);
      });
    }, delay);
  }

  /**
   * Notify all connection handlers
   */
  private notifyConnectionHandlers(status: 'connecting' | 'connected' | 'disconnected' | 'error'): void {
    this.connectionHandlers.forEach(handler => {
      try {
        handler(status);
      } catch (error) {
        console.error('Connection handler error:', error);
      }
    });
  }

  /**
   * Public method to reset connection state
   */
  public reset(): void {
    console.log('🔄 Resetting WebSocket manager...');
    this.disconnect();
    this.reconnectAttempts = 0;
    this.connectionInProgress = false;
    this.isReconnecting = false;
    this.connectionQueue = [];
    this.isProcessingQueue = false;
    this.lastConnectionAttempt = 0;
  }
}

// Export singleton instance
export const webSocketManager = new WebSocketManager();
export default webSocketManager;