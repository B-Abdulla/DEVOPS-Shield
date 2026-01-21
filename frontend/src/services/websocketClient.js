/**
 * WebSocket Client for Real-time Updates
 * Connects to backend WebSocket for live pipeline updates and alerts
 */

// Convert HTTP/HTTPS to WS/WSS for WebSocket URLs
function getWebSocketURL(httpUrl = null) {
  const apiUrl = httpUrl || process.env.REACT_APP_API_URL || 'http://localhost:8000';
  
  // Convert http -> ws, https -> wss
  let wsUrl = apiUrl.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:');
  
  // Ensure it ends with /ws
  if (!wsUrl.endsWith('/ws')) {
    wsUrl += '/ws';
  }
  
  return wsUrl;
}

class WebSocketClient {
  constructor() {
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000;
    this.listeners = new Map();
    this.isConnecting = false;
    this.wsUrl = getWebSocketURL();
  }

  connect(url = null) {
    const connectUrl = url || this.wsUrl || getWebSocketURL();
    
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    this.isConnecting = true;

    try {
      this.ws = new WebSocket(connectUrl);

      this.ws.onopen = () => {
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.emit('connected', { timestamp: new Date().toISOString() });
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('📨 WebSocket Message:', message);
          
          // Emit event based on message type
          if (message.type) {
            this.emit(message.type, message.data || message);
          }
          
          // Emit generic message event
          this.emit('message', message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('❌ WebSocket Error:', error);
        this.emit('error', error);
      };

      this.ws.onclose = () => {
        console.log('❌ WebSocket Disconnected');
        this.isConnecting = false;
        this.emit('disconnected');

        // Attempt reconnection
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          console.log(`🔄 Reconnecting... (Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
          setTimeout(() => this.connect(connectUrl), this.reconnectDelay);
        }
      };
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      this.isConnecting = false;
      this.emit('error', error);
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnecting = false;
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn('WebSocket is not connected');
    }
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach((callback) => callback(data));
    }
  }

  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }
}

const webSocketClient = new WebSocketClient();
export default webSocketClient;
