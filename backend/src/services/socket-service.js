'use strict';

const socketClient = require('../utils/socket-client');

/**
 * Socket service for emitting events to the socket server
 */
module.exports = {
  /**
   * Emit an event to the socket server
   */
  emit(event, data) {
    return socketClient.emit(event, data);
  },

  /**
   * Safe emit with retry logic for disconnected state
   */
  safeEmit(event, data, maxRetries = 3) {
    return socketClient.safeEmit(event, data, maxRetries);
  },

  /**
   * Join a room on the socket server
   */
  joinRoom(room) {
    socketClient.joinRoom(room);
  },

  /**
   * Leave a room on the socket server
   */
  leaveRoom(room) {
    socketClient.leaveRoom(room);
  },

  /**
   * Get the current socket connection status
   */
  getStatus() {
    return socketClient.getStatus();
  },

  /**
   * Check if socket is connected
   */
  isConnected() {
    return socketClient.isConnected;
  },

  /**
   * Emit an event with built-in retry logic
   */
  async emitWithRetry(event, data, maxRetries = 3, delay = 1000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      if (socketClient.emit(event, data)) {
        return true;
      }

      if (attempt < maxRetries) {
        console.log(`Retry ${attempt}/${maxRetries} for event '${event}' in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    console.error(`Failed to emit event '${event}' after ${maxRetries} attempts`);
    return false;
  },

  /**
   * Wait for connection to be established
   */
  async waitForConnection(timeout = 30000) {
    if (socketClient.isConnected) {
      return true;
    }

    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const checkInterval = setInterval(() => {
        if (socketClient.isConnected) {
          clearInterval(checkInterval);
          resolve(true);
        } else if (Date.now() - startTime > timeout) {
          clearInterval(checkInterval);
          reject(new Error('Connection timeout'));
        }
      }, 100);
    });
  }
}