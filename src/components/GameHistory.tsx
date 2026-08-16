import React from 'react';
import { HistoryEntry } from '../types';
import { History, Shield, Flame, CheckCircle2, ChevronRight, X, Ban } from 'lucide-react';
import { SUIT_SYMBOLS } from '../utils/cardUtils';

interface GameHistoryProps {
  history: HistoryEntry[];
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  className?: string;
}

export const GameHistory: React.FC<GameHistoryProps> = ({
  history,
  isOpenMobile = false,
  onCloseMobile,
  className = '',
}) => {
  return (
    <div
      id="game-history-panel"
      className={`
        bg-slate-900/90 border border-slate-800 rounded-3xl p-3.5 sm:p-4 shadow-xl backdrop-blur-md flex flex-col
        ${isOpenMobile ? 'h-full' : ''}
        ${className}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <History className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Play History
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-mono font-bold bg-slate-950 text-amber-400 px-2 py-0.5 rounded-full border border-slate-800">
            {history.filter(h => h.kind !== 'pass').length} plays
          </span>
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="p-1.5 text-slate-400 hover:text-slate-100 rounded-lg bg-slate-800 hover:bg-rose-950/80 hover:text-rose-300 border border-slate-700 hover:border-rose-800 transition cursor-pointer"
              title="Close history"
              aria-label="Close history"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* History Items List */}
      <div className={`flex-1 overflow-y-auto min-h-0 space-y-2 pr-1 no-scrollbar text-xs ${isOpenMobile ? '' : 'max-h-[260px] sm:max-h-[320px]'}`}>
        {history.length === 0 ? (
          <div className="py-8 text-center text-slate-500 italic">
            No plays or passes yet in this round.
          </div>
        ) : (
          history.map((entry, idx) => {
            const isLatest = idx === 0;

            if (entry.kind === 'pass') {
              return (
                <div
                  key={`${entry.timestamp}_${idx}`}
                  className={`
                    p-2.5 rounded-2xl border transition-all
                    ${isLatest
                      ? 'bg-slate-800/60 border-slate-600/50 shadow-sm ring-1 ring-slate-500/30'
                      : 'bg-slate-950/60 border-slate-800/80'}
                  `}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 font-bold text-slate-200">
                      <Ban className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate max-w-[120px]">{entry.playerName}</span>
                      {isLatest && (
                        <span className="text-[9px] bg-amber-500 text-slate-950 px-1.5 py-0.2 rounded font-black uppercase">
                          Latest
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wide">
                      Passed
                    </span>
                  </div>
                </div>
              );
            }

            const hand = entry;

            return (
              <div
                key={`${hand.timestamp}_${idx}`}
                className={`
                  p-2.5 rounded-2xl border transition-all
                  ${isLatest 
                    ? 'bg-emerald-950/40 border-emerald-500/40 shadow-sm ring-1 ring-emerald-400/20' 
                    : 'bg-slate-950/60 border-slate-800/80'}
                `}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-slate-200">
                    <span className="truncate max-w-[100px]">{hand.playerName}</span>
                    {isLatest && (
                      <span className="text-[9px] bg-emerald-500 text-slate-950 px-1.5 py-0.2 rounded font-black uppercase">
                        Latest
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {hand.formattedName}
                  </span>
                </div>

                {/* Mini Card Chips */}
                <div className="flex flex-wrap items-center gap-1">
                  {hand.cards.map((card) => {
                    const isRed = card.suit === 'hearts' || card.suit === 'diamonds';
                    return (
                      <span
                        key={card.id}
                        className={`
                          inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white font-mono font-bold text-[11px] border border-slate-300 shadow-xs
                          ${isRed ? 'text-red-600' : 'text-slate-950'}
                        `}
                      >
                        <span>{card.rank}</span>
                        <span className="text-[12px] leading-none">{SUIT_SYMBOLS[card.suit]}</span>
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
