import type { Request, Response } from 'express';
import { gameService } from '../services/gameService';
import { roomRepository } from '../repositories/roomRepository';

// Room state lookup, falling back to the durable copy in MongoDB so clients
// can re-sync after the server restarts.
export async function getRoom(req: Request, res: Response) {
  const roomId = req.params.roomId;
  let room = gameService.getRoom(roomId);
  if (!room) {
    room = await roomRepository.load(roomId);
  }
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }
  res.json(room);
}
