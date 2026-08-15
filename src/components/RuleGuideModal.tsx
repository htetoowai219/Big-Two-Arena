import React from 'react';
import { X, Trophy, Sparkles, HelpCircle, Layers, ShieldCheck } from 'lucide-react';

interface RuleGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RuleGuideModal: React.FC<RuleGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-200 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-100 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-100">Big Two Rules & Guide</h2>
            <p className="text-xs sm:text-sm text-slate-400">Official rules, card rankings & winning combinations</p>
          </div>
        </div>

        {/* Section 1: Card & Suit Priority */}
        <div className="space-y-6 text-sm">
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
            <h3 className="font-bold text-amber-300 flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4" /> Card Hierarchy & Priority
            </h3>
            <div className="space-y-2">
              <div>
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">Rank Order (High to Low):</span>
                <div className="flex flex-wrap items-center gap-1.5 mt-1 font-mono font-bold text-slate-100">
                  <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded">2 (Highest)</span>
                  <span>&gt;</span>
                  <span className="px-1.5 py-0.5 bg-slate-800 rounded">A</span>
                  <span>&gt;</span>
                  <span className="px-1.5 py-0.5 bg-slate-800 rounded">K</span>
                  <span>&gt;</span>
                  <span className="px-1.5 py-0.5 bg-slate-800 rounded">Q</span>
                  <span>&gt;</span>
                  <span className="px-1.5 py-0.5 bg-slate-800 rounded">J</span>
                  <span>&gt;</span>
                  <span className="px-1.5 py-0.5 bg-slate-800 rounded">10</span>
                  <span>&gt;</span>
                  <span className="px-1.5 py-0.5 bg-slate-800 rounded">9</span>
                  <span>&gt;</span>
                  <span className="px-1.5 py-0.5 bg-slate-800 rounded">8</span>
                  <span>&gt;</span>
                  <span className="px-1.5 py-0.5 bg-slate-800 rounded">7</span>
                  <span>&gt;</span>
                  <span className="px-1.5 py-0.5 bg-slate-800 rounded">6</span>
                  <span>&gt;</span>
                  <span className="px-1.5 py-0.5 bg-slate-800 rounded">5</span>
                  <span>&gt;</span>
                  <span className="px-1.5 py-0.5 bg-slate-800 rounded">4</span>
                  <span>&gt;</span>
                  <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded">3 (Lowest)</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800">
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">Suit Priority (High to Low):</span>
                <div className="flex items-center gap-2 mt-1 font-bold text-sm">
                  <span className="text-slate-100 bg-slate-800 px-2 py-0.5 rounded">♠ Spades</span>
                  <span>&gt;</span>
                  <span className="text-rose-500 bg-rose-950/40 px-2 py-0.5 rounded border border-rose-800/40">♥ Hearts</span>
                  <span>&gt;</span>
                  <span className="text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">♣ Clubs</span>
                  <span>&gt;</span>
                  <span className="text-amber-500 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/40">♦ Diamonds</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Hand Types & 5-Card Combo Hierarchy */}
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
            <h3 className="font-bold text-amber-300 flex items-center gap-2 mb-2">
              <Layers className="w-4 h-4" /> Hand Types & 5-Card Hierarchy
            </h3>
            <div className="space-y-3 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                  <div className="font-bold text-slate-200">1. Singles (1 Card)</div>
                  <div className="text-xs text-slate-400 mt-1">Beaten by higher card (e.g. 2♠ beats 2♥, 8♦ beats 7♠).</div>
                </div>
                <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                  <div className="font-bold text-slate-200">2. Doubles / Pairs (2 Cards)</div>
                  <div className="text-xs text-slate-400 mt-1">Same rank (e.g. 8♠8♦ beats 8♥8♣, 9♦9♣ beats 8♠8♥).</div>
                </div>
                <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                  <div className="font-bold text-slate-200">3. Triples (3 Cards)</div>
                  <div className="text-xs text-slate-400 mt-1">3 cards of same rank (e.g. K♠K♥K♦ beats Q♠Q♥Q♣).</div>
                </div>
              </div>

              <div>
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-1">
                  5-Card Combos (Ranked from Highest to Lowest):
                </span>
                <div className="space-y-1.5 font-sans">
                  <div className="flex items-center justify-between p-2 rounded-xl bg-amber-500/10 border border-amber-500/30">
                    <span className="font-bold text-amber-300">1. Straight Flush (Highest 5-card hand)</span>
                    <span className="text-xs text-slate-300">5 cards in order of the same suit</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="font-bold text-slate-200">2. Four of a Kind (+ 1 Random)</span>
                    <span className="text-xs text-slate-300">4 same number + 1 kicker</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="font-bold text-slate-200">3. Full House</span>
                    <span className="text-xs text-slate-300">3 of a kind + 1 pair (e.g. 55533 &gt; 444KK)</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="font-bold text-slate-200">4. Straight</span>
                    <span className="text-xs text-slate-300">5 cards in order with mixed suits</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Special Rules */}
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-2">
            <h3 className="font-bold text-amber-300 flex items-center gap-2 mb-1">
              <ShieldCheck className="w-4 h-4" /> Special Rules & Flow
            </h3>
            <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-slate-300">
              <li>
                <strong className="text-amber-300">Instant Win on Deal:</strong> If a player is dealt a hand containing all four 2's (♦2, ♣2, ♥2, ♠2), that player wins the round automatically!
              </li>
              <li>
                <strong className="text-slate-100">Leading the Trick:</strong> The player with the lowest card (or winner of the previous round) plays first with any valid hand category.
              </li>
              <li>
                <strong className="text-slate-100">Following Hands:</strong> Players must play a higher hand of the exact same category and size. For 5-card hands, higher combo types beat lower combo types.
              </li>
              <li>
                <strong className="text-slate-100">Passing & Control:</strong> If you cannot or choose not to play, you can pass. When all other players pass in succession, you gain table control and can start a fresh new trick with any hand!
              </li>
              <li>
                <strong className="text-slate-100">Winning:</strong> The game concludes immediately when a player clears all cards in their hand.
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition cursor-pointer shadow-lg active:scale-95"
          >
            Got It, Let's Play!
          </button>
        </div>
      </div>
    </div>
  );
};
