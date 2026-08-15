export type Suit = 'diamonds' | 'clubs' | 'hearts' | 'spades';
export type Rank = '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A' | '2';

export interface Card {
  id: string;
  suit: Suit;
  rank: Rank;
  suitValue: number; // 0: Diamonds, 1: Clubs, 2: Hearts, 3: Spades
  rankValue: number; // 3 to 15 (3=3, ..., A=14, 2=15)
  totalRank: number; // rankValue * 4 + suitValue
}

export type HandCategory = 'single' | 'pair' | 'triple' | 'five-card' | 'invalid';

export type FiveCardComboType = 
  | 'straight-flush'     // Highest: cards in order of same house
  | 'four-of-a-kind'    // Second: 4 of same number + 1 random
  | 'full-house'        // Third: 3 of same number + 2 of same number
  | 'straight';         // Fourth: cards in order with random house

export interface PlayedHand {
  playerId: string;
  playerName: string;
  cards: Card[];
  category: HandCategory;
  comboType?: FiveCardComboType;
  primaryRankValue: number; // Main comparison value (e.g. rank of 3-of-a-kind in full house, or top card totalRank)
  secondaryRankValue?: number; // Secondary tie-breaker
  formattedName: string;
  timestamp: number;
}

export interface Player {
  id: string;
  name: string;
  avatar: string;
  isBot: boolean;
  cards: Card[];
  cardsCount: number;
  hasPassed: boolean;
  score: number;
  connected: boolean;
  isHost?: boolean;
}

export type GameStatus = 'lobby' | 'playing' | 'round-over' | 'game-over';

export interface GameState {
  roomId: string;
  roomName: string;
  hostId: string;
  playerCount: number; // 2, 3, or 4
  cardsPerPlayer: number; // 1 to 52 / playerCount
  autoFillBots: boolean;
  status: GameStatus;
  players: Player[];
  currentTurnPlayerId: string;
  lastPlayedHand: PlayedHand | null;
  lastPlayedPlayerId: string | null;
  passCount: number; // consecutive passes
  leadPlayerId: string | null; // who has control / led the trick
  roundWinnerId: string | null;
  instantWinReason?: string | null;
  history: PlayedHand[];
  roundNumber: number;
  updatedAt: number;
}

export interface ClientAction {
  type: 'PLAY_HAND' | 'PASS' | 'START_GAME' | 'UPDATE_SETTINGS' | 'RESTART_ROUND' | 'ADD_BOT' | 'KICK_BOT' | 'LEAVE_ROOM' | 'REORDER_CARDS';
  roomId: string;
  playerId: string;
  cards?: Card[];
  settings?: {
    playerCount: number;
    cardsPerPlayer: number;
    autoFillBots: boolean;
  };
}

export interface WSMessage {
  type: 'SYNC_STATE' | 'PLAYER_JOINED' | 'PLAYER_LEFT' | 'ERROR' | 'ACTION' | 'PING' | 'PONG';
  payload?: any;
  roomId?: string;
  playerId?: string;
  error?: string;
}
