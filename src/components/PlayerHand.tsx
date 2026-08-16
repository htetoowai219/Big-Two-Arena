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
  sortAscending?: boolean;
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
  sortAscending = true,
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

  // Shared card fan renderer. `offset` maps a card's position within the fan
  // back to its index in the full hand (used for drag-and-drop reordering).
  const renderCardFan = (
    cards: Card[],
    offset: number,
    draggable: boolean,
    spaceClass: string,
    fanRotate = false,
  ) => (
    <div className={`flex items-end justify-center ${spaceClass}`}>
      {cards.map((card, i) => {
        const index = offset + i;
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
              transition-all duration-150 relative origin-bottom
              ${fanRotate && i === 0 && cards.length > 1 ? 'rotate-[-5deg]' : ''}
              ${fanRotate && i === cards.length - 1 && cards.length > 1 ? 'rotate-[5deg]' : ''}
              ${isDropTarget ? 'scale-110 -translate-y-2 ring-2 ring-blue-400 rounded-lg' : ''}
              ${isBeingDragged ? 'opacity-40 scale-95' : ''}
            `}
          >
            <PlayingCard
              card={card}
              selected={isSelected}
              isPlayable={isHighlightedPlayable}
              draggable={draggable}
              onClick={() => onToggleCard(card)}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragEnd={handleDragEnd}
              size="md"
            />
          </div>
        );
      })}
    </div>
  );

  // Mobile: split the hand into two rows so a big hand never needs to scroll.
  // Selected cards are pulled out of the fan into a tray above the rows so a
  // lifted card never covers its neighbors.
  const mobileSelectedCards = player.cards.filter((card) => selectedCardIds.has(card.id));
  const mobileUnselectedCards = player.cards.filter((card) => !selectedCardIds.has(card.id));
  const mobileHalf = Math.ceil(mobileUnselectedCards.length / 2);
  const mobileRows = [
    mobileUnselectedCards.slice(0, mobileHalf),
    mobileUnselectedCards.slice(mobileHalf),
  ].filter((row) => row.length > 0);

  return (
    <div className="w-full flex flex-col items-center select-none pt-1 pb-2 sm:pb-3 px-2 sm:px-4">
      {/* Hand Header Toolbar */}
      <div className="w-full max-w-4xl flex items-center justify-between gap-2 text-xs text-slate-300 mb-2 px-2">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <span className="text-sm sm:text-base shrink-0">{player.avatar}</span>
          <span className="font-bold text-slate-100 text-xs sm:text-sm truncate max-w-[90px] sm:max-w-[160px]">
            {player.name}
          </span>
          <span className="hidden sm:inline text-slate-400">(You)</span>
          <span className="shrink-0 bg-slate-800 text-amber-300 font-mono px-1.5 sm:px-2 py-0.5 rounded-full border border-slate-700 font-semibold text-[10px] sm:text-xs">
            {player.cards.length}
            <span className="hidden sm:inline"> cards</span>
          </span>
        </div>

        {/* Quick controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {isMyTurn && (
            <span className="bg-amber-500/20 text-amber-300 font-black px-2 py-0.5 rounded-full border border-amber-500/50 text-[10px] sm:text-xs animate-pulse whitespace-nowrap">
              Your Turn
            </span>
          )}

          {selectedCardIds.size > 0 && (
            <button
              id="btn-clear-selection"
              type="button"
              onClick={onClearSelection}
              className="flex items-center gap-1 text-slate-400 hover:text-slate-200 text-xs px-2 py-1 rounded-lg bg-slate-800/90 hover:bg-slate-700 transition cursor-pointer border border-slate-700 shrink-0"
              title={`Clear selection (${selectedCardIds.size} cards)`}
            >
              <XCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clear</span>
              <span>({selectedCardIds.size})</span>
            </button>
          )}

          <button
            id="btn-auto-sort"
            type="button"
            onClick={onSortCards}
            className="flex items-center gap-1 text-slate-200 hover:text-amber-300 text-xs px-2 py-1.5 sm:px-2.5 rounded-lg bg-slate-800/90 border border-slate-700 hover:border-slate-600 transition cursor-pointer shadow-sm active:scale-95 shrink-0"
            title="Tap to toggle sort order: ascending (smallest left, 3 → 2) or descending (biggest left, 2 → 3)"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Sort ({sortAscending ? '3 → 2' : '2 → 3'})</span>
          </button>
        </div>
      </div>

      {/* Cards Area */}
      {player.cards.length === 0 ? (
        <div className="py-5 text-center text-amber-300 font-bold flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-400" /> All cards cleared!
        </div>
      ) : (
        <>
          {/* Desktop: single fanned row (scrolls only if the hand is huge) */}
          <div className="hidden sm:flex w-full max-w-4xl overflow-x-auto overflow-y-visible no-scrollbar py-3 px-2 justify-center">
            <div className="min-w-max">
              {renderCardFan(player.cards, 0, true, '-space-x-5 md:-space-x-6 pb-1 px-3')}
            </div>
          </div>

          {/* Mobile: two stacked rows, no horizontal scroll, count beside each row */}
          <div className="sm:hidden w-full flex flex-col items-center gap-1.5 pt-2 pb-1 px-1">
            {mobileSelectedCards.length > 0 && (
              <div className="w-full flex justify-center">
                <div className="rounded-xl border border-dashed border-amber-400/50 bg-amber-500/10 px-1 py-0.5">
                  {renderCardFan(mobileSelectedCards, 0, false, '-space-x-4')}
                </div>
              </div>
            )}
            {mobileRows.map((row, rowIndex) => (
              <div key={rowIndex} className="w-full flex items-center justify-center gap-1">
                <div className="flex items-end justify-center">
                  {renderCardFan(row, rowIndex * mobileHalf, false, '-space-x-6', true)}
                </div>
                <span className="shrink-0 self-center bg-slate-800 text-amber-300 font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-slate-700">
                  {row.length}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="text-[11px] text-slate-400 text-center flex items-center gap-1.5 justify-center">
        <span className="hidden sm:flex items-center gap-1.5">
          <MoveHorizontal className="w-3.5 h-3.5 text-slate-500" />
          <span>Tap cards to select • Drag cards to reorder • Tap <strong>Play Hand</strong> to play</span>
        </span>
        <span className="sm:hidden">
          Tap cards to select • Tap <strong>Play Hand</strong> to play
        </span>
      </div>
    </div>
  );
};
