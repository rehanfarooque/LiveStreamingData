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
  private maxConcurrentStreams = 50; // Support multi-product streaming as per memory requirements
  private connectionBackoffMs = 1000; // Reduced minimum time between connections

  constructor() {
    // Bind methods to preserve 'this' context
    this.handleMessage = this.handleMessage.bind(this);
    this.handleOpen = this.handleOpen.bind(this);
    this.handleClose = this.handleClose.bind(this);
    this.handleError = this.handleError.bind(this);
  }

  /**
   * Connect to Binance WebSocket using combined streams format for multiple products
   */
  public connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Skip if already connected and streams match
      if (this.isConnected() && this.activeStreams.size > 0) {
        console.log('✅ Already connected with active streams');
        resolve();
        return;
      }

      // Skip if connection is in progress
      if (this.connectionInProgress) {
        console.log('⏳ Connection already in progress');
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

        // Use Binance combined streams format for multiple products
        const streamsParam = allStreams.join('/');
        const wsUrl = `${this.baseUrl}?streams=${streamsParam}`;

        console.log(`🚀 BINANCE COMBINED STREAMS: Connecting to ${allStreams.length} streams`);
        console.log(`📡 STREAMS:`, allStreams);
        console.log(`🌐 URL:`, wsUrl);

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

        // Connection timeout
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

        // Set up event listeners
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
   * FIXED: Multi-product subscribe supporting all crypto products with proper stream management
   */
  public subscribe(symbol: string, interval: string, handler: MessageHandler): void {
    const klineStreamName = generateStreamName(symbol, interval);
    const tradeStreamName = `${symbol.toLowerCase()}@trade`;
    
    console.log(`🚀 BINANCE SUBSCRIBE: ${symbol} ${interval}`);
    console.log(`  📈 Kline: ${klineStreamName}`);
    console.log(`  ⚡ Trade: ${tradeStreamName}`);

    // Remove only existing streams for THIS specific symbol (not all symbols)
    const existingStreams = Array.from(this.activeStreams);
    const symbolStreams = existingStreams.filter(stream => {
      const streamSymbol = stream.split('@')[0].toUpperCase();
      return streamSymbol === symbol.toUpperCase();
    });
    
    symbolStreams.forEach(stream => {
      console.log(`🗑️ Removing old stream: ${stream}`);
      this.messageHandlers.delete(stream);
      this.activeStreams.delete(stream);
    });

    // Add kline stream handler
    this.messageHandlers.set(klineStreamName, handler);
    this.activeStreams.add(klineStreamName);
    console.log(`✅ Added kline: ${klineStreamName}`);

    // Add trade stream handler for real-time updates
    this.messageHandlers.set(tradeStreamName, handler);
    this.activeStreams.add(tradeStreamName);
    console.log(`✅ Added trade: ${tradeStreamName}`);

    console.log(`📡 TOTAL STREAMS: ${this.activeStreams.size}`);
    console.log(`🔍 ACTIVE STREAMS:`, Array.from(this.activeStreams));
    console.log(`🔍 MESSAGE HANDLERS:`, Array.from(this.messageHandlers.keys()));

    // Connect with proper error handling
    this.connect().then(() => {
      console.log(`✅ ${symbol} connected successfully`);
    }).catch(error => {
      console.error(`❌ CONNECTION FAILED: ${symbol} -`, error.message);
      // Retry connection after short delay
      setTimeout(() => {
        console.log(`🔄 Retrying connection for ${symbol}...`);
        this.connect().catch(retryError => {
          console.error(`❌ RETRY FAILED: ${symbol} -`, retryError.message);
        });
      }, 3000);
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
   * FIXED: Unsubscribe specific symbol streams while maintaining others
   */
  public unsubscribe(symbol: string, interval: string): void {
    const klineStreamName = generateStreamName(symbol, interval);
    const tradeStreamName = `${symbol.toLowerCase()}@trade`;
    
    console.log(`🗑️ UNSUBSCRIBING: ${symbol} ${interval}`);
    console.log(`  📈 Removing: ${klineStreamName}`);
    console.log(`  ⚡ Removing: ${tradeStreamName}`);

    // Remove only streams for this specific symbol
    this.messageHandlers.delete(klineStreamName);
    this.activeStreams.delete(klineStreamName);
    this.messageHandlers.delete(tradeStreamName);
    this.activeStreams.delete(tradeStreamName);

    console.log(`📡 REMAINING STREAMS: ${this.activeStreams.size}`);
    console.log(`🔍 REMAINING:`, Array.from(this.activeStreams));

    // Only disconnect if NO streams remain, otherwise reconnect with updated streams
    if (this.activeStreams.size === 0) {
      console.log('🔌 No streams remaining, disconnecting WebSocket');
      this.disconnect();
    } else {
      console.log(`🚀 Reconnecting with ${this.activeStreams.size} remaining streams`);
      // Reconnect with updated stream list
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
    this.immediateConnect();
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
    this.immediateConnect();
  }

  /**
   * BULK SUBSCRIPTION: Subscribe to multiple products at once for efficient multi-product monitoring
   */
  public subscribeBulk(symbols: string[], handler: MessageHandler): void {
    console.log(`🚀 BULK SUBSCRIPTION: ${symbols.length} products`);

    symbols.forEach(symbol => {
      // Subscribe to both ticker and miniTicker for comprehensive price updates
      const tickerStreamName = `${symbol.toLowerCase()}@ticker`;
      const miniTickerStreamName = `${symbol.toLowerCase()}@miniTicker`;

      console.log(`📈 BULK: Adding ${tickerStreamName}`);
      console.log(`⚡ BULK: Adding ${miniTickerStreamName}`);

      this.messageHandlers.set(tickerStreamName, handler);
      this.messageHandlers.set(miniTickerStreamName, handler);
      this.activeStreams.add(tickerStreamName);
      this.activeStreams.add(miniTickerStreamName);
    });

    console.log(`📡 TOTAL ACTIVE STREAMS: ${this.activeStreams.size}`);

    // Connect with all streams
    this.connect().then(() => {
      console.log(`✅ BULK: ${symbols.length} products connected successfully`);
    }).catch(error => {
      console.error(`❌ BULK: Connection failed:`, error);
    });
  }

  /**
   * BULK UNSUBSCRIPTION: Remove multiple products at once
   */
  public unsubscribeBulk(symbols: string[]): void {
    console.log(`🗑️ BULK UNSUBSCRIPTION: ${symbols.length} products`);

    symbols.forEach(symbol => {
      const tickerStreamName = `${symbol.toLowerCase()}@ticker`;
      const miniTickerStreamName = `${symbol.toLowerCase()}@miniTicker`;

      this.messageHandlers.delete(tickerStreamName);
      this.messageHandlers.delete(miniTickerStreamName);
      this.activeStreams.delete(tickerStreamName);
      this.activeStreams.delete(miniTickerStreamName);

      console.log(`🗑️ BULK: Removed ${tickerStreamName}`);
      console.log(`🗑️ BULK: Removed ${miniTickerStreamName}`);
    });

    console.log(`📡 REMAINING STREAMS: ${this.activeStreams.size}`);

    // Reconnect with updated stream list if any streams remain
    if (this.activeStreams.size > 0) {
      this.immediateConnect();
    } else {
      this.disconnect();
    }
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
   * Handle WebSocket message with Binance combined stream format
   */
  private handleMessage(event: MessageEvent): void {
    try {
      if (!isValidJSON(event.data)) {
        console.warn('Received invalid JSON message:', event.data);
        return;
      }

      const data = JSON.parse(event.data);
      
      // Binance combined streams format: {"stream": "btcusdt@kline_1s", "data": {...}}
      if (data.stream && data.data) {
        const streamName = data.stream;
        const streamData = data.data;
        
        console.log(`📺 BINANCE STREAM: ${streamName}`, streamData.e || 'unknown event');

        // Handle kline messages with enhanced processing
        if (streamData.e === 'kline') {
          const message = streamData as BinanceKlineMessage;
          const handlerStreamName = generateStreamName(message.s, message.k.i);
          
          console.log(`📈 KLINE DATA: ${message.s} ${message.k.i} - $${message.k.c} (${new Date(message.k.t).toLocaleTimeString()})`);
          console.log(`🔍 Looking for handler: ${handlerStreamName}`);

          const handler = this.messageHandlers.get(handlerStreamName);

          if (handler) {
            const candlestickData = transformKlineData(message);
            candlestickData.timestamp = message.k.t;

            // Add symbol for verification
            (candlestickData as any).symbol = message.s;

            console.log(`✅ LIVE KLINE: ${message.s} ${message.k.i} - $${candlestickData.close} @ ${new Date().toLocaleTimeString()}`);
            handler(candlestickData);
          } else {
            console.error(`❌ NO HANDLER for ${handlerStreamName}!`);
            console.log(`📋 Available:`, Array.from(this.messageHandlers.keys()));
          }
        }
        // Handle trade messages for real-time updates
        else if (streamData.e === 'trade') {
          const tradeMessage = streamData as BinanceTradeMessage;
          const tradeStreamName = `${tradeMessage.s.toLowerCase()}@trade`;
          
          console.log(`⚡ TRADE: ${tradeMessage.s} - $${tradeMessage.p}`);
          
          // Handle kline handler (for chart updates)
          const klineHandler = this.messageHandlers.get(tradeStreamName);
          if (klineHandler) {
            const tradePrice = parseFloat(tradeMessage.p);
            const tradeVolume = parseFloat(tradeMessage.q);

            const realtimeCandle: CandlestickData = {
              timestamp: tradeMessage.T,
              open: tradePrice,
              high: tradePrice,
              low: tradePrice,
              close: tradePrice,
              volume: tradeVolume
            };

            // Add symbol for verification
            (realtimeCandle as any).symbol = tradeMessage.s;

            console.log(`✅ TRADE SUCCESS: ${tradeMessage.s} - $${tradePrice}`);
            klineHandler(realtimeCandle);
          } else {
            console.error(`❌ NO TRADE HANDLER for ${tradeStreamName}!`);
          }

          // Handle dedicated trade handlers (for live trades component)
          const tradeHandler = this.tradeHandlers.get(tradeMessage.s);
          if (tradeHandler) {
            const tradeData: TradeData = {
              id: tradeMessage.t,
              price: tradeMessage.p,
              quantity: tradeMessage.q,
              timestamp: tradeMessage.T,
              isBuyerMaker: tradeMessage.m
            };
            
            // Add symbol to trade data for filtering
            (tradeData as any).symbol = tradeMessage.s;
            
            console.log(`✅ LIVE TRADE: ${tradeMessage.s} - $${tradeMessage.p} @ ${new Date(tradeMessage.T).toLocaleTimeString()}`);
            tradeHandler(tradeData);
          } else {
            console.warn(`⚠️ NO LIVE TRADE HANDLER for ${tradeMessage.s}`);
          }
        }
        // Handle 24hr ticker messages (enhanced for multi-product support)
        else if (streamData.e === '24hrTicker') {
          const tickerMessage = streamData as any;
          const tickerStreamName = `${tickerMessage.s.toLowerCase()}@ticker`;

          console.log(`💰 TICKER: ${tickerMessage.s} - $${tickerMessage.c} (${tickerMessage.P}%)`);

          const handler = this.messageHandlers.get(tickerStreamName);

          if (handler) {
            const currentPrice = parseFloat(tickerMessage.c);
            const priceChange = parseFloat(tickerMessage.p);
            const priceChangePercent = parseFloat(tickerMessage.P);

            const candlestickData: CandlestickData = {
              timestamp: tickerMessage.E,
              open: parseFloat(tickerMessage.o) || currentPrice,
              high: parseFloat(tickerMessage.h) || currentPrice,
              low: parseFloat(tickerMessage.l) || currentPrice,
              close: currentPrice,
              volume: parseFloat(tickerMessage.v) || 0
            };

            // Add additional ticker data for multi-product grid
            (candlestickData as any).symbol = tickerMessage.s;
            (candlestickData as any).priceChange = priceChange;
            (candlestickData as any).priceChangePercent = priceChangePercent;
            (candlestickData as any).count = tickerMessage.n || 0;
            (candlestickData as any).quoteVolume = parseFloat(tickerMessage.q) || 0;

            console.log(`✅ TICKER SUCCESS: ${tickerMessage.s} - $${currentPrice} (${priceChangePercent >= 0 ? '+' : ''}${priceChangePercent.toFixed(2)}%)`);
            handler(candlestickData);
          }
        }
        // Handle miniTicker messages (more frequent updates)
        else if (streamData.e === '24hrMiniTicker') {
          const miniTickerMessage = streamData as any;
          const miniTickerStreamName = `${miniTickerMessage.s.toLowerCase()}@miniticker`;

          console.log(`⚡ MINI-TICKER: ${miniTickerMessage.s} - $${miniTickerMessage.c} (${miniTickerMessage.P}%)`);

          const handler = this.messageHandlers.get(miniTickerStreamName);

          if (handler) {
            const currentPrice = parseFloat(miniTickerMessage.c);
            const priceChangePercent = parseFloat(miniTickerMessage.P);

            const candlestickData: CandlestickData = {
              timestamp: miniTickerMessage.E,
              open: parseFloat(miniTickerMessage.o) || currentPrice,
              high: parseFloat(miniTickerMessage.h) || currentPrice,
              low: parseFloat(miniTickerMessage.l) || currentPrice,
              close: currentPrice,
              volume: parseFloat(miniTickerMessage.v) || 0
            };

            // Add additional ticker data
            (candlestickData as any).symbol = miniTickerMessage.s;
            (candlestickData as any).priceChangePercent = priceChangePercent;
            (candlestickData as any).quoteVolume = parseFloat(miniTickerMessage.q) || 0;

            console.log(`✅ MINI-TICKER SUCCESS: ${miniTickerMessage.s} - $${currentPrice} (${priceChangePercent >= 0 ? '+' : ''}${priceChangePercent.toFixed(2)}%)`);
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
      } else {
        console.warn('Unexpected message format:', data);
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