import React, { useState } from 'react';
import { Card, Player } from '../types';
import { PlayingCard } from './PlayingCard';
import { ArrowUpDown, XCircle, Sparkles, MoveHorizontal } from 'lucide-react';

interface PlayerHandProps {
  player: Player;
  selectedCardIds: Set<string>;
  playableCardIds: Set<string>;
  isMyTurn: boolean;
  onToggleCard: (card: Card) => void;
  onSortCards: () => void;
  onClearSelection: () => void;
  onReorderCards: (sourceIndex: number, targetIndex: number) => void;
}

export const PlayerHand: React.FC<PlayerHandProps> = ({
  player,
  selectedCardIds,
  playableCardIds,
  isMyTurn,
  onToggleCard,
  onSortCards,
  onClearSelection,
  onReorderCards,
}) => {
  const [draggedCardIndex, setDraggedCardIndex] = useState<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedCardIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dropTargetIndex !== index) {
      setDropTargetIndex(index);
    }
  };

  const handleDragLeave = () => {
    // leave target
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedCardIndex !== null && draggedCardIndex !== targetIndex) {
      onReorderCards(draggedCardIndex, targetIndex);
    }
    setDraggedCardIndex(null);
    setDropTargetIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedCardIndex(null);
    setDropTargetIndex(null);
  };

  return (
    <div className="w-full flex flex-col items-center select-none pt-1 pb-2 sm:pb-3 px-2 sm:px-4">
      {/* Hand Header Toolbar */}
      <div className="w-full max-w-4xl flex items-center justify-between text-xs text-slate-300 mb-1.5 px-2">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="text-sm sm:text-base">{player.avatar}</span>
          <span className="font-bold text-slate-100 text-xs sm:text-sm">{player.name} (You)</span>
          <span className="bg-slate-800 text-amber-300 font-mono px-2 py-0.5 rounded-full border border-slate-700 font-semibold text-[10px] sm:text-xs">
            {player.cards.length} cards
          </span>
          {isMyTurn && (
            <span className="bg-amber-500/20 text-amber-300 font-black px-2 py-0.5 rounded-full border border-amber-500/50 text-[10px] sm:text-xs animate-pulse">
              Your Turn
            </span>
          )}
        </div>

        {/* Quick controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {selectedCardIds.size > 0 && (
            <button
              id="btn-clear-selection"
              type="button"
              onClick={onClearSelection}
              className="flex items-center gap-1 text-slate-400 hover:text-slate-200 text-xs px-2 py-1 rounded-lg bg-slate-800/90 hover:bg-slate-700 transition cursor-pointer border border-slate-700"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Clear ({selectedCardIds.size})</span>
            </button>
          )}

          <button
            id="btn-auto-sort"
            type="button"
            onClick={onSortCards}
            className="flex items-center gap-1 text-slate-200 hover:text-amber-300 text-xs px-2.5 py-1 rounded-lg bg-slate-800/90 border border-slate-700 hover:border-slate-600 transition cursor-pointer shadow-sm active:scale-95"
            title="Sort cards from lowest (3♦) to highest (2♠)"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-amber-400" />
            <span>Sort (3 → 2)</span>
          </button>
        </div>
      </div>

      {/* Cards Area with horizontal scroll on mobile and fanned overlap */}
      <div className="w-full max-w-4xl overflow-x-auto overflow-y-visible no-scrollbar py-3 px-2 flex justify-center">
        {player.cards.length === 0 ? (
          <div className="py-5 text-center text-amber-300 font-bold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" /> All cards cleared!
          </div>
        ) : (
          <div className="flex items-end justify-center -space-x-3 sm:-space-x-5 md:-space-x-6 min-w-max pb-1 px-3">
            {player.cards.map((card, index) => {
              const isSelected = selectedCardIds.has(card.id);
              const isHighlightedPlayable = playableCardIds.size > 0 ? playableCardIds.has(card.id) : true;
              const isDropTarget = dropTargetIndex === index;
              const isBeingDragged = draggedCardIndex === index;

              return (
                <div
                  key={card.id}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  style={{
                    zIndex: isSelected ? 40 : index + 1,
                  }}
                  className={`
                    transition-all duration-150 relative
                    ${isDropTarget ? 'scale-110 -translate-y-2 ring-2 ring-blue-400 rounded-lg' : ''}
                    ${isBeingDragged ? 'opacity-40 scale-95' : ''}
                  `}
                >
                  <PlayingCard
                    card={card}
                    selected={isSelected}
                    isPlayable={isHighlightedPlayable}
                    draggable={true}
                    onClick={() => onToggleCard(card)}
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragEnd={handleDragEnd}
                    size="md"
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="text-[11px] text-slate-400 text-center flex items-center gap-1.5 justify-center">
        <MoveHorizontal className="w-3.5 h-3.5 text-slate-500" />
        <span>Tap cards to select • Drag cards to reorder • Tap <strong>Play Hand</strong> to play</span>
      </div>
    </div>
  );
};
