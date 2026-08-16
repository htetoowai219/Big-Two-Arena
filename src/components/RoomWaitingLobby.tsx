import React, { useState } from 'react';
import { GameState } from '../types';
import { Users, Crown, Play, Loader2, ListOrdered, Copy, Check, UserPlus } from 'lucide-react';

interface RoomWaitingLobbyProps {
  gameState: GameState;
  myPlayerId: string;
  isHost: boolean;
  onStartGame: () => void;
  onSetTurnOrder: (turnOrder: string[]) => void;
}

const SEAT_LABELS = ['1st', '2nd', '3rd', '4th'];

export const RoomWaitingLobby: React.FC<RoomWaitingLobbyProps> = ({
  gameState,
  myPlayerId,
  isHost,
  onStartGame,
  onSetTurnOrder,
}) => {
  const [copied, setCopied] = useState(false);
  const [pendingStart, setPendingStart] = useState(false);
  const [pendingOrder, setPendingOrder] = useState(false);

  const { playerCount, players } = gameState;
  const filledSeats = players.length;
  const missing = Math.max(0, playerCount - filledSeats);
  const allHumansConnected = players.filter(p => !p.isBot).every(p => p.connected);
  const readyToStart = filledSeats >= playerCount && allHumansConnected;

  const [turnOrder, setTurnOrder] = useState<string[]>(gameState.manualTurnOrder || []);

  const copyRoomCode = () => {
    navigator.clipboard.writeText(gameState.roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const orderComplete = turnOrder.filter(Boolean).length === playerCount;

  const commitTurnOrder = (order: string[]) => {
    setTurnOrder(order);
    setPendingOrder(true);
    onSetTurnOrder(order);
    setTimeout(() => setPendingOrder(false), 1500);
  };

  const handleOrderSlotChange = (slotIndex: number, playerId: string) => {
    const next = [...turnOrder];
    while (next.length <= slotIndex) next.push('');
    next[slotIndex] = playerId;
    commitTurnOrder(next);
  };

  const handleStart = () => {
    if (!readyToStart) return;
    setPendingStart(true);
    onStartGame();
    setTimeout(() => setPendingStart(false), 2000);
  };

  const availableForOrder = players.filter(p => p.isBot || p.connected);

  return (
    <div className="w-full max-w-xl mx-auto p-4 sm:p-6 text-slate-100 flex flex-col items-center">
      {/* Room Header */}
      <div className="w-full text-center mb-5">
        <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-slate-900 border border-slate-700 mb-3 shadow-xl">
          <div className="flex items-center gap-2 text-2xl font-black">
            <span className="text-slate-100 drop-shadow">♠</span>
            <span className="text-red-500 drop-shadow">♥</span>
            <span className="text-slate-100 drop-shadow">♣</span>
            <span className="text-red-500 drop-shadow">♦</span>
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-100">
          Waiting for Players
        </h1>

        <button
          onClick={copyRoomCode}
          className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sm font-mono font-bold text-amber-300 transition cursor-pointer"
          title="Click to copy Room Code"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
          {gameState.roomId}
        </button>
        <p className="text-xs text-slate-400 mt-2">
          Share this code with friends to have them join this room.
        </p>
      </div>

      <div className="w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl backdrop-blur-md space-y-5">
        {/* Seats */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
            <Users className="w-4 h-4 text-amber-400" />
            Players Joined ({filledSeats}/{playerCount})
          </label>

          <div className="space-y-2">
            {Array.from({ length: playerCount }).map((_, idx) => {
              const player = players[idx];
              return (
                <div
                  key={idx}
                  className={`flex items-center gap-3 p-3 rounded-2xl border transition ${
                    player
                      ? 'bg-slate-950/60 border-slate-800'
                      : 'bg-slate-950/30 border-dashed border-slate-800'
                  }`}
                >
                  <span className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-sm font-black text-amber-300 flex-shrink-0">
                    {SEAT_LABELS[idx] || idx + 1}
                  </span>

                  {player ? (
                    <>
                      <span className="text-xl flex-shrink-0">{player.avatar}</span>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="font-bold text-sm text-slate-100 truncate">{player.name}</span>
                          {player.id === myPlayerId && (
                            <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded">You</span>
                          )}
                          {player.isHost && <Crown className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                          {player.isBot ? (
                            <span className="text-blue-300">AI Bot</span>
                          ) : player.connected ? (
                            <span className="text-emerald-400">Connected</span>
                          ) : (
                            <span className="text-rose-400">Disconnected</span>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-2 text-slate-500">
                      <UserPlus className="w-4 h-4" />
                      <span className="text-sm font-semibold">Waiting for player…</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Manual Turn Order */}
        {gameState.turnOrderMode === 'manual' && (
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
                <ListOrdered className="w-4 h-4 text-amber-400" />
                Turn Order (1st → 4th)
              </label>
              {pendingOrder && (
                <span className="flex items-center gap-1 text-[10px] text-emerald-400">
                  <Loader2 className="w-3 h-3 animate-spin" /> Saving…
                </span>
              )}
            </div>

            {isHost ? (
              <div className="space-y-2">
                {Array.from({ length: playerCount }).map((_, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="w-10 flex-shrink-0 text-xs font-black text-slate-400">
                      {SEAT_LABELS[idx]}:
                    </span>
                    <select
                      value={turnOrder[idx] || ''}
                      onChange={(e) => handleOrderSlotChange(idx, e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-amber-400 transition cursor-pointer"
                    >
                      <option value="">— Unassigned —</option>
                      {availableForOrder.map(p => (
                        <option key={p.id} value={p.id} disabled={turnOrder.includes(p.id) && turnOrder[idx] !== p.id}>
                          {p.avatar} {p.name} {p.isBot ? '(Bot)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
                {!orderComplete && (
                  <p className="text-[11px] text-amber-400/90">
                    Unassigned seats are filled automatically by remaining players before dealing.
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400">
                The host is arranging the play order. Seats are ordered {SEAT_LABELS.slice(0, playerCount).join(' → ')}.
              </p>
            )}
          </div>
        )}

        {/* Start / Waiting Status */}
        {isHost ? (
          <div className="space-y-2">
            <button
              id="btn-start-game"
              type="button"
              disabled={!readyToStart || pendingStart}
              onClick={handleStart}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 disabled:hover:from-amber-500 disabled:hover:to-amber-500 text-slate-950 font-black text-base transition shadow-xl shadow-amber-500/20 active:scale-[0.99] disabled:active:scale-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
            >
              {pendingStart ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Play className="w-5 h-5 fill-current" />
              )}
              <span>
                {readyToStart
                  ? `Start Game (${filledSeats}/${playerCount} Players)`
                  : missing > 0
                    ? `Waiting for ${missing} more player${missing > 1 ? 's' : ''}…`
                    : 'Waiting for players to reconnect…'}
              </span>
            </button>

            {!readyToStart && (
              <p className="text-center text-xs text-slate-400">
                {missing > 0
                  ? `${filledSeats}/${playerCount} players joined. The first hand is dealt once everyone is here.`
                  : 'A player disconnected. They must rejoin before the game can start.'}
              </p>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-slate-950/60 border border-slate-800 text-slate-300 text-sm font-semibold">
            <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
            Waiting for the host to start the game…
          </div>
        )}
      </div>
    </div>
  );
};
