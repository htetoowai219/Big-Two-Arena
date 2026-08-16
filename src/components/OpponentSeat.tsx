import React from 'react';
import { Player } from '../types';
import { PlayingCard } from './PlayingCard';
import { Crown, Bot, WifiOff } from 'lucide-react';

interface OpponentSeatProps {
  player: Player;
  isCurrentTurn: boolean;
  position: 'top' | 'left' | 'right';
  playersCount: number;
  compact?: boolean;
}

export const OpponentSeat: React.FC<OpponentSeatProps> = ({
  player,
  isCurrentTurn,
  position,
  playersCount,
  compact = false,
}) => {
  const cardCount = player.cardsCount ?? player.cards?.length ?? 0;

  // On mobile, only show the card-back fan in 2-player mode; for 3-4 players
  // opponents are just name + card count so the seats stay compact.
  const fanClassName = playersCount === 2 ? 'flex' : 'hidden sm:flex';

  // On mobile the top seat shows name-only in 3-4 player games (no score,
  // count, or fan); on desktop it renders the full seat.
  const fanBlockClassName = position === 'top' && playersCount > 2 ? 'hidden sm:flex' : 'flex';

  return (
    <div
      className={`
        relative flex items-center transition-all duration-300
        ${compact ? 'gap-1.5 p-1.5 rounded-xl' : 'gap-2 p-2 sm:p-2.5 rounded-2xl'}
        ${isCurrentTurn 
          ? 'bg-amber-500/20 border-2 border-amber-400 ring-2 ring-amber-400/40 shadow-lg scale-105' 
          : 'bg-slate-900/80 border border-slate-800 shadow'}
        ${compact ? 'flex-row' : position === 'top' ? 'flex-col sm:flex-row' : 'flex-col'}
      `}
    >
      {compact ? (
        <>
          <span className="font-bold text-[11px] text-slate-200 truncate max-w-[70px] sm:max-w-[90px]">
            {player.name}
          </span>
          <span className="px-1.5 py-0.5 bg-slate-950/90 text-amber-400 font-mono font-bold text-[11px] rounded-full border border-slate-700">
            {cardCount}
          </span>
        </>
      ) : (
        <>
          {/* Avatar & Player Info */}
      <div className={`items-center gap-2 ${position === 'top' ? 'hidden sm:flex' : 'flex'}`}>
        <div className="relative">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-xl shadow-inner">
            {player.avatar || '👤'}
          </div>
          {player.isHost && (
            <div className="absolute -top-1.5 -right-1 bg-amber-500 text-slate-950 p-0.5 rounded-full shadow">
              <Crown className="w-3 h-3 fill-current" />
            </div>
          )}
          {player.isBot && (
            <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white p-0.5 rounded-full shadow">
              <Bot className="w-3 h-3" />
            </div>
          )}
          {!player.connected && !player.isBot && (
            <div className="absolute -bottom-1 -right-1 bg-rose-600 text-white p-0.5 rounded-full shadow" title="Disconnected">
              <WifiOff className="w-3 h-3" />
            </div>
          )}
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-1">
            <span className="font-bold text-xs sm:text-sm text-slate-200 max-w-[90px] sm:max-w-[120px] truncate">
              {player.name}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <span>Score: <strong className="text-amber-300 font-mono">{player.score}</strong></span>
            {player.hasPassed && (
              <span className="px-1.5 py-0.2 bg-rose-950/80 text-rose-300 border border-rose-800 rounded font-semibold text-[10px]">
                Passed
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Mobile name-only pill for the top seat in 3-4 player games */}
      {position === 'top' && (
        <span className="sm:hidden font-bold text-xs text-slate-200 truncate max-w-[120px]">
          {player.name}
        </span>
      )}

      {/* Opponent Card Stack / Mini Fan */}
      <div className={`${fanBlockClassName} items-center justify-center mt-1`}>
        <div className={`${fanClassName} items-center -space-x-6 sm:-space-x-7 py-0.5`}>
          {Array.from({ length: Math.min(cardCount, 8) }).map((_, idx) => (
            <div
              key={idx}
              style={{
                transform: `rotate(${(idx - (Math.min(cardCount, 8) - 1) / 2) * 3}deg)`,
              }}
              className="transition-transform"
            >
              <PlayingCard faceDown size="sm" />
            </div>
          ))}
        </div>

        <span className="ml-2 px-2 py-0.5 bg-slate-950/90 text-amber-400 font-mono font-bold text-xs rounded-full border border-slate-700">
          {cardCount}
        </span>
      </div>
        </>
      )}

      {/* Thinking state indicator */}
      {isCurrentTurn && (
        <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full shadow uppercase tracking-wider animate-pulse flex items-center gap-1">
          <span>Thinking</span>
        </div>
      )}
    </div>
  );
};
