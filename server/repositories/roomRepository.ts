import type { GameState } from '../../src/types';
import { isDatabaseConnected } from '../config/database';
import { RoomModel, RoomDocument } from '../models/Room';
import { ROOM_TTL_SECONDS } from '../config/env';

// Strips Mongo bookkeeping fields so the returned doc matches the GameState
// shape the rest of the app expects.
function toGameState(doc: RoomDocument): GameState {
  const { _id, expiresAt, ...rest } = doc;
  return rest as GameState;
}

export const roomRepository = {
  async save(room: GameState): Promise<void> {
    if (!isDatabaseConnected()) return;
    const doc = {
      ...room,
      _id: room.roomId,
      expiresAt: new Date(Date.now() + ROOM_TTL_SECONDS * 1000),
    };
    try {
      await RoomModel.updateOne({ _id: room.roomId }, doc, { upsert: true }).lean();
    } catch (err) {
      console.error('[persist] save failed for', room.roomId, err);
    }
  },

  async load(roomId: string): Promise<GameState | null> {
    if (!isDatabaseConnected()) return null;
    try {
      const doc = await RoomModel.findById(roomId).lean().exec();
      return doc ? toGameState(doc as unknown as RoomDocument) : null;
    } catch (err) {
      console.error('[persist] load failed for', roomId, err);
      return null;
    }
  },

  async delete(roomId: string): Promise<void> {
    if (!isDatabaseConnected()) return;
    try {
      await RoomModel.deleteOne({ _id: roomId }).exec();
    } catch (err) {
      console.error('[persist] delete failed for', roomId, err);
    }
  },
};
