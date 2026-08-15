import React from 'react';
import { Card } from '../types';
import { SUIT_SYMBOLS, SUIT_NAMES } from '../utils/cardUtils';

interface PlayingCardProps {
  card?: Card;
  faceDown?: boolean;
  selected?: boolean;
  isPlayable?: boolean;
  onClick?: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  draggable?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  id?: string;
}

export const PlayingCard: React.FC<PlayingCardProps> = ({
  card,
  faceDown = false,
  selected = false,
  isPlayable = true,
  onClick,
  onDragStart,
  onDragEnd,
  draggable = false,
  size = 'md',
  className = '',
  id,
}) => {
  if (faceDown || !card) {
    // Face down card back
    const sizeClasses = {
      sm: 'w-10 h-14 rounded-md',
      md: 'w-14 h-20 sm:w-16 sm:h-24 rounded-lg',
      lg: 'w-18 h-26 sm:w-20 sm:h-28 rounded-xl',
    }[size];

    return (
      <div
        id={id}
        className={`${sizeClasses} bg-gradient-to-br from-indigo-800 via-blue-900 to-slate-950 border-2 border-indigo-300/40 shadow-md flex items-center justify-center relative overflow-hidden select-none flex-shrink-0 ${className}`}
      >
        {/* Card back decorative geometric pattern */}
        <div className="absolute inset-1 border border-indigo-400/30 rounded flex items-center justify-center bg-indigo-950/60">
          <div className="w-5 h-5 rounded-full border border-indigo-400/40 flex items-center justify-center">
            <span className="text-[10px] text-indigo-300 font-bold">♠2</span>
          </div>
        </div>
      </div>
    );
  }

  // Color mapping
  const isRed = card.suit === 'hearts' || card.suit === 'diamonds';
  const suitSymbol = SUIT_SYMBOLS[card.suit];

  const suitColorClass = {
    spades: 'text-slate-900 dark:text-slate-100',
    hearts: 'text-rose-600 dark:text-rose-500',
    clubs: 'text-emerald-700 dark:text-emerald-400',
    diamonds: 'text-amber-600 dark:text-amber-500',
  }[card.suit];

  const sizeClasses = {
    sm: 'w-10 h-14 text-xs rounded-md',
    md: 'w-14 h-20 sm:w-16 sm:h-24 sm:text-base text-sm rounded-lg',
    lg: 'w-18 h-26 sm:w-20 sm:h-28 text-lg rounded-xl',
  }[size];

  return (
    <div
      id={id || `card-${card.id}`}
      draggable={draggable}
      onClick={onClick}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      style={{ touchAction: 'manipulation' }}
      className={`
        ${sizeClasses}
        relative bg-white dark:bg-slate-900 border-2 select-none cursor-pointer flex-shrink-0
        transition-all duration-150 ease-out flex flex-col justify-between p-1 sm:p-1.5
        ${selected 
          ? '-translate-y-4 shadow-xl border-amber-500 ring-2 ring-amber-400/60 dark:ring-amber-500/50 bg-amber-50/50 dark:bg-amber-950/30 z-20' 
          : 'shadow-md border-slate-200 dark:border-slate-700 hover:-translate-y-1 hover:shadow-lg'}
        ${!isPlayable ? 'opacity-60 grayscale-[30%]' : ''}
        ${draggable ? 'active:cursor-grabbing hover:cursor-grab' : ''}
        ${className}
      `}
      title={`${card.rank} of ${SUIT_NAMES[card.suit]}`}
    >
      {/* Top Left Rank + Suit */}
      <div className={`flex flex-col items-center leading-none ${suitColorClass}`}>
        <span className="font-extrabold tracking-tighter text-xs sm:text-sm">{card.rank}</span>
        <span className="text-xs sm:text-sm font-bold">{suitSymbol}</span>
      </div>

      {/* Center Large Suit Symbol or Face Pattern */}
      <div className={`absolute inset-0 flex items-center justify-center pointer-events-none ${suitColorClass}`}>
        <span className="text-xl sm:text-2xl font-bold opacity-85">
          {suitSymbol}
        </span>
      </div>

      {/* Bottom Right Inverted Rank + Suit */}
      <div className={`flex flex-col items-center leading-none rotate-180 ${suitColorClass}`}>
        <span className="font-extrabold tracking-tighter text-xs sm:text-sm">{card.rank}</span>
        <span className="text-xs sm:text-sm font-bold">{suitSymbol}</span>
      </div>

      {/* Special indicator for the '2' cards (Big Two hierarchy high cards) */}
      {card.rank === '2' && (
        <div className="absolute -top-1.5 -right-1.5 bg-amber-500 text-slate-950 rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-black shadow">
          ★
        </div>
      )}
    </div>
  );
};
