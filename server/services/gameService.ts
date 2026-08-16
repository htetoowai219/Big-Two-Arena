import { WebSocket } from 'ws';
import type { GameState, Player, ClientAction, WSMessage } from '../../src/types';
import { roomRepository } from '../repositories/roomRepository';
import { socketManager } from '../sockets/socketManager';
import * as engine from '../game/engine';
import { BotScheduler } from './botScheduler';

const BOT_NAMES = ['Kai (Bot)', 'Mei (Bot)', 'Leo (Bot)'];
const BOT_AVATARS = ['🤖', '🦊', '🐼'];

function makeBot(id: string, index: number): Player {
  return {
    id,
    name: BOT_NAMES[index] || `Bot ${index + 1}`,
    avatar: BOT_AVATARS[index] || '🤖',
    isBot: true,
    cards: [],
    cardsCount: 0,
    hasPassed: false,
    score: 0,
    connected: true,
  };
}

// Holds the authoritative in-memory room store (the working set), mediates
// between WebSocket messages, the game engine, the bot scheduler, and the
// durable Mongo copy via the repository.
class GameService {
  private rooms = new Map<string, GameState>();

  private botScheduler = new BotScheduler({
    getRoom: (roomId) => this.rooms.get(roomId),
    onBotMove: (room, playerId, cards) => this.applyBotMove(room, playerId, cards),
  });

  getRoom(roomId: string): GameState | undefined {
    return this.rooms.get(roomId);
  }

  private send(ws: WebSocket, message: WSMessage) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  private sendError(ws: WebSocket, error: string, code?: string) {
    this.send(ws, { type: 'ERROR', error, code });
  }

  // Broadcast the latest room state to everyone and persist it to MongoDB.
  private sync(room: GameState) {
    socketManager.broadcastToRoom(room.roomId, { type: 'SYNC_STATE', payload: room });
    roomRepository.save(room);
  }

  private scheduleOrClear(room: GameState) {
    if (room.status === 'round-over') {
      this.botScheduler.clear(room.roomId);
    } else {
      this.botScheduler.schedule(room.roomId);
    }
  }

  private applyBotMove(room: GameState, playerId: string, cards?: any[]) {
    if (cards) {
      engine.handlePlayHand(room, playerId, cards);
    } else {
      engine.handlePass(room, playerId);
    }
    this.sync(room);
    this.scheduleOrClear(room);
  }

  private createRoom(roomId: string, player: Player, config: { playerCount?: number; cardsPerPlayer?: number; autoFillBots?: boolean }) {
    const pCount = config?.playerCount || 4;
    const cPerPlayer = config?.cardsPerPlayer || Math.min(13, Math.floor(52 / pCount));
    const autoBots = config?.autoFillBots ?? true;

    const room: GameState = {
      roomId,
      roomName: `Big Two Room ${roomId}`,
      hostId: player.id,
      playerCount: pCount,
      cardsPerPlayer: cPerPlayer,
      autoFillBots: autoBots,
      status: 'lobby',
      players: [{ ...player, isHost: true, connected: true }],
      currentTurnPlayerId: '',
      lastPlayedHand: null,
      lastPlayedPlayerId: null,
      passCount: 0,
      leadPlayerId: null,
      roundWinnerId: null,
      instantWinReason: null,
      history: [],
      roundNumber: 0,
      updatedAt: Date.now(),
    };

    // If autoFillBots is enabled and room needs players
    if (room.autoFillBots) {
      while (room.players.length < room.playerCount) {
        room.players.push(makeBot(`bot_${Date.now()}_${room.players.length - 1}`, room.players.length - 1));
      }
    }

    return room;
  }

  private async handleJoin(ws: WebSocket, payload: any) {
    const { roomId, player, roomConfig } = payload || {};
    if (!roomId || !player) return;

    let room = this.rooms.get(roomId);
    if (!room) {
      // Not in memory: pull the durable copy from MongoDB. This lets games
      // survive a server restart / redeploy — players rejoin their room.
      room = await roomRepository.load(roomId);
      if (room) {
        this.rooms.set(roomId, room);
        // Bot timers are lost on restart; reschedule if a bot is mid-turn.
        this.botScheduler.restore(room);
      }
    }

    if (!room) {
      // Reconnect/join attempts for rooms that no longer exist (e.g. after a
      // server restart) must NOT silently recreate the room — that is what
      // bounced the client from the game screen back to the home screen
      // mid-game. Only explicit room creation (with roomConfig) creates.
      if (!roomConfig) {
        this.sendError(ws, 'Room not found. The room may have expired or the server restarted.', 'ROOM_NOT_FOUND');
        return;
      }

      room = this.createRoom(roomId, player, roomConfig);
      this.rooms.set(roomId, room);
    } else {
      // Join existing room
      const existingIdx = room.players.findIndex(p => p.id === player.id);
      if (existingIdx >= 0) {
        room.players[existingIdx].connected = true;
        room.players[existingIdx].name = player.name;
        room.players[existingIdx].avatar = player.avatar;
      } else {
        // Check if there is a bot slot we can replace, or if room has space
        const botIdx = room.players.findIndex(p => p.isBot);
        if (botIdx >= 0) {
          room.players[botIdx] = {
            ...player,
            isBot: false,
            cards: room.players[botIdx].cards,
            cardsCount: room.players[botIdx].cardsCount,
            hasPassed: room.players[botIdx].hasPassed,
            score: 0,
            connected: true,
          };
        } else if (room.players.length < room.playerCount) {
          room.players.push({
            ...player,
            isBot: false,
            cards: [],
            cardsCount: 0,
            hasPassed: false,
            score: 0,
            connected: true,
          });
        } else {
          this.sendError(ws, 'Room is full.', 'ROOM_FULL');
          return;
        }
      }
    }

    socketManager.register(ws, { roomId, playerId: player.id });
    this.sync(room);
  }

  private async handleAction(ws: WebSocket, action: ClientAction) {
    if (!action || !action.roomId) return;

    const room = this.rooms.get(action.roomId);
    if (!room) return;

    if (action.type === 'UPDATE_SETTINGS' && action.settings) {
      if (room.hostId === action.playerId && room.status === 'lobby') {
        room.playerCount = action.settings.playerCount;
        room.cardsPerPlayer = Math.min(action.settings.cardsPerPlayer, Math.floor(52 / room.playerCount));
        room.autoFillBots = action.settings.autoFillBots;

        // Adjust players to match playerCount
        const humans = room.players.filter(p => !p.isBot);
        const neededBots = Math.max(0, room.playerCount - humans.length);

        const newPlayers: Player[] = [...humans];
        if (room.autoFillBots) {
          for (let i = 0; i < neededBots; i++) {
            newPlayers.push(makeBot(`bot_${i + 1}`, i));
          }
        }
        room.players = newPlayers;
        room.updatedAt = Date.now();
        this.sync(room);
      }
    }

    if (action.type === 'START_GAME' || action.type === 'RESTART_ROUND') {
      if (room.hostId === action.playerId || room.status === 'round-over') {
        // Fill any missing spots with bots if needed before starting
        if (room.players.length < room.playerCount && room.autoFillBots) {
          while (room.players.length < room.playerCount) {
            const bIdx = room.players.length - 1;
            room.players.push(makeBot(`bot_${Date.now()}_${bIdx}`, bIdx));
          }
        }

        const updatedRoom = engine.initializeNewGame(room);
        this.rooms.set(room.roomId, updatedRoom);
        this.sync(updatedRoom);

        // If starting player is a bot, schedule move
        this.scheduleOrClear(updatedRoom);
      }
    }

    if (action.type === 'PLAY_HAND' && action.cards) {
      const res = engine.handlePlayHand(room, action.playerId, action.cards);
      if (!res.success) {
        this.sendError(ws, res.error!);
      } else {
        this.sync(room);
        this.scheduleOrClear(room);
      }
    }

    if (action.type === 'PASS') {
      const res = engine.handlePass(room, action.playerId);
      if (!res.success) {
        this.sendError(ws, res.error!);
      } else {
        this.sync(room);
        this.scheduleOrClear(room);
      }
    }

    if (action.type === 'REORDER_CARDS' && action.cards) {
      const p = room.players.find(x => x.id === action.playerId);
      if (p) {
        p.cards = action.cards;
        room.updatedAt = Date.now();
        roomRepository.save(room);
      }
    }

    if (action.type === 'LEAVE_ROOM') {
      socketManager.unregister(ws);
      const p = room.players.find(x => x.id === action.playerId);
      if (p) {
        p.connected = false;
      }
      const connectedHumans = room.players.filter(x => !x.isBot && x.connected);
      if (connectedHumans.length === 0) {
        this.botScheduler.clear(room.roomId);
        this.rooms.delete(room.roomId);
        await roomRepository.delete(room.roomId);
      } else {
        this.sync(room);
      }
    }
  }

  // Entry point for every WebSocket message.
  async handleMessage(ws: WebSocket, rawData: Buffer) {
    let data: WSMessage;
    try {
      data = JSON.parse(rawData.toString());
    } catch (err) {
      console.error('WebSocket message parse error:', err);
      return;
    }

    try {
      if (data.type === 'PING') {
        this.send(ws, { type: 'PONG' });
        return;
      }

      if (data.type === 'PLAYER_JOINED') {
        await this.handleJoin(ws, data.payload);
        return;
      }

      if (data.type === 'ACTION') {
        await this.handleAction(ws, data.payload);
        return;
      }
    } catch (err) {
      console.error('WebSocket message handling error:', err);
    }
  }

  handleDisconnect(ws: WebSocket) {
    const registration = socketManager.get(ws);
    if (!registration) return;

    const { roomId, playerId } = registration;
    const room = this.rooms.get(roomId);
    if (room) {
      const player = room.players.find(p => p.id === playerId);
      if (player) {
        player.connected = false;
      }
      this.sync(room);
    }
    socketManager.unregister(ws);
  }
}

export const gameService = new GameService();
