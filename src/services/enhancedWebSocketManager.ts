import { BinanceKlineMessage, CandlestickData, BinanceTradeMessage } from '@/types';
import { BINANCE_WS_URL, WS_CONFIG } from '@/utils/constants';
import {
  transformKlineData,
  generateStreamName,
  calculateBackoffDelay,
  isValidJSON
} from '@/utils/helpers';

type MessageHandler = (data: CandlestickData) => void;
type ConnectionHandler = (status: 'connecting' | 'connected' | 'disconnected' | 'error') => void;

/**
 * ENHANCED MULTI-PRODUCT WEBSOCKET MANAGER
 * Ensures ALL crypto products (ETH, SOL, ADA, etc.) get real-time 1-second streaming like BTC
 */
export class EnhancedWebSocketManager {
  private ws: WebSocket | null = null;
  private messageHandlers = new Map<string, MessageHandler>();
  private connectionHandlers = new Set<ConnectionHandler>();
  private activeStreams = new Set<string>();
  private productSubscriptions = new Map<string, { symbol: string; interval: string; handler: MessageHandler }>();
  private reconnectAttempts = 0;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private isReconnecting = false;
  private baseUrl = 'wss://stream.binance.com:9443/stream';
  private connectionInProgress = false;
  private maxConcurrentStreams = 50; // Memory compliance: Support 50 crypto products simultaneously

  constructor() {
    this.handleMessage = this.handleMessage.bind(this);
    this.handleOpen = this.handleOpen.bind(this);
    this.handleClose = this.handleClose.bind(this);
    this.handleError = this.handleError.bind(this);
  }

  /**
   * ENHANCED MULTI-PRODUCT SUBSCRIBE
   * Ensures real-time 1-second streaming for ALL crypto products (ETH, SOL, ADA, etc.)
   */
  public subscribeMultiProduct(symbol: string, interval: string, handler: MessageHandler): void {
    const subscriptionKey = `${symbol.toUpperCase()}_${interval}`;
    
    console.log(`🚀 MULTI-PRODUCT SUBSCRIBE: ${symbol} ${interval}`);

    // Store this product's subscription for management
    this.productSubscriptions.set(subscriptionKey, { symbol, interval, handler });

    // Generate stream names for BOTH kline and trade data (ultra-fast updates)
    const klineStreamName = generateStreamName(symbol, interval);
    const tradeStreamName = `${symbol.toLowerCase()}@trade`;

    console.log(`  📈 Kline Stream: ${klineStreamName}`);
    console.log(`  ⚡ Trade Stream: ${tradeStreamName}`);

    // Remove old streams for THIS symbol only (preserve other products)
    this.cleanupSymbolStreams(symbol);

    // Add BOTH kline and trade handlers for this product
    this.messageHandlers.set(klineStreamName, handler);
    this.messageHandlers.set(tradeStreamName, handler);
    this.activeStreams.add(klineStreamName);
    this.activeStreams.add(tradeStreamName);

    console.log(`✅ REGISTERED: ${symbol} streams (Total: ${this.activeStreams.size})`);
    console.log(`📡 ACTIVE PRODUCTS: ${this.productSubscriptions.size}`);

    // Connect with all active streams
    this.connectMultiProduct();
  }

  /**
   * Clean up streams for specific symbol while preserving others
   */
  private cleanupSymbolStreams(symbol: string): void {
    const symbolUpper = symbol.toUpperCase();
    const streamsToRemove: string[] = [];

    // Find streams for this specific symbol
    this.activeStreams.forEach(stream => {
      const streamSymbol = stream.split('@')[0].toUpperCase();
      if (streamSymbol === symbolUpper) {
        streamsToRemove.push(stream);
      }
    });

    // Remove old streams for this symbol
    streamsToRemove.forEach(stream => {
      console.log(`🗑️ Removing old stream: ${stream}`);
      this.messageHandlers.delete(stream);
      this.activeStreams.delete(stream);
    });
  }

  /**
   * MULTI-PRODUCT CONNECTION using combined streams
   * Supports up to 50 crypto products simultaneously
   */
  private async connectMultiProduct(): Promise<void> {
    if (this.connectionInProgress) {
      console.log('⏳ Multi-product connection already in progress');
      return;
    }

    if (this.activeStreams.size === 0) {
      console.log('⚠️ No active streams to connect');
      return;
    }

    try {
      this.connectionInProgress = true;
      this.notifyConnectionHandlers('connecting');

      // Close existing connection
      this.disconnect(false);

      // Create combined streams URL for ALL active products
      const allStreams = Array.from(this.activeStreams);
      const streamsParam = allStreams.join('/');
      const wsUrl = `${this.baseUrl}?streams=${streamsParam}`;

      console.log(`🌟 MULTI-PRODUCT: Connecting ${allStreams.length} streams`);
      console.log(`📡 PRODUCTS: ${this.productSubscriptions.size} crypto products`);
      console.log(`🌐 Combined URL: ${wsUrl.substring(0, 100)}...`);

      // Create WebSocket with enhanced error handling
      this.ws = new WebSocket(wsUrl);

      // Connection timeout handling
      const connectionTimeout = setTimeout(() => {
        if (this.ws?.readyState === WebSocket.CONNECTING) {
          console.error(`⏰ Multi-product connection timeout after ${WS_CONFIG.CONNECTION_TIMEOUT}ms`);
          this.ws?.close();
          this.connectionInProgress = false;
        }
      }, WS_CONFIG.CONNECTION_TIMEOUT);

      // Set up event listeners
      this.ws.onopen = () => {
        clearTimeout(connectionTimeout);
        this.connectionInProgress = false;
        this.handleOpen();
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
      };

    } catch (error) {
      console.error('Multi-product connection failed:', error);
      this.connectionInProgress = false;
      this.notifyConnectionHandlers('error');
    }
  }

  /**
   * ENHANCED MESSAGE HANDLING for multi-product real-time streaming
   */
  private handleMessage(event: MessageEvent): void {
    try {
      if (!isValidJSON(event.data)) {
        console.warn('Invalid JSON message received');
        return;
      }

      const data = JSON.parse(event.data);

      // Binance combined streams format: {"stream": "btcusdt@kline_1s", "data": {...}}
      if (data.stream && data.data) {
        const streamName = data.stream;
        const streamData = data.data;

        // Handle kline messages (primary chart updates)
        if (streamData.e === 'kline') {
          this.handleKlineMessage(streamData as BinanceKlineMessage, streamName);
        }
        // Handle trade messages (ultra-fast 1-second updates)
        else if (streamData.e === 'trade') {
          this.handleTradeMessage(streamData as BinanceTradeMessage, streamName);
        }
      }
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }

  /**
   * Handle kline messages for chart updates
   */
  private handleKlineMessage(message: BinanceKlineMessage, streamName: string): void {
    const handlerStreamName = generateStreamName(message.s, message.k.i);
    const handler = this.messageHandlers.get(handlerStreamName);

    if (handler) {
      const candlestickData = transformKlineData(message);
      candlestickData.timestamp = message.k.t;
      (candlestickData as any).symbol = message.s;

      console.log(`📈 KLINE: ${message.s} ${message.k.i} - $${candlestickData.close} @ ${new Date().toLocaleTimeString()}`);
      handler(candlestickData);
    } else {
      console.warn(`⚠️ No kline handler for: ${handlerStreamName}`);
    }
  }

  /**
   * Handle trade messages for ultra-fast updates (1-second streaming)
   */
  private handleTradeMessage(tradeMessage: BinanceTradeMessage, streamName: string): void {
    const tradeStreamName = `${tradeMessage.s.toLowerCase()}@trade`;
    const handler = this.messageHandlers.get(tradeStreamName);

    if (handler) {
      const tradePrice = parseFloat(tradeMessage.p);
      const tradeVolume = parseFloat(tradeMessage.q);

      // Create real-time candle from trade data
      const realtimeCandle: CandlestickData = {
        timestamp: tradeMessage.T,
        open: tradePrice,
        high: tradePrice,
        low: tradePrice,
        close: tradePrice,
        volume: tradeVolume
      };

      (realtimeCandle as any).symbol = tradeMessage.s;

      console.log(`⚡ TRADE: ${tradeMessage.s} - $${tradePrice} @ ${new Date().toLocaleTimeString()}`);
      handler(realtimeCandle);
    }
  }

  /**
   * Handle WebSocket open event
   */
  private handleOpen(): void {
    console.log(`✅ MULTI-PRODUCT CONNECTED: ${this.productSubscriptions.size} crypto products streaming`);
    this.reconnectAttempts = 0;
    this.isReconnecting = false;
    this.notifyConnectionHandlers('connected');
  }

  /**
   * Handle WebSocket close event
   */
  private handleClose(event: CloseEvent): void {
    console.log(`Multi-product WebSocket closed: code=${event.code}, reason="${event.reason}"`);

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
    console.error('❌ Multi-product WebSocket error:', event);
    this.notifyConnectionHandlers('error');
  }

  /**
   * Attempt reconnection with exponential backoff
   */
  private attemptReconnection(): void {
    if (this.reconnectAttempts >= WS_CONFIG.MAX_RECONNECT_ATTEMPTS) {
      console.error(`💥 Max reconnection attempts reached for multi-product streaming`);
      this.notifyConnectionHandlers('error');
      return;
    }

    if (this.isReconnecting || this.connectionInProgress) {
      console.log('⏳ Reconnection already in progress');
      return;
    }

    this.isReconnecting = true;
    this.reconnectAttempts++;

    const delay = calculateBackoffDelay(
      this.reconnectAttempts - 1,
      WS_CONFIG.INITIAL_RECONNECT_DELAY,
      WS_CONFIG.MAX_RECONNECT_DELAY
    );

    console.log(`🔄 Multi-product reconnection attempt ${this.reconnectAttempts}/${WS_CONFIG.MAX_RECONNECT_ATTEMPTS} in ${delay}ms`);

    this.reconnectTimeout = setTimeout(() => {
      this.isReconnecting = false;
      this.connectMultiProduct().catch(error => {
        console.error('❌ Multi-product reconnection failed:', error);
        setTimeout(() => this.attemptReconnection(), delay * 2);
      });
    }, delay);
  }

  /**
   * Disconnect WebSocket
   */
  public disconnect(notify = true): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
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
   * Unsubscribe from specific product
   */
  public unsubscribeProduct(symbol: string, interval: string): void {
    const subscriptionKey = `${symbol.toUpperCase()}_${interval}`;
    
    console.log(`🗑️ UNSUBSCRIBING: ${symbol} ${interval}`);
    
    this.productSubscriptions.delete(subscriptionKey);
    this.cleanupSymbolStreams(symbol);

    if (this.activeStreams.size === 0) {
      console.log('🔌 No products remaining, disconnecting');
      this.disconnect();
    } else {
      console.log(`🚀 Reconnecting with ${this.productSubscriptions.size} remaining products`);
      this.connectMultiProduct();
    }
  }

  /**
   * Add connection status handler
   */
  public onConnectionChange(handler: ConnectionHandler): () => void {
    this.connectionHandlers.add(handler);
    return () => this.connectionHandlers.delete(handler);
  }

  /**
   * Check connection status
   */
  public isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Get connection status
   */
  public getConnectionStatus(): 'connecting' | 'connected' | 'disconnected' | 'error' {
    if (!this.ws) return 'disconnected';

    switch (this.ws.readyState) {
      case WebSocket.CONNECTING: return 'connecting';
      case WebSocket.OPEN: return 'connected';
      case WebSocket.CLOSING:
      case WebSocket.CLOSED: return 'disconnected';
      default: return 'error';
    }
  }

  /**
   * Get active products count
   */
  public getActiveProductsCount(): number {
    return this.productSubscriptions.size;
  }

  /**
   * Get active streams count
   */
  public getActiveStreamsCount(): number {
    return this.activeStreams.size;
  }

  /**
   * Notify connection handlers
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
}

// Export enhanced singleton instance
export const enhancedWebSocketManager = new EnhancedWebSocketManager();
export default enhancedWebSocketManager;