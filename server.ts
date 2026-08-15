import express from 'express';
import http from 'http';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import {
  GameState,
  Player,
  ClientAction,
  WSMessage,
} from './src/types';
import {
  createDeck,
  shuffleDeck,
  sortCards,
  hasFourTwos,
  evaluateHand,
  canBeatHand,
} from './src/utils/cardUtils';
import { decideBotMove } from './src/utils/botAi';

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PORT = 3000;

app.use(express.json());

// In-memory room store (persists game state throughout sessions and turns)
const rooms: Map<string, GameState> = new Map();
// Client sockets mapped to roomId and playerId
const clients: Map<WebSocket, { roomId: string; playerId: string }> = new Map();

function broadcastToRoom(roomId: string, message: WSMessage) {
  const payloadStr = JSON.stringify(message);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      const clientData = clients.get(client);
      if (clientData && clientData.roomId === roomId) {
        client.send(payloadStr);
      }
    }
  });
}

function initializeNewGame(state: GameState): GameState {
  const fullDeck = shuffleDeck(createDeck());
  const playerCount = state.playerCount;
  const cardsPerPlayer = Math.min(state.cardsPerPlayer, Math.floor(52 / playerCount));

  const updatedPlayers = state.players.map((player, index) => {
    const dealtCards = fullDeck.slice(index * cardsPerPlayer, (index + 1) * cardsPerPlayer);
    const sorted = sortCards(dealtCards);
    return {
      ...player,
      cards: sorted,
      cardsCount: sorted.length,
      hasPassed: false,
    };
  });

  // Check 4 Twos instant win condition
  let instantWinner: Player | null = null;
  for (const p of updatedPlayers) {
    if (hasFourTwos(p.cards)) {
      instantWinner = p;
      break;
    }
  }

  // Determine starting player:
  // Usually player with lowest card (Diamond 3 = lowest total rank), or first player
  let startingPlayerId = updatedPlayers[0]?.id || '';
  let lowestRankVal = Infinity;
  for (const p of updatedPlayers) {
    if (p.cards.length > 0 && p.cards[0].totalRank < lowestRankVal) {
      lowestRankVal = p.cards[0].totalRank;
      startingPlayerId = p.id;
    }
  }

  const newState: GameState = {
    ...state,
    status: instantWinner ? 'round-over' : 'playing',
    players: updatedPlayers,
    currentTurnPlayerId: startingPlayerId,
    lastPlayedHand: null,
    lastPlayedPlayerId: null,
    passCount: 0,
    leadPlayerId: startingPlayerId,
    roundWinnerId: instantWinner ? instantWinner.id : null,
    instantWinReason: instantWinner ? `${instantWinner.name} was dealt all four 2's! Instant Victory!` : null,
    history: [],
    roundNumber: state.roundNumber + 1,
    updatedAt: Date.now(),
  };

  if (instantWinner) {
    // Add score to winner
    const winnerInState = newState.players.find(p => p.id === instantWinner!.id);
    if (winnerInState) {
      winnerInState.score += 50;
    }
  }

  return newState;
}

function advanceTurn(state: GameState, playedHandCards?: any) {
  const activePlayers = state.players;
  const currentIndex = activePlayers.findIndex(p => p.id === state.currentTurnPlayerId);

  // Next player index
  const nextIndex = (currentIndex + 1) % activePlayers.length;
  state.currentTurnPlayerId = activePlayers[nextIndex].id;
  state.updatedAt = Date.now();

  // Trigger bot action if next player is a bot
  scheduleBotTurn(state.roomId);
}

function scheduleBotTurn(roomId: string) {
  setTimeout(() => {
    const room = rooms.get(roomId);
    if (!room || room.status !== 'playing') return;

    const currentTurnPlayer = room.players.find(p => p.id === room.currentTurnPlayerId);
    if (!currentTurnPlayer || !currentTurnPlayer.isBot) return;

    // Bot decision
    const otherCounts = room.players.filter(p => p.id !== currentTurnPlayer.id).map(p => p.cards.length);
    const botMove = decideBotMove(currentTurnPlayer.cards, room.lastPlayedHand, otherCounts);

    if (botMove) {
      handlePlayHand(room, currentTurnPlayer.id, botMove);
    } else {
      handlePass(room, currentTurnPlayer.id);
    }

    broadcastToRoom(roomId, {
      type: 'SYNC_STATE',
      payload: room,
    });
  }, 750);
}

function handlePlayHand(room: GameState, playerId: string, cards: any[]): { success: boolean; error?: string } {
  if (room.status !== 'playing') return { success: false, error: 'Game not active.' };
  if (room.currentTurnPlayerId !== playerId) return { success: false, error: 'Not your turn.' };

  const player = room.players.find(p => p.id === playerId);
  if (!player) return { success: false, error: 'Player not found.' };

  // Validate cards in player's hand
  const playerCardIds = new Set(player.cards.map(c => c.id));
  for (const c of cards) {
    if (!playerCardIds.has(c.id)) {
      return { success: false, error: 'Cards not in hand.' };
    }
  }

  const evaluated = evaluateHand(cards, player.id, player.name);
  if (!evaluated) {
    return { success: false, error: 'Invalid card combination.' };
  }

  const beatCheck = canBeatHand(evaluated, room.lastPlayedHand);
  if (!beatCheck.canBeat) {
    return { success: false, error: beatCheck.reason || 'Cannot beat active hand.' };
  }

  // Remove cards from player's hand
  const playedIds = new Set(cards.map(c => c.id));
  player.cards = player.cards.filter(c => !playedIds.has(c.id));
  player.cardsCount = player.cards.length;
  player.hasPassed = false;

  // Record hand
  room.lastPlayedHand = evaluated;
  room.lastPlayedPlayerId = playerId;
  room.leadPlayerId = playerId;
  room.passCount = 0;
  room.history.unshift(evaluated);

  // Reset all players hasPassed
  room.players.forEach(p => {
    p.hasPassed = false;
  });

  // Check victory (player emptied cards)
  if (player.cards.length === 0) {
    room.status = 'round-over';
    room.roundWinnerId = player.id;
    player.score += 20;

    // Calculate penalty scores for others based on remaining cards
    room.players.forEach(p => {
      if (p.id !== player.id) {
        const penalty = p.cards.length * (p.cards.length >= 10 ? 2 : 1);
        p.score = Math.max(0, p.score - penalty);
      }
    });

    room.updatedAt = Date.now();
    return { success: true };
  }

  // Advance turn
  advanceTurn(room);
  return { success: true };
}

function handlePass(room: GameState, playerId: string): { success: boolean; error?: string } {
  if (room.status !== 'playing') return { success: false, error: 'Game not active.' };
  if (room.currentTurnPlayerId !== playerId) return { success: false, error: 'Not your turn.' };
  if (!room.lastPlayedHand) {
    return { success: false, error: 'You have control of the table and must lead a hand!' };
  }

  const player = room.players.find(p => p.id === playerId);
  if (player) {
    player.hasPassed = true;
  }

  room.passCount += 1;

  // If all other players passed, control goes back to the last player who played
  const playersCount = room.players.length;
  if (room.passCount >= playersCount - 1) {
    // Trick ended! Control passes to lastPlayedPlayerId
    const winnerOfTrickId = room.lastPlayedPlayerId || room.currentTurnPlayerId;
    room.currentTurnPlayerId = winnerOfTrickId;
    room.leadPlayerId = winnerOfTrickId;
    room.lastPlayedHand = null; // Fresh new trick
    room.lastPlayedPlayerId = null;
    room.passCount = 0;
    room.players.forEach(p => {
      p.hasPassed = false;
    });
    room.updatedAt = Date.now();

    // If trick winner is a bot, schedule bot turn
    scheduleBotTurn(room.roomId);
    return { success: true };
  }

  // Normal pass: next player
  advanceTurn(room);
  return { success: true };
}

// WebSocket connection handling
wss.on('connection', (ws: WebSocket) => {
  ws.on('message', (messageStr: string) => {
    try {
      const data: WSMessage = JSON.parse(messageStr);

      if (data.type === 'PING') {
        ws.send(JSON.stringify({ type: 'PONG' }));
        return;
      }

      if (data.type === 'PLAYER_JOINED') {
        const { roomId, player, roomConfig } = data.payload || {};
        if (!roomId || !player) return;

        let room = rooms.get(roomId);
        if (!room) {
          // Create room
          const pCount = roomConfig?.playerCount || 4;
          const cPerPlayer = roomConfig?.cardsPerPlayer || Math.min(13, Math.floor(52 / pCount));
          const autoBots = roomConfig?.autoFillBots ?? true;

          room = {
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
            const botNames = ['Kai (Bot)', 'Mei (Bot)', 'Leo (Bot)'];
            const botAvatars = ['🤖', '🦊', '🐼'];
            while (room.players.length < room.playerCount) {
              const bIdx = room.players.length - 1;
              room.players.push({
                id: `bot_${Date.now()}_${bIdx}`,
                name: botNames[bIdx] || `Bot ${bIdx + 1}`,
                avatar: botAvatars[bIdx] || '🤖',
                isBot: true,
                cards: [],
                cardsCount: 0,
                hasPassed: false,
                score: 0,
                connected: true,
              });
            }
          }

          rooms.set(roomId, room);
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
            }
          }
        }

        clients.set(ws, { roomId, playerId: player.id });
        broadcastToRoom(roomId, { type: 'SYNC_STATE', payload: room });
        return;
      }

      if (data.type === 'ACTION') {
        const action: ClientAction = data.payload;
        if (!action || !action.roomId) return;

        const room = rooms.get(action.roomId);
        if (!room) return;

        if (action.type === 'UPDATE_SETTINGS' && action.settings) {
          if (room.hostId === action.playerId && room.status === 'lobby') {
            room.playerCount = action.settings.playerCount;
            room.cardsPerPlayer = Math.min(action.settings.cardsPerPlayer, Math.floor(52 / room.playerCount));
            room.autoFillBots = action.settings.autoFillBots;

            // Adjust players to match playerCount
            const humans = room.players.filter(p => !p.isBot);
            const neededBots = Math.max(0, room.playerCount - humans.length);
            const botNames = ['Kai (Bot)', 'Mei (Bot)', 'Leo (Bot)'];
            const botAvatars = ['🤖', '🦊', '🐼'];

            const newPlayers: Player[] = [...humans];
            if (room.autoFillBots) {
              for (let i = 0; i < neededBots; i++) {
                newPlayers.push({
                  id: `bot_${i + 1}`,
                  name: botNames[i] || `Bot ${i + 1}`,
                  avatar: botAvatars[i] || '🤖',
                  isBot: true,
                  cards: [],
                  cardsCount: 0,
                  hasPassed: false,
                  score: 0,
                  connected: true,
                });
              }
            }
            room.players = newPlayers;
            room.updatedAt = Date.now();
            broadcastToRoom(room.roomId, { type: 'SYNC_STATE', payload: room });
          }
        }

        if (action.type === 'START_GAME' || action.type === 'RESTART_ROUND') {
          if (room.hostId === action.playerId || room.status === 'round-over') {
            // Fill any missing spots with bots if needed before starting
            if (room.players.length < room.playerCount && room.autoFillBots) {
              const botNames = ['Kai (Bot)', 'Mei (Bot)', 'Leo (Bot)'];
              const botAvatars = ['🤖', '🦊', '🐼'];
              while (room.players.length < room.playerCount) {
                const bIdx = room.players.length - 1;
                room.players.push({
                  id: `bot_${Date.now()}_${bIdx}`,
                  name: botNames[bIdx] || `Bot ${bIdx + 1}`,
                  avatar: botAvatars[bIdx] || '🤖',
                  isBot: true,
                  cards: [],
                  cardsCount: 0,
                  hasPassed: false,
                  score: 0,
                  connected: true,
                });
              }
            }

            const updatedRoom = initializeNewGame(room);
            rooms.set(room.roomId, updatedRoom);
            broadcastToRoom(room.roomId, { type: 'SYNC_STATE', payload: updatedRoom });

            // If starting player is a bot, schedule move
            scheduleBotTurn(room.roomId);
          }
        }

        if (action.type === 'PLAY_HAND' && action.cards) {
          const res = handlePlayHand(room, action.playerId, action.cards);
          if (!res.success) {
            ws.send(JSON.stringify({ type: 'ERROR', error: res.error }));
          } else {
            broadcastToRoom(room.roomId, { type: 'SYNC_STATE', payload: room });
          }
        }

        if (action.type === 'PASS') {
          const res = handlePass(room, action.playerId);
          if (!res.success) {
            ws.send(JSON.stringify({ type: 'ERROR', error: res.error }));
          } else {
            broadcastToRoom(room.roomId, { type: 'SYNC_STATE', payload: room });
          }
        }
      }
    } catch (err) {
      console.error('WebSocket message parsing error:', err);
    }
  });

  ws.on('close', () => {
    const clientData = clients.get(ws);
    if (clientData) {
      const { roomId, playerId } = clientData;
      const room = rooms.get(roomId);
      if (room) {
        const player = room.players.find(p => p.id === playerId);
        if (player) {
          player.connected = false;
        }
        broadcastToRoom(roomId, { type: 'SYNC_STATE', payload: room });
      }
      clients.delete(ws);
    }
  });
});

// REST endpoints
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: Date.now() });
});

app.get('/api/rooms/:roomId', (req, res) => {
  const room = rooms.get(req.params.roomId);
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }
  res.json(room);
});

// Vite middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Big Two server running on http://localhost:${PORT}`);
  });
}

startServer();
