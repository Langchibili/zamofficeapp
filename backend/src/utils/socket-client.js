//src/utils/socket-client.js
'use strict';

const { io } = require('socket.io-client');

class SocketClient {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.connectionAttempts = 0;
    this.maxConnectionAttempts = 10;
    this.SOCKET_SERVER_URL = process.env.SOCKET_SERVER_URL || 'http://localhost:3002';
    this.reconnectInterval = null;
  }

  initialize() {
    if (this.socket) return; // already initialized

    console.log(`[Socket Client] Connecting to ${this.SOCKET_SERVER_URL}...`);

    try {
      this.socket = io(this.SOCKET_SERVER_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: this.maxConnectionAttempts,
        reconnectionDelay: 2000,
        timeout: 30000,
      });

      this.setupEventListeners();
    } catch (err) {
      console.error('[Socket Client] Initialization failed:', err.message);
      this.scheduleReconnection();
    }
  }

  setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.isConnected = true;
      this.connectionAttempts = 0;
      console.log(`[Socket Client] Connected with id: ${this.socket.id}`);
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      console.warn(`[Socket Client] Disconnected: ${reason}`);
      if (reason === 'io server disconnect') this.socket.connect();
    });

    this.socket.on('connect_error', (err) => {
        console.log(err)
      this.isConnected = false;
      this.connectionAttempts++;
      console.error(`[Socket Client] connect_error attempt ${this.connectionAttempts}:`, err.message);
      if (this.connectionAttempts >= this.maxConnectionAttempts) {
        console.error('[Socket Client] Max attempts reached, scheduling reconnection...');
        this.scheduleReconnection();
      }
    });

    // Optional: listen for messages from server
    this.socket.on('server:message', (data) => console.log('[Socket Client] server:message', data));
  }

  scheduleReconnection(delay = 5000) {
    if (this.reconnectInterval) clearTimeout(this.reconnectInterval);
    this.reconnectInterval = setTimeout(() => {
      console.log('[Socket Client] Reconnecting...');
      this.cleanup();
      this.initialize();
    }, delay);
  }

  cleanup() {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
    if (this.reconnectInterval) clearTimeout(this.reconnectInterval);
  }

  emit(event, data) {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
      return true;
    }
    console.warn(`[Socket Client] Cannot emit, not connected: ${event}`);
    return false;
  }

  safeEmit(event, data, maxRetries = 3) {
    if (this.isConnected) return this.emit(event, data);

    let attempts = 0;
    const tryEmit = () => {
      attempts++;
      if (this.isConnected) return this.emit(event, data);
      if (attempts < maxRetries) setTimeout(tryEmit, 1000 * attempts);
      else console.warn(`[Socket Client] Failed to emit '${event}' after ${maxRetries} attempts`);
    };
    return tryEmit();
  }

  joinRoom(room) {
    if (this.isConnected) this.socket.emit('join', room);
  }

  leaveRoom(room) {
    if (this.isConnected) this.socket.emit('leave', room);
  }

  getStatus() {
    return { isConnected: this.isConnected, id: this.socket?.id, url: this.SOCKET_SERVER_URL };
  }

  disconnect() {
    this.cleanup();
    console.log('[Socket Client] Disconnected manually');
  }
}

module.exports = new SocketClient();
