import { Schema, model } from 'mongoose';
import type { Card, GameState, Player } from '../../src/types';

// A Room persists the full GameState plus Mongo bookkeeping (_id === roomId,
// expiresAt drives the TTL index so abandoned rooms are cleaned up).
export interface RoomDocument extends GameState {
  _id: string;
  expiresAt?: Date;
}

const CardSchema = new Schema<Card>(
  {
    id: { type: String, required: true },
    suit: { type: String, required: true },
    rank: { type: String, required: true },
    suitValue: { type: Number, required: true },
    rankValue: { type: Number, required: true },
    totalRank: { type: Number, required: true },
  },
  { _id: false },
);

const PlayerSchema = new Schema<Player>(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    avatar: { type: String, default: '' },
    isBot: { type: Boolean, required: true },
    cards: { type: [CardSchema], default: [] },
    cardsCount: { type: Number, default: 0 },
    hasPassed: { type: Boolean, default: false },
    score: { type: Number, default: 0 },
    connected: { type: Boolean, default: true },
    isHost: { type: Boolean, default: false },
  },
  { _id: false },
);

const RoomSchema = new Schema<RoomDocument>(
  {
    _id: { type: String },
    roomId: { type: String, index: true },
    roomName: { type: String, required: true },
    hostId: { type: String, required: true },
    playerCount: { type: Number, required: true },
    cardsPerPlayer: { type: Number, required: true },
    autoFillBots: { type: Boolean, default: true },
    status: { type: String, default: 'lobby' },
    players: { type: [PlayerSchema], default: [] },
    currentTurnPlayerId: { type: String, default: '' },
    // lastPlayedHand / history are polymorphic (PlayedHand | PassEntry), so
    // they are stored as-is to avoid lossy schema coercion.
    lastPlayedHand: { type: Schema.Types.Mixed, default: null },
    lastPlayedPlayerId: { type: String, default: null },
    passCount: { type: Number, default: 0 },
    leadPlayerId: { type: String, default: null },
    roundWinnerId: { type: String, default: null },
    instantWinReason: { type: String, default: null },
    history: { type: Schema.Types.Mixed, default: [] },
    roundNumber: { type: Number, default: 0 },
    updatedAt: { type: Number, default: () => Date.now() },
    expiresAt: { type: Date, default: null },
  },
  { _id: false, versionKey: false },
);

// Rooms are auto-removed once their TTL expires.
RoomSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RoomModel = model<RoomDocument>('Room', RoomSchema);
