import React from 'react';
import { Card, Player } from '../types';
import { PlayingCard } from './PlayingCard';
import { ArrowUpDown, XCircle, Sparkles } from 'lucide-react';

interface PlayerHandProps {
  player: Player;
  selectedCardIds: Set<string>;
  playableCardIds: Set<string>;
  isMyTurn: boolean;
  onToggleCard: (card: Card) => void;
  onSortCards: () => void;
  onClearSelection: () => void;
  onCardDragStart: (e: React.DragEvent, card: Card) => void;
  onCardDragEnd: (e: React.DragEvent) => void;
}

export const PlayerHand: React.FC<PlayerHandProps> = ({
  player,
  selectedCardIds,
  playableCardIds,
  isMyTurn,
  onToggleCard,
  onSortCards,
  onClearSelection,
  onCardDragStart,
  onCardDragEnd,
}) => {
  return (
    <div className="w-full flex flex-col items-center select-none pt-2 pb-3 px-2 sm:px-4">
      {/* Hand Header Toolbar */}
      <div className="w-full max-w-4xl flex items-center justify-between text-xs text-slate-300 mb-2 px-2">
        <div className="flex items-center gap-2">
          <span className="text-base">{player.avatar}</span>
          <span className="font-bold text-slate-100">{player.name} (You)</span>
          <span className="bg-slate-800 text-amber-300 font-mono px-2 py-0.5 rounded-full border border-slate-700 font-semibold">
            {player.cards.length} cards left
          </span>
          {isMyTurn && (
            <span className="bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-500/40 text-[11px] animate-pulse">
              Your Turn
            </span>
          )}
        </div>

        {/* Quick controls */}
        <div className="flex items-center gap-2">
          {selectedCardIds.size > 0 && (
            <button
              id="btn-clear-selection"
              type="button"
              onClick={onClearSelection}
              className="flex items-center gap-1 text-slate-400 hover:text-slate-200 text-xs px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-700 transition cursor-pointer"
            >
              <XCircle className="w-3.5 h-3.5" />
              Clear ({selectedCardIds.size})
            </button>
          )}

          <button
            id="btn-auto-sort"
            type="button"
            onClick={onSortCards}
            className="flex items-center gap-1 text-slate-300 hover:text-amber-300 text-xs px-2.5 py-1 rounded-lg bg-slate-800/90 border border-slate-700 hover:border-slate-600 transition cursor-pointer shadow-sm"
            title="Sort cards from lowest (3♦) to highest (2♠)"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-amber-400" />
            Sort (3 → 2)
          </button>
        </div>
      </div>

      {/* Cards Area with horizontal scroll on mobile and fanned overlap */}
      <div className="w-full max-w-4xl overflow-x-auto overflow-y-visible no-scrollbar py-4 px-3 flex justify-center">
        {player.cards.length === 0 ? (
          <div className="py-6 text-center text-amber-300 font-bold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" /> All cards cleared!
          </div>
        ) : (
          <div className="flex items-end justify-center -space-x-3.5 sm:-space-x-5 md:-space-x-6 min-w-max pb-1">
            {player.cards.map((card, index) => {
              const isSelected = selectedCardIds.has(card.id);
              const isHighlightedPlayable = playableCardIds.size > 0 ? playableCardIds.has(card.id) : true;

              return (
                <div
                  key={card.id}
                  style={{
                    zIndex: isSelected ? 40 : index + 1,
                  }}
                  className="transition-transform duration-150"
                >
                  <PlayingCard
                    card={card}
                    selected={isSelected}
                    isPlayable={isHighlightedPlayable}
                    draggable={isMyTurn}
                    onClick={() => onToggleCard(card)}
                    onDragStart={(e) => onCardDragStart(e, card)}
                    onDragEnd={onCardDragEnd}
                    size="md"
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="text-[11px] text-slate-400 text-center mt-0.5">
        Tip: Click cards to select combo, then click <strong>Play Hand</strong> or <strong>drag cards directly to table</strong>.
      </div>
    </div>
  );
};
