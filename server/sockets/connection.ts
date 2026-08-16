import { WebSocket, RawData } from 'ws';
import { gameService } from '../services/gameService';

function toBuffer(data: RawData): Buffer {
  if (Buffer.isBuffer(data)) return data;
  if (data instanceof ArrayBuffer) return Buffer.from(data);
  return Buffer.concat(data as Buffer[]);
}

// Wires a new socket into the game service: dispatches incoming messages and
// marks the player disconnected when the socket closes.
export function onSocketConnection(ws: WebSocket) {
  ws.on('message', (data) => {
    gameService.handleMessage(ws, toBuffer(data));
  });

  ws.on('close', () => {
    gameService.handleDisconnect(ws);
  });
}
