import {
  GameState,
  Player,
} from '../../src/types';
import {
  createDeck,
  shuffleDeck,
  sortCards,
  hasFourTwos,
  evaluateHand,
  canBeatHand,
} from '../../src/utils/cardUtils';

// Pure game logic. Functions mutate the passed-in GameState and return result
// metadata; they have no knowledge of sockets, databases, or bot timers — the
// game service layer owns that orchestration.

export function initializeNewGame(state: GameState): GameState {
  const fullDeck = shuffleDeck(createDeck());
  const playerCount = Math.max(2, Math.min(4, state.playerCount || state.players.length || 4));
  const maxAllowed = Math.floor(52 / playerCount);
  const cardsPerPlayer = (state.cardsPerPlayer && state.cardsPerPlayer >= 3 && state.cardsPerPlayer <= maxAllowed)
    ? state.cardsPerPlayer
    : maxAllowed;

  const updatedPlayers = state.players.slice(0, playerCount).map((player, index) => {
    const dealtCards = fullDeck.slice(index * cardsPerPlayer, (index + 1) * cardsPerPlayer);
    const sorted = sortCards(dealtCards);
    return {
      ...player,
      cards: sorted,
      cardsCount: sorted.length,
      hasPassed: false,
    };
  });

  // Check 4 Twos instant win condition (only valid if player holds at least 4 cards)
  let instantWinner: Player | null = null;
  for (const p of updatedPlayers) {
    if (p.cards.length >= 4 && hasFourTwos(p.cards)) {
      instantWinner = p;
      break;
    }
  }

  // Determine starting player: player with lowest total card (e.g. 3♦)
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
    playerCount,
    cardsPerPlayer,
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
    roundNumber: (state.roundNumber || 0) + 1,
    updatedAt: Date.now(),
  };

  if (instantWinner) {
    const winnerInState = newState.players.find(p => p.id === instantWinner!.id);
    if (winnerInState) {
      winnerInState.score += 50;
    }
  }

  return newState;
}

function advanceTurn(state: GameState) {
  const activePlayers = state.players;
  const currentIndex = activePlayers.findIndex(p => p.id === state.currentTurnPlayerId);

  const nextIndex = (currentIndex + 1) % activePlayers.length;
  state.currentTurnPlayerId = activePlayers[nextIndex].id;
  state.updatedAt = Date.now();
}

export function handlePlayHand(
  room: GameState,
  playerId: string,
  cards: any[],
): { success: boolean; error?: string } {
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

export function handlePass(
  room: GameState,
  playerId: string,
): { success: boolean; error?: string } {
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

  // Record the pass in the round history
  if (player) {
    room.history.unshift({
      kind: 'pass',
      playerId,
      playerName: player.name,
      timestamp: Date.now(),
    });
  }

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
    return { success: true };
  }

  // Normal pass: next player
  advanceTurn(room);
  return { success: true };
}
