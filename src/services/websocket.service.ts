/**
 * WebSocket Service - Real-time Incoming Call Notifications
 */

import { io, Socket } from 'socket.io-client';
import { IncomingCallData } from '../types';

type IncomingCallHandler = (data: IncomingCallData) => void;
type CallStatusUpdateHandler = (data: { callSid: string; status: string; duration?: string }) => void;
type CallAnsweredHandler = (data: { callSid: string; status: string }) => void;
type DisconnectHandler = () => void;
type ConnectHandler = () => void;

class WebSocketService {
  private socket: Socket | null = null;
  private websocketUrl: string;
  private incomingCallHandlers: Set<IncomingCallHandler> = new Set();
  private callStatusUpdateHandlers: Set<CallStatusUpdateHandler> = new Set();
  private callAnsweredHandlers: Set<CallAnsweredHandler> = new Set();
  private connectHandlers: Set<ConnectHandler> = new Set();
  private disconnectHandlers: Set<DisconnectHandler> = new Set();
  private ownerId: string | null = null;
  private isConnecting: boolean = false;

  constructor() {
    this.websocketUrl = process.env.REACT_APP_WEBSOCKET_URL || 'http://localhost:3000';
  }

  /**
   * Connect to WebSocket server and join owner's room
   */
  connect(ownerId: string): void {
    if (this.socket?.connected || this.isConnecting) {
      console.log('WebSocket already connected or connecting');
      // If owner changed, rejoin room
      if (this.ownerId !== ownerId && this.socket?.connected) {
        this.socket.emit('join_owner_room', ownerId);
        this.ownerId = ownerId;
      }
      return;
    }

    this.isConnecting = true;
    this.ownerId = ownerId;

    console.log(`Connecting to WebSocket: ${this.websocketUrl}`);

    this.socket = io(this.websocketUrl, {
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      forceNew: true,
      withCredentials: false,
      autoConnect: true,
      upgrade: true,
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.isConnecting = false;

      // Join owner's room for targeted notifications
      if (this.ownerId) {
        this.socket?.emit('join_owner_room', this.ownerId);
        console.log(`Joined owner room: ${this.ownerId}`);
      }

      this.connectHandlers.forEach((handler) => handler());
    });

    this.socket.on('joined', (data: { room: string }) => {
      console.log(`Successfully joined room: ${data.room}`);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      this.isConnecting = false;
      this.disconnectHandlers.forEach((handler) => handler());
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.isConnecting = false;
    });

    // Listen for incoming call notifications (routed to contact owner)
    this.socket.on('incoming_call', (data: IncomingCallData) => {
      console.log('Incoming call notification:', data);
      this.incomingCallHandlers.forEach((handler) => handler(data));
    });

    // Listen for call status updates
    this.socket.on('call_status_update', (data: { callSid: string; status: string; duration?: string }) => {
      console.log('Call status update:', data);
      this.callStatusUpdateHandlers.forEach((handler) => handler(data));
    });

    // Listen for call answered events (when WhatsApp user picks up)
    this.socket.on('call_answered', (data: { callSid: string; status: string }) => {
      console.log('Call answered:', data);
      this.callAnsweredHandlers.forEach((handler) => handler(data));
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.socket) {
      console.log('Disconnecting WebSocket');
      this.socket.disconnect();
      this.socket = null;
      this.ownerId = null;
      this.isConnecting = false;
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Get current owner ID
   */
  getOwnerId(): string | null {
    return this.ownerId;
  }

  /**
   * Register incoming call handler
   */
  onIncomingCall(handler: IncomingCallHandler): () => void {
    this.incomingCallHandlers.add(handler);
    return () => {
      this.incomingCallHandlers.delete(handler);
    };
  }

  /**
   * Register call status update handler
   */
  onCallStatusUpdate(handler: CallStatusUpdateHandler): () => void {
    this.callStatusUpdateHandlers.add(handler);
    return () => {
      this.callStatusUpdateHandlers.delete(handler);
    };
  }

  /**
   * Register call answered handler
   */
  onCallAnswered(handler: CallAnsweredHandler): () => void {
    this.callAnsweredHandlers.add(handler);
    return () => {
      this.callAnsweredHandlers.delete(handler);
    };
  }

  /**
   * Register connect handler
   */
  onConnect(handler: ConnectHandler): () => void {
    this.connectHandlers.add(handler);
    return () => {
      this.connectHandlers.delete(handler);
    };
  }

  /**
   * Register disconnect handler
   */
  onDisconnect(handler: DisconnectHandler): () => void {
    this.disconnectHandlers.add(handler);
    return () => {
      this.disconnectHandlers.delete(handler);
    };
  }

  /**
   * Send custom event to server
   */
  emit(event: string, data: any): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn(`Cannot emit ${event}: WebSocket not connected`);
    }
  }
}

export default new WebSocketService();
