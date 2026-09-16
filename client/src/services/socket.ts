/**
 * DESI BOLT — Real-Time WebSocket Client
 * Connects to the backend Socket.io server to receive live driver updates & delivery transitions.
 */
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001';

class WebSocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  connect() {
    if (this.socket && this.socket.connected) return;

    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    this.socket.on('connect', () => {
      console.log(`[DESI BOLT Socket] ⚡️ Connected to backend: ${this.socket?.id}`);
    });

    this.socket.on('disconnect', (reason) => {
      console.log(`[DESI BOLT Socket] Disconnected: ${reason}`);
    });

    // Re-bind all registered event listeners to socket
    this.listeners.forEach((callbacks, event) => {
      this.socket?.on(event, (data) => {
        callbacks.forEach((cb) => cb(data));
      });
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  subscribeToOrder(orderId: string) {
    if (!this.socket) this.connect();
    this.socket?.emit('order:subscribe', orderId);
  }

  on(event: string, callback: (data: any) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
      this.socket?.on(event, (data) => {
        this.listeners.get(event)?.forEach((cb) => cb(data));
      });
    }
    this.listeners.get(event)?.add(callback);

    // Return unbind function
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  emit(event: string, data: any) {
    if (!this.socket) this.connect();
    this.socket?.emit(event, data);
  }
}

export const socketService = new WebSocketService();
