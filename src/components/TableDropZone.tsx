import React from 'react';
import { PlayedHand, Player, Card } from '../types';
import { PlayingCard } from './PlayingCard';
import { Sparkles, Flame, ShieldAlert, CheckCircle2, History } from 'lucide-react';

interface TableDropZoneProps {
  lastPlayedHand: PlayedHand | null;
  currentTurnPlayer: Player | null;
  isMyTurn: boolean;
  selectedCards: Card[];
  selectedHandEvaluation: PlayedHand | null;
  selectedHandCanBeat: { canBeat: boolean; reason?: string } | null;
  onPlaySelected: () => void;
  onPass: () => void;
  onAutoSort: () => void;
  onShowHint: () => void;
  onToggleHistory?: () => void;
}

export const TableDropZone: React.FC<TableDropZoneProps> = ({
  lastPlayedHand,
  currentTurnPlayer,
  isMyTurn,
  selectedCards,
  selectedHandEvaluation,
  selectedHandCanBeat,
  onPlaySelected,
  onPass,
  onAutoSort,
  onShowHint,
  onToggleHistory,
}) => {
  return (
    <div
      id="table-center-felt"
      className="relative w-full max-w-2xl min-h-[190px] sm:min-h-[240px] rounded-3xl p-3 sm:p-5 flex flex-col items-center justify-between bg-gradient-to-b from-emerald-900/80 via-emerald-950/85 to-slate-950/90 border-2 border-emerald-600/40 shadow-2xl backdrop-blur-md transition-all duration-300"
    >
      {/* Table Felt Decorative Inner Border */}
      <div className="absolute inset-2 border border-emerald-500/25 rounded-2xl pointer-events-none" />

      {/* Top Table Status Bar */}
      <div className="w-full flex items-center justify-between z-10 text-xs sm:text-sm font-medium text-emerald-200/90 mb-1">
        <div className="flex items-center gap-1.5 sm:gap-2 truncate">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
          <span className="truncate">
            {lastPlayedHand ? (
              <>Current: <strong className="text-emerald-100">{lastPlayedHand.formattedName}</strong></>
            ) : (
              <span className="text-amber-300 font-bold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Table Open: Lead any combination!
              </span>
            )}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {onToggleHistory && (
            <button
              onClick={onToggleHistory}
              className="lg:hidden p-1 sm:px-2 sm:py-0.5 rounded-lg bg-emerald-900/80 hover:bg-emerald-800 text-emerald-200 text-xs font-semibold border border-emerald-600/30 flex items-center gap-1 cursor-pointer"
              title="View History"
            >
              <History className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Log</span>
            </button>
          )}
        </div>
      </div>

      {/* Center Played Cards Display */}
      <div className="w-full flex-1 flex flex-col items-center justify-center my-1.5 relative min-h-[90px] sm:min-h-[110px]">
        {lastPlayedHand ? (
          <div className="flex flex-col items-center animate-in fade-in zoom-in-95 duration-200">
            {/* Played by badge */}
            <div className="mb-1.5 px-3 py-0.5 rounded-full bg-slate-900/90 border border-slate-700 text-slate-200 text-xs flex items-center gap-1.5 shadow">
              <span className="font-bold text-amber-300">{lastPlayedHand.playerName}</span>
              <span className="text-slate-500">•</span>
              <span className="text-emerald-300 font-mono">{lastPlayedHand.formattedName}</span>
            </div>

            {/* Cards row */}
            <div className="flex items-center justify-center -space-x-3.5 sm:-space-x-5 py-1">
              {lastPlayedHand.cards.map((card, idx) => (
                <div
                  key={card.id}
                  style={{
                    transform: `rotate(${(idx - (lastPlayedHand.cards.length - 1) / 2) * 3}deg) translateY(${Math.abs((idx - (lastPlayedHand.cards.length - 1) / 2)) * 2}px)`,
                  }}
                  className="transition-transform duration-200"
                >
                  <PlayingCard card={card} size="md" isPlayable={true} />
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Empty Table / Fresh lead prompt */
          <div className="flex flex-col items-center justify-center text-center p-3 border-2 border-dashed border-emerald-600/40 rounded-2xl w-full max-w-sm my-auto bg-emerald-950/40">
            <Sparkles className="w-6 h-6 mb-1 text-amber-400 animate-pulse" />
            <p className="text-xs sm:text-sm font-bold text-emerald-100">
              {isMyTurn ? 'Your turn to lead!' : 'Waiting for round lead...'}
            </p>
            <p className="text-[11px] text-emerald-300/80 mt-0.5">
              Select card(s) and tap <strong>Play Hand</strong>
            </p>
          </div>
        )}
      </div>

      {/* Bottom Action / Quick Turn Control Bar */}
      <div className="w-full flex flex-wrap items-center justify-between gap-2 mt-1 pt-2 sm:pt-3 border-t border-emerald-700/40 z-10">
        {/* Status preview of current selection */}
        <div className="flex items-center gap-1.5 flex-1 min-w-[170px]">
          {selectedCards.length > 0 ? (
            <div className="flex items-center gap-1.5 text-xs">
              {selectedHandEvaluation ? (
                selectedHandCanBeat?.canBeat ? (
                  <span className="inline-flex items-center gap-1 text-emerald-300 bg-emerald-900/90 px-2.5 py-1 rounded-lg border border-emerald-500/50 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Ready: {selectedHandEvaluation.formattedName}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-rose-300 bg-rose-950/90 px-2.5 py-1 rounded-lg border border-rose-500/50 font-bold text-[11px] sm:text-xs">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                    <span className="truncate">{selectedHandCanBeat?.reason || 'Cannot beat active hand'}</span>
                  </span>
                )
              ) : (
                <span className="text-amber-300 bg-amber-950/80 px-2 py-1 rounded-lg border border-amber-600/40 text-[11px]">
                  Select combo ({selectedCards.length} selected)
                </span>
              )}
            </div>
          ) : (
            <div className="text-xs text-emerald-300/80 flex items-center gap-1.5">
              <span>Turn:</span>
              <strong className={`font-bold ${isMyTurn ? 'text-amber-300' : 'text-emerald-100'}`}>
                {currentTurnPlayer ? (isMyTurn ? 'Your Turn' : currentTurnPlayer.name) : 'Waiting...'}
              </strong>
            </div>
          )}
        </div>

        {/* Buttons (Play, Pass, Hint) */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            id="btn-hint"
            type="button"
            onClick={onShowHint}
            className="px-2.5 sm:px-3 py-2 text-xs font-bold text-emerald-200 bg-emerald-900/80 hover:bg-emerald-800 active:scale-95 border border-emerald-600/50 rounded-xl transition cursor-pointer min-h-[38px] flex items-center gap-1"
            title="Highlight valid playable cards in your hand"
          >
            <span>💡</span>
            <span>Hint</span>
          </button>

          <button
            id="btn-pass"
            type="button"
            disabled={!isMyTurn || !lastPlayedHand}
            onClick={onPass}
            className={`
              px-3 sm:px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1 min-h-[38px]
              ${isMyTurn && lastPlayedHand
                ? 'bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-100 border border-slate-600 shadow-md ring-1 ring-slate-500'
                : 'opacity-35 bg-slate-900 text-slate-500 cursor-not-allowed border border-slate-800'}
            `}
          >
            Pass
          </button>

          <button
            id="btn-play-cards"
            type="button"
            disabled={!isMyTurn || !selectedHandEvaluation || !selectedHandCanBeat?.canBeat}
            onClick={onPlaySelected}
            className={`
              px-3.5 sm:px-5 py-2 text-xs sm:text-sm font-black rounded-xl transition shadow-xl flex items-center gap-1.5 cursor-pointer min-h-[38px]
              ${isMyTurn && selectedHandEvaluation && selectedHandCanBeat?.canBeat
                ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 active:scale-95 ring-2 ring-amber-300 shadow-amber-500/20'
                : 'opacity-35 bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'}
            `}
          >
            <Flame className="w-4 h-4 fill-current" />
            <span>Play Hand</span>
          </button>
        </div>
      </div>
    </div>
  );
};
