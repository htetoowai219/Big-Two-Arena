import type { GameState } from '../../src/types';
import { decideBotMove } from '../../src/utils/botAi';

interface BotSchedulerDeps {
  getRoom: (roomId: string) => GameState | undefined;
  // Called when the bot's timer fires. `cards` is undefined when passing.
  onBotMove: (room: GameState, playerId: string, cards?: any[]) => void;
}

const BOT_DELAY_MS = 750;

// Owns the delayed-move timers for bot players. Timers are keyed by room so a
// move by any player cancels the pending bot turn and (re)schedules it.
export class BotScheduler {
  private timeouts = new Map<string, NodeJS.Timeout>();

  constructor(private deps: BotSchedulerDeps) {}

  schedule(roomId: string) {
    this.clear(roomId);
    const room = this.deps.getRoom(roomId);
    if (!room || room.status !== 'playing') return;

    const current = room.players.find(p => p.id === room.currentTurnPlayerId);
    if (!current || !current.isBot) return;

    const timeout = setTimeout(() => {
      this.timeouts.delete(roomId);
      const latest = this.deps.getRoom(roomId);
      if (!latest || latest.status !== 'playing') return;
      // Re-read the bot's hand at fire time in case state changed.
      const botPlayer = latest.players.find(p => p.id === current.id);
      if (!botPlayer || !botPlayer.isBot) return;
      const otherCounts = latest.players.filter(p => p.id !== current.id).map(p => p.cards.length);
      const botMove = decideBotMove(botPlayer.cards, latest.lastPlayedHand, otherCounts);
      this.deps.onBotMove(latest, current.id, botMove || undefined);
    }, BOT_DELAY_MS);

    this.timeouts.set(roomId, timeout);
  }

  clear(roomId: string) {
    const existing = this.timeouts.get(roomId);
    if (existing) {
      clearTimeout(existing);
      this.timeouts.delete(roomId);
    }
  }

  // After a server restart, timers are gone. If a bot is mid-turn, reschedule.
  restore(room: GameState) {
    if (room.status !== 'playing') return;
    const current = room.players.find(p => p.id === room.currentTurnPlayerId);
    if (current && current.isBot) {
      this.schedule(room.roomId);
    }
  }
}
