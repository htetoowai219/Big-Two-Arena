import { Card, Rank, Suit, PlayedHand, HandCategory, FiveCardComboType } from '../types';

export const SUITS: Suit[] = ['diamonds', 'clubs', 'hearts', 'spades'];
export const RANKS: Rank[] = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'];

export const SUIT_SYMBOLS: Record<Suit, string> = {
  diamonds: '♦',
  clubs: '♣',
  hearts: '♥',
  spades: '♠',
};

export const SUIT_NAMES: Record<Suit, string> = {
  diamonds: 'Diamonds',
  clubs: 'Clubs',
  hearts: 'Hearts',
  spades: 'Spades',
};

export const SUIT_COLORS: Record<Suit, string> = {
  diamonds: 'text-amber-600 dark:text-amber-500',
  clubs: 'text-emerald-700 dark:text-emerald-400',
  hearts: 'text-rose-600 dark:text-rose-500',
  spades: 'text-slate-900 dark:text-slate-100',
};

export const SUIT_VALUES: Record<Suit, number> = {
  diamonds: 0,
  clubs: 1,
  hearts: 2,
  spades: 3,
};

export const RANK_VALUES: Record<Rank, number> = {
  '3': 3,
  '4': 4,
  '5': 5,
  '6': 6,
  '7': 7,
  '8': 8,
  '9': 9,
  '10': 10,
  'J': 11,
  'Q': 12,
  'K': 13,
  'A': 14,
  '2': 15,
};

export const COMBO_TIERS: Record<FiveCardComboType, number> = {
  'straight': 1,
  'full-house': 2,
  'four-of-a-kind': 3,
  'straight-flush': 4,
};

export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const rank of RANKS) {
    for (const suit of SUITS) {
      const suitVal = SUIT_VALUES[suit];
      const rankVal = RANK_VALUES[rank];
      deck.push({
        id: `${rank}_${suit}`,
        rank,
        suit,
        suitValue: suitVal,
        rankValue: rankVal,
        totalRank: rankVal * 4 + suitVal,
      });
    }
  }
  return deck;
}

export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function sortCards(cards: Card[]): Card[] {
  return [...cards].sort((a, b) => a.totalRank - b.totalRank);
}

/**
 * Checks if a hand has all 4 Twos (Instant Win condition)
 */
export function hasFourTwos(cards: Card[]): boolean {
  const twos = cards.filter(c => c.rank === '2');
  return twos.length === 4;
}

/**
 * Checks if 5 cards form a Straight sequence
 * Returns null if not straight, or the top card if it is a straight.
 */
function getStraightTopCard(cards: Card[]): Card | null {
  if (cards.length !== 5) return null;
  // Sort cards by Big Two rank value (3..15)
  const sorted = [...cards].sort((a, b) => a.rankValue - b.rankValue);
  const ranks = sorted.map(c => c.rankValue);

  // 1. Standard consecutive: 3-4-5-6-7, 4-5-6-7-8, ..., 10-J-Q-K-A (10-11-12-13-14), J-Q-K-A-2 (11-12-13-14-15)
  let isStandardConsecutive = true;
  for (let i = 0; i < 4; i++) {
    if (ranks[i + 1] !== ranks[i] + 1) {
      isStandardConsecutive = false;
      break;
    }
  }

  if (isStandardConsecutive) {
    // Top card is the last one in the sequence
    return sorted[4];
  }

  // 2. Wrap-around straights with Ace/2:
  // A-2-3-4-5 -> ranks [3, 4, 5, 14, 15]
  if (ranks[0] === 3 && ranks[1] === 4 && ranks[2] === 5 && ranks[3] === 14 && ranks[4] === 15) {
    // In Big Two, 2 is the highest rank card in A-2-3-4-5
    const twoCard = sorted.find(c => c.rank === '2')!;
    return twoCard;
  }

  // 2-3-4-5-6 -> ranks [3, 4, 5, 6, 15]
  if (ranks[0] === 3 && ranks[1] === 4 && ranks[2] === 5 && ranks[3] === 6 && ranks[4] === 15) {
    const twoCard = sorted.find(c => c.rank === '2')!;
    return twoCard;
  }

  // Q-K-A-2-3 -> ranks [3, 12, 13, 14, 15]
  if (ranks[0] === 3 && ranks[1] === 12 && ranks[2] === 13 && ranks[3] === 14 && ranks[4] === 15) {
    const twoCard = sorted.find(c => c.rank === '2')!;
    return twoCard;
  }

  return null;
}

/**
 * Analyzes cards and evaluates the hand combination
 */
export function evaluateHand(cards: Card[], playerId: string = '', playerName: string = ''): PlayedHand | null {
  if (!cards || cards.length === 0) return null;
  const sorted = sortCards(cards);

  // Single card
  if (cards.length === 1) {
    const card = cards[0];
    return {
      playerId,
      playerName,
      cards: [card],
      category: 'single',
      primaryRankValue: card.totalRank,
      formattedName: `Single ${card.rank}${SUIT_SYMBOLS[card.suit]}`,
      timestamp: Date.now(),
    };
  }

  // Pair (Double)
  if (cards.length === 2) {
    if (cards[0].rank === cards[1].rank) {
      const highestCard = sorted[1];
      return {
        playerId,
        playerName,
        cards: sorted,
        category: 'pair',
        primaryRankValue: cards[0].rankValue * 4 + highestCard.suitValue,
        formattedName: `Pair of ${cards[0].rank}s (${SUIT_SYMBOLS[highestCard.suit]} high)`,
        timestamp: Date.now(),
      };
    }
    return null;
  }

  // Triple
  if (cards.length === 3) {
    if (cards[0].rank === cards[1].rank && cards[1].rank === cards[2].rank) {
      return {
        playerId,
        playerName,
        cards: sorted,
        category: 'triple',
        primaryRankValue: cards[0].rankValue,
        formattedName: `Triple ${cards[0].rank}s`,
        timestamp: Date.now(),
      };
    }
    return null;
  }

  // 5 Card Combos
  if (cards.length === 5) {
    // Count ranks
    const rankCounts: Record<string, { count: number; rankValue: number; cards: Card[] }> = {};
    for (const card of cards) {
      if (!rankCounts[card.rank]) {
        rankCounts[card.rank] = { count: 0, rankValue: card.rankValue, cards: [] };
      }
      rankCounts[card.rank].count++;
      rankCounts[card.rank].cards.push(card);
    }

    const counts = Object.values(rankCounts);
    const isSameSuit = cards.every(c => c.suit === cards[0].suit);
    const straightTopCard = getStraightTopCard(cards);

    // 1. Straight Flush (Cards in order of same house)
    if (straightTopCard && isSameSuit) {
      return {
        playerId,
        playerName,
        cards: sorted,
        category: 'five-card',
        comboType: 'straight-flush',
        primaryRankValue: COMBO_TIERS['straight-flush'] * 1000 + straightTopCard.totalRank,
        formattedName: `Straight Flush (${SUIT_NAMES[straightTopCard.suit]}, ${straightTopCard.rank} high)`,
        timestamp: Date.now(),
      };
    }

    // 2. Four of a kind (4 of same number + 1 random)
    const fourOfKindGroup = counts.find(g => g.count === 4);
    if (fourOfKindGroup) {
      return {
        playerId,
        playerName,
        cards: sorted,
        category: 'five-card',
        comboType: 'four-of-a-kind',
        primaryRankValue: COMBO_TIERS['four-of-a-kind'] * 1000 + fourOfKindGroup.rankValue,
        formattedName: `Four of a Kind (${fourOfKindGroup.cards[0].rank}s)`,
        timestamp: Date.now(),
      };
    }

    // 3. Full House (3 of same number + 2 of same number)
    const threeGroup = counts.find(g => g.count === 3);
    const twoGroup = counts.find(g => g.count === 2);
    if (threeGroup && twoGroup) {
      return {
        playerId,
        playerName,
        cards: sorted,
        category: 'five-card',
        comboType: 'full-house',
        primaryRankValue: COMBO_TIERS['full-house'] * 1000 + threeGroup.rankValue,
        formattedName: `Full House (${threeGroup.cards[0].rank}s over ${twoGroup.cards[0].rank}s)`,
        timestamp: Date.now(),
      };
    }

    // 4. Straight (Cards in order with random house)
    if (straightTopCard) {
      return {
        playerId,
        playerName,
        cards: sorted,
        category: 'five-card',
        comboType: 'straight',
        primaryRankValue: COMBO_TIERS['straight'] * 1000 + straightTopCard.totalRank,
        formattedName: `Straight (${straightTopCard.rank}${SUIT_SYMBOLS[straightTopCard.suit]} high)`,
        timestamp: Date.now(),
      };
    }
  }

  return null;
}

/**
 * Checks whether newHand beats the current on-table hand
 */
export function canBeatHand(newHand: PlayedHand, currentHand: PlayedHand | null): { canBeat: boolean; reason?: string } {
  if (!currentHand) {
    return { canBeat: true };
  }

  if (newHand.cards.length !== currentHand.cards.length) {
    return {
      canBeat: false,
      reason: `Must play ${currentHand.cards.length} card${currentHand.cards.length > 1 ? 's' : ''} to match the current hand.`,
    };
  }

  if (newHand.category !== currentHand.category) {
    return {
      canBeat: false,
      reason: `Hand type does not match current ${currentHand.category}.`,
    };
  }

  // 1-card, 2-card, 3-card comparisons
  if (newHand.category === 'single') {
    if (newHand.primaryRankValue > currentHand.primaryRankValue) {
      return { canBeat: true };
    }
    return {
      canBeat: false,
      reason: `Your card is lower than ${currentHand.formattedName}.`,
    };
  }

  if (newHand.category === 'pair') {
    if (newHand.primaryRankValue > currentHand.primaryRankValue) {
      return { canBeat: true };
    }
    return {
      canBeat: false,
      reason: `Your pair is lower than ${currentHand.formattedName}.`,
    };
  }

  if (newHand.category === 'triple') {
    if (newHand.primaryRankValue > currentHand.primaryRankValue) {
      return { canBeat: true };
    }
    return {
      canBeat: false,
      reason: `Your triple is lower than ${currentHand.formattedName}.`,
    };
  }

  // 5-card combo comparisons
  if (newHand.category === 'five-card') {
    if (!newHand.comboType || !currentHand.comboType) {
      return { canBeat: false, reason: 'Invalid 5-card combination.' };
    }

    const newTier = COMBO_TIERS[newHand.comboType];
    const currentTier = COMBO_TIERS[currentHand.comboType];

    if (newTier > currentTier) {
      return { canBeat: true };
    }

    if (newTier < currentTier) {
      return {
        canBeat: false,
        reason: `${newHand.comboType.replace('-', ' ')} ranks lower than ${currentHand.comboType.replace('-', ' ')}.`,
      };
    }

    // Same combo type: compare primary rank value
    if (newHand.primaryRankValue > currentHand.primaryRankValue) {
      return { canBeat: true };
    }

    return {
      canBeat: false,
      reason: `Your ${newHand.comboType.replace('-', ' ')} is lower than the active ${currentHand.comboType.replace('-', ' ')}.`,
    };
  }

  return { canBeat: false, reason: 'Invalid move.' };
}

/**
 * Finds all valid playable combinations from a player's hand that can beat the current table hand
 */
export function findPlayableCombinations(hand: Card[], currentHand: PlayedHand | null): Card[][] {
  const sorted = sortCards(hand);
  const results: Card[][] = [];

  // If table is empty (free turn): player can play any valid single, pair, triple, or 5-card combo
  if (!currentHand) {
    // Singles
    for (const card of sorted) {
      results.push([card]);
    }
    // Pairs
    for (let i = 0; i < sorted.length - 1; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        if (sorted[i].rank === sorted[j].rank) {
          results.push([sorted[i], sorted[j]]);
        }
      }
    }
    // Triples
    for (let i = 0; i < sorted.length - 2; i++) {
      for (let j = i + 1; j < sorted.length - 1; j++) {
        for (let k = j + 1; k < sorted.length; k++) {
          if (sorted[i].rank === sorted[j].rank && sorted[j].rank === sorted[k].rank) {
            results.push([sorted[i], sorted[j], sorted[k]]);
          }
        }
      }
    }
    // 5-card combos
    if (sorted.length >= 5) {
      const combos = getFiveCardCombinations(sorted);
      for (const combo of combos) {
        const evaluated = evaluateHand(combo);
        if (evaluated) results.push(combo);
      }
    }
    return results;
  }

  const reqCount = currentHand.cards.length;

  if (reqCount === 1) {
    for (const card of sorted) {
      const evaluated = evaluateHand([card]);
      if (evaluated && canBeatHand(evaluated, currentHand).canBeat) {
        results.push([card]);
      }
    }
  } else if (reqCount === 2) {
    for (let i = 0; i < sorted.length - 1; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        if (sorted[i].rank === sorted[j].rank) {
          const pair = [sorted[i], sorted[j]];
          const evaluated = evaluateHand(pair);
          if (evaluated && canBeatHand(evaluated, currentHand).canBeat) {
            results.push(pair);
          }
        }
      }
    }
  } else if (reqCount === 3) {
    for (let i = 0; i < sorted.length - 2; i++) {
      for (let j = i + 1; j < sorted.length - 1; j++) {
        for (let k = j + 1; k < sorted.length; k++) {
          if (sorted[i].rank === sorted[j].rank && sorted[j].rank === sorted[k].rank) {
            const triple = [sorted[i], sorted[j], sorted[k]];
            const evaluated = evaluateHand(triple);
            if (evaluated && canBeatHand(evaluated, currentHand).canBeat) {
              results.push(triple);
            }
          }
        }
      }
    }
  } else if (reqCount === 5) {
    const combos = getFiveCardCombinations(sorted);
    for (const combo of combos) {
      const evaluated = evaluateHand(combo);
      if (evaluated && canBeatHand(evaluated, currentHand).canBeat) {
        results.push(combo);
      }
    }
  }

  return results;
}

/**
 * Helper to generate 5-card sub-combinations
 */
function getFiveCardCombinations(cards: Card[]): Card[][] {
  const results: Card[][] = [];
  const n = cards.length;
  if (n < 5) return results;

  // Generate combinations
  function helper(start: number, combo: Card[]) {
    if (combo.length === 5) {
      results.push([...combo]);
      return;
    }
    for (let i = start; i < n; i++) {
      combo.push(cards[i]);
      helper(i + 1, combo);
      combo.pop();
    }
  }

  helper(0, []);
  return results;
}
