import { WebSocket } from 'ws';
import type { WSMessage } from '../../src/types';

interface SocketRegistration {
  roomId: string;
  playerId: string;
}

// Tracks which room/player each connected socket belongs to and provides
// room-scoped broadcasting.
class SocketManager {
  private clients = new Map<WebSocket, SocketRegistration>();

  register(ws: WebSocket, registration: SocketRegistration) {
    this.clients.set(ws, registration);
  }

  unregister(ws: WebSocket) {
    this.clients.delete(ws);
  }

  get(ws: WebSocket): SocketRegistration | undefined {
    return this.clients.get(ws);
  }

  broadcastToRoom(roomId: string, message: WSMessage) {
    const payloadStr = JSON.stringify(message);
    this.clients.forEach((registration, client) => {
      if (client.readyState === WebSocket.OPEN && registration.roomId === roomId) {
        client.send(payloadStr);
      }
    });
  }
}

export const socketManager = new SocketManager();
