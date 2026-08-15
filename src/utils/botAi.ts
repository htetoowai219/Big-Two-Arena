import { Card, PlayedHand } from '../types';
import { evaluateHand, findPlayableCombinations, sortCards } from './cardUtils';

/**
 * Intelligent Bot strategy for Big Two
 */
export function decideBotMove(
  hand: Card[],
  currentHand: PlayedHand | null,
  otherPlayersCardCounts: number[]
): Card[] | null {
  if (hand.length === 0) return null;

  const playable = findPlayableCombinations(hand, currentHand);
  if (playable.length === 0) {
    return null; // Must pass
  }

  // If table is free (leading the trick)
  if (!currentHand) {
    // 1. If we have a 5-card combo, leading it early is very strong
    const fiveCardCombos = playable.filter(c => c.length === 5);
    if (fiveCardCombos.length > 0) {
      // Pick lowest 5-card combo
      return fiveCardCombos[0];
    }

    // 2. If we have triples, play lowest triple
    const triples = playable.filter(c => c.length === 3);
    if (triples.length > 0) {
      return triples[0];
    }

    // 3. If we have pairs, play lowest pair (saving 2s if possible)
    const pairs = playable.filter(c => c.length === 2);
    if (pairs.length > 0) {
      const nonTwoPairs = pairs.filter(p => p[0].rank !== '2');
      if (nonTwoPairs.length > 0) {
        return nonTwoPairs[0];
      }
      return pairs[0];
    }

    // 4. Play lowest single
    const singles = playable.filter(c => c.length === 1);
    const nonTwoSingles = singles.filter(s => s[0].rank !== '2');
    if (nonTwoSingles.length > 0) {
      return nonTwoSingles[0];
    }
    return singles[0];
  }

  // Responding to an active trick on the table
  // Sort playable candidates by evaluated primary rank value ascending (play cheapest winner)
  const evaluatedList = playable.map(cards => ({
    cards,
    eval: evaluateHand(cards),
  })).filter(item => item.eval !== null);

  evaluatedList.sort((a, b) => (a.eval!.primaryRankValue) - (b.eval!.primaryRankValue));

  if (evaluatedList.length === 0) {
    return null;
  }

  const cheapest = evaluatedList[0];

  // Strategic decision: If someone is down to 1 or 2 cards, play aggressively!
  const minOpponentCards = Math.min(...otherPlayersCardCounts);
  const isEmergency = minOpponentCards <= 2;

  // If not emergency, avoid burning a high '2' on a low lead if we can pass and wait for control
  if (!isEmergency && cheapest.cards.length === 1 && cheapest.cards[0].rank === '2') {
    // If current lead is very low (e.g. 3, 4, 5, 6), 50% chance to pass and save 2 for later control
    if (currentHand.primaryRankValue < 30 && Math.random() < 0.5) {
      return null;
    }
  }

  return cheapest.cards;
}
