import { BinanceKlineMessage, CandlestickData } from '@/types';
import { BINANCE_WS_URL } from '@/utils/constants';
import { transformKlineData, generateStreamName, isValidJSON } from '@/utils/helpers';

type MessageHandler = (data: CandlestickData) => void;

/**
 * Fallback WebSocket manager that uses individual connections
 * This is used when the combined stream approach fails
 */
export class FallbackWebSocketManager {
  private connections = new Map<string, WebSocket>();
  private handlers = new Map<string, MessageHandler>();
  private reconnectTimeouts = new Map<string, NodeJS.Timeout>();

  /**
   * Subscribe to individual stream
   */
  public subscribe(symbol: string, interval: string, handler: MessageHandler): void {
    const streamName = generateStreamName(symbol, interval);
    console.log('🔄 Fallback: Subscribing to individual stream:', streamName);

    // Store handler
    this.handlers.set(streamName, handler);

    // Close existing connection if any
    this.disconnect(streamName);

    // Create individual WebSocket connection
    const wsUrl = `${BINANCE_WS_URL}/${streamName}`;
    console.log('🌐 Fallback WebSocket URL:', wsUrl);

    try {
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log(`✅ Fallback connection established for ${streamName}`);
      };

      ws.onmessage = (event) => {
        this.handleMessage(event, streamName);
      };

      ws.onclose = (event) => {
        console.log(`Fallback connection closed for ${streamName}: ${event.code}`);
        // Auto-reconnect after delay
        this.scheduleReconnect(symbol, interval, handler);
      };

      ws.onerror = (error) => {
        console.error(`Fallback connection error for ${streamName}:`, error);
      };

      this.connections.set(streamName, ws);

    } catch (error) {
      console.error('Failed to create fallback WebSocket:', error);
      // Retry after delay
      this.scheduleReconnect(symbol, interval, handler);
    }
  }

  /**
   * Disconnect specific stream
   */
  public disconnect(streamName: string): void {
    const ws = this.connections.get(streamName);
    if (ws) {
      ws.close(1000, 'Manual disconnect');
      this.connections.delete(streamName);
    }

    const timeout = this.reconnectTimeouts.get(streamName);
    if (timeout) {
      clearTimeout(timeout);
      this.reconnectTimeouts.delete(streamName);
    }
  }

  /**
   * Disconnect all connections
   */
  public disconnectAll(): void {
    this.connections.forEach((ws, streamName) => {
      ws.close(1000, 'Disconnect all');
    });
    this.connections.clear();

    this.reconnectTimeouts.forEach((timeout) => {
      clearTimeout(timeout);
    });
    this.reconnectTimeouts.clear();

    this.handlers.clear();
  }

  /**
   * Schedule reconnection
   */
  private scheduleReconnect(symbol: string, interval: string, handler: MessageHandler): void {
    const streamName = generateStreamName(symbol, interval);

    // Clear existing timeout
    const existingTimeout = this.reconnectTimeouts.get(streamName);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Schedule reconnect
    const timeout = setTimeout(() => {
      console.log(`🔄 Fallback: Reconnecting to ${streamName}...`);
      this.subscribe(symbol, interval, handler);
    }, 5000);

    this.reconnectTimeouts.set(streamName, timeout);
  }

  /**
   * Handle WebSocket message
   */
  private handleMessage(event: MessageEvent, expectedStream: string): void {
    try {
      if (!isValidJSON(event.data)) {
        console.warn('Fallback: Received invalid JSON message');
        return;
      }

      const data = JSON.parse(event.data);

      // Individual stream format
      if (data.e === 'kline') {
        const message = data as BinanceKlineMessage;
        const handler = this.handlers.get(expectedStream);

        if (handler) {
          const candlestickData = transformKlineData(message);
          candlestickData.timestamp = message.k.t;

          console.log(`📈 Fallback data: ${message.s} ${message.k.i} - $${candlestickData.close}`);
          handler(candlestickData);
        }
      }
    } catch (error) {
      console.error('Fallback: Failed to parse WebSocket message:', error);
    }
  }

  /**
   * Check if stream is connected
   */
  public isConnected(symbol: string, interval: string): boolean {
    const streamName = generateStreamName(symbol, interval);
    const ws = this.connections.get(streamName);
    return ws?.readyState === WebSocket.OPEN;
  }
}

// Export singleton instance
export const fallbackWebSocketManager = new FallbackWebSocketManager();
export default fallbackWebSocketManager;