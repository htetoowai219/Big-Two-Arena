import React, { useState } from 'react';
import { PlayedHand, Player, Card } from '../types';
import { PlayingCard } from './PlayingCard';
import { Sparkles, ArrowDownToLine, Flame, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface TableDropZoneProps {
  lastPlayedHand: PlayedHand | null;
  currentTurnPlayer: Player | null;
  isMyTurn: boolean;
  passCount: number;
  totalPlayers: number;
  selectedCards: Card[];
  selectedHandEvaluation: PlayedHand | null;
  selectedHandCanBeat: { canBeat: boolean; reason?: string } | null;
  onDropCards: () => void;
  onPlaySelected: () => void;
  onPass: () => void;
  onAutoSort: () => void;
  onShowHint: () => void;
}

export const TableDropZone: React.FC<TableDropZoneProps> = ({
  lastPlayedHand,
  currentTurnPlayer,
  isMyTurn,
  passCount,
  totalPlayers,
  selectedCards,
  selectedHandEvaluation,
  selectedHandCanBeat,
  onDropCards,
  onPlaySelected,
  onPass,
  onAutoSort,
  onShowHint,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    onDropCards();
  };

  return (
    <div
      id="table-center-dropzone"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        relative w-full max-w-2xl min-h-[220px] sm:min-h-[260px] rounded-3xl p-4 sm:p-6
        flex flex-col items-center justify-between
        transition-all duration-300
        ${isDragOver 
          ? 'bg-emerald-900/60 ring-4 ring-emerald-400 scale-[1.02] shadow-2xl border-emerald-400/80' 
          : 'bg-emerald-950/75 border border-emerald-700/40 shadow-inner backdrop-blur-md'}
      `}
    >
      {/* Table Felt Decorative Border */}
      <div className="absolute inset-2 border border-emerald-500/20 rounded-2xl pointer-events-none" />

      {/* Top Table Status Bar */}
      <div className="w-full flex items-center justify-between z-10 text-xs sm:text-sm font-medium text-emerald-200/90 mb-2">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>
            {lastPlayedHand ? (
              <>Active Trick: <strong className="text-emerald-100">{lastPlayedHand.formattedName}</strong></>
            ) : (
              <span className="text-amber-300 font-semibold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Table Open: Lead any hand!
              </span>
            )}
          </span>
        </div>

        {lastPlayedHand && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-900/80 rounded-full border border-emerald-600/30 text-emerald-300">
            <span>Passes:</span>
            <span className="font-bold text-amber-300">{passCount} / {totalPlayers - 1}</span>
          </div>
        )}
      </div>

      {/* Center Played Cards Display */}
      <div className="w-full flex-1 flex flex-col items-center justify-center my-2 relative">
        {lastPlayedHand ? (
          <div className="flex flex-col items-center animate-in fade-in zoom-in-95 duration-200">
            {/* Played by badge */}
            <div className="mb-2 px-3 py-0.5 rounded-full bg-slate-900/80 border border-slate-700 text-slate-200 text-xs flex items-center gap-1.5 shadow">
              <span className="font-semibold">{lastPlayedHand.playerName}</span>
              <span className="text-slate-400">•</span>
              <span className="text-emerald-300 font-mono">{lastPlayedHand.formattedName}</span>
            </div>

            {/* Cards row */}
            <div className="flex items-center justify-center -space-x-4 sm:-space-x-5 py-1">
              {lastPlayedHand.cards.map((card, idx) => (
                <div
                  key={card.id}
                  style={{
                    transform: `rotate(${(idx - (lastPlayedHand.cards.length - 1) / 2) * 4}deg) translateY(${Math.abs((idx - (lastPlayedHand.cards.length - 1) / 2)) * 2}px)`,
                  }}
                  className="transition-transform duration-200"
                >
                  <PlayingCard card={card} size="md" isPlayable={true} />
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Empty Table / Drop Zone prompt */
          <div className="flex flex-col items-center justify-center text-center p-4 border-2 border-dashed border-emerald-600/40 rounded-2xl w-full max-w-md my-auto bg-emerald-900/20">
            <ArrowDownToLine className={`w-8 h-8 mb-2 transition-colors ${isDragOver ? 'text-amber-400 animate-bounce' : 'text-emerald-400/60'}`} />
            <p className="text-sm font-semibold text-emerald-100">
              {isDragOver ? 'Release cards here to play!' : 'Drag cards here or click "Play Selected"'}
            </p>
            <p className="text-xs text-emerald-300/70 mt-0.5">
              Singles • Pairs • Triples • 5-Card Combos
            </p>
          </div>
        )}

        {/* Drag Overlay Hint */}
        {isDragOver && (
          <div className="absolute inset-0 bg-emerald-800/80 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center text-white z-30 animate-in fade-in">
            <ArrowDownToLine className="w-12 h-12 text-amber-300 animate-bounce mb-2" />
            <span className="text-lg font-bold text-amber-300">Drop cards onto table</span>
            {selectedHandEvaluation && (
              <span className="text-xs font-medium text-emerald-100 mt-1 px-3 py-1 bg-emerald-950/80 rounded-full">
                Playing: {selectedHandEvaluation.formattedName}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Bottom Action / Quick Turn Control Bar */}
      <div className="w-full flex flex-wrap items-center justify-between gap-2 mt-2 pt-3 border-t border-emerald-700/40 z-10">
        {/* Status preview of current selection */}
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          {selectedCards.length > 0 ? (
            <div className="flex items-center gap-1.5 text-xs">
              {selectedHandEvaluation ? (
                selectedHandCanBeat?.canBeat ? (
                  <span className="inline-flex items-center gap-1 text-emerald-300 bg-emerald-900/80 px-2.5 py-1 rounded-lg border border-emerald-500/40 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Ready: {selectedHandEvaluation.formattedName}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-rose-300 bg-rose-950/80 px-2.5 py-1 rounded-lg border border-rose-500/40 font-medium">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                    {selectedHandCanBeat?.reason || 'Cannot beat current hand'}
                  </span>
                )
              ) : (
                <span className="text-amber-300 bg-amber-950/70 px-2.5 py-1 rounded-lg border border-amber-600/30">
                  Select a valid combo ({selectedCards.length} cards selected)
                </span>
              )}
            </div>
          ) : (
            <div className="text-xs text-emerald-300/80 flex items-center gap-2">
              <span>Current Turn:</span>
              <strong className={`font-semibold ${isMyTurn ? 'text-amber-300' : 'text-emerald-100'}`}>
                {currentTurnPlayer ? (isMyTurn ? 'Your Turn!' : currentTurnPlayer.name) : 'Waiting...'}
              </strong>
            </div>
          )}
        </div>

        {/* Buttons (Play, Pass, Hint) */}
        <div className="flex items-center gap-2">
          <button
            id="btn-hint"
            type="button"
            onClick={onShowHint}
            className="px-3 py-1.5 text-xs font-semibold text-emerald-200 bg-emerald-900/60 hover:bg-emerald-800/80 active:scale-95 border border-emerald-600/40 rounded-xl transition cursor-pointer"
            title="Highlight valid playable cards in your hand"
          >
            💡 Hint
          </button>

          <button
            id="btn-pass"
            type="button"
            disabled={!isMyTurn || !lastPlayedHand}
            onClick={onPass}
            className={`
              px-3.5 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1
              ${isMyTurn && lastPlayedHand
                ? 'bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 border border-slate-600 shadow'
                : 'opacity-40 bg-slate-900 text-slate-500 cursor-not-allowed border border-slate-800'}
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
              px-4 py-1.5 text-xs font-bold rounded-xl transition shadow-lg flex items-center gap-1.5 cursor-pointer
              ${isMyTurn && selectedHandEvaluation && selectedHandCanBeat?.canBeat
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 active:scale-95 ring-2 ring-amber-300'
                : 'opacity-40 bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'}
            `}
          >
            <Flame className="w-3.5 h-3.5" />
            Play Hand
          </button>
        </div>
      </div>
    </div>
  );
};
