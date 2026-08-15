import React, { useEffect } from 'react';
import { GameState, Player } from '../types';
import { Trophy, Flame, RotateCcw, Award, ArrowRight, Settings2 } from 'lucide-react';
import confetti from 'canvas-confetti';

interface GameScoreboardProps {
  gameState: GameState;
  myPlayerId: string;
  isHost: boolean;
  onNextRound: () => void;
  onReturnToLobby: () => void;
}

export const GameScoreboard: React.FC<GameScoreboardProps> = ({
  gameState,
  myPlayerId,
  isHost,
  onNextRound,
  onReturnToLobby,
}) => {
  const winner = gameState.players.find(p => p.id === gameState.roundWinnerId);
  const isMeWinner = gameState.roundWinnerId === myPlayerId;

  useEffect(() => {
    // Launch festive victory confetti
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      // safe fallback
    }
  }, []);

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Banner */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/20 border-2 border-amber-400/50 flex items-center justify-center text-amber-400 mb-3 shadow-lg animate-bounce">
            <Trophy className="w-9 h-9" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-200">
            {isMeWinner ? '🎉 Victory! You Won!' : `${winner?.name || 'Player'} Won the Round!`}
          </h2>

          {gameState.instantWinReason ? (
            <div className="mt-2 px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full text-xs font-bold flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-amber-400" />
              {gameState.instantWinReason}
            </div>
          ) : (
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Round {gameState.roundNumber} concluded
            </p>
          )}
        </div>

        {/* Players Standings & Scores */}
        <div className="space-y-2.5 mb-6">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-1">
            Player Standings & Scoreboard
          </div>

          {gameState.players
            .slice()
            .sort((a, b) => b.score - a.score)
            .map((player, idx) => {
              const isWinnerOfRound = player.id === gameState.roundWinnerId;
              const isCurrentMe = player.id === myPlayerId;

              return (
                <div
                  key={player.id}
                  className={`
                    flex items-center justify-between p-3 rounded-2xl border transition
                    ${isWinnerOfRound 
                      ? 'bg-amber-500/15 border-amber-500/40 shadow' 
                      : 'bg-slate-950/60 border-slate-800'}
                    ${isCurrentMe ? 'ring-1 ring-amber-400/30' : ''}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-5 text-center font-bold text-sm text-slate-400">
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                    </span>
                    <span className="text-xl">{player.avatar}</span>
                    <div>
                      <div className="font-bold text-sm text-slate-200 flex items-center gap-1.5">
                        <span>{player.name}</span>
                        {isCurrentMe && <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">You</span>}
                      </div>
                      <div className="text-xs text-slate-400">
                        {isWinnerOfRound ? (
                          <span className="text-emerald-400 font-medium">Cleared all cards (+20 pts)</span>
                        ) : (
                          <span>{player.cards.length} cards remaining</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-lg font-black text-amber-300 font-mono">{player.score} pts</div>
                  </div>
                </div>
              );
            })}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onReturnToLobby}
            className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 text-sm font-bold border border-slate-700 transition cursor-pointer flex items-center justify-center gap-2"
          >
            <Settings2 className="w-4 h-4" />
            Lobby & Settings
          </button>

          <button
            type="button"
            onClick={onNextRound}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-95 text-slate-950 text-sm font-black transition shadow-lg cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Next Round</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
