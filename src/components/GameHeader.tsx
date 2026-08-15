import React, { useState } from 'react';
import { Volume2, VolumeX, HelpCircle, Copy, Check, LogOut, RotateCcw, History } from 'lucide-react';
import { sound } from '../utils/soundUtils';

interface GameHeaderProps {
  roomId: string;
  roundNumber: number;
  historyCount?: number;
  isHistoryOpen?: boolean;
  onToggleHistory?: () => void;
  onOpenRules: () => void;
  onLeaveRoom: () => void;
  onRestartRound: () => void;
  isHost: boolean;
}

export const GameHeader: React.FC<GameHeaderProps> = ({
  roomId,
  roundNumber,
  historyCount = 0,
  isHistoryOpen = false,
  onToggleHistory,
  onOpenRules,
  onLeaveRoom,
  onRestartRound,
  isHost,
}) => {
  const [isMuted, setIsMuted] = useState(sound.getMuted());
  const [copied, setCopied] = useState(false);

  const toggleSound = () => {
    const next = !isMuted;
    sound.setMuted(next);
    setIsMuted(next);
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="w-full flex items-center justify-between px-3 sm:px-6 py-2 bg-slate-900/90 border-b border-slate-800 backdrop-blur-md z-30 select-none">
      {/* Brand & Room Info */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="flex items-center gap-1 font-black text-sm sm:text-base text-amber-400">
          <span className="text-slate-100">♠</span>
          <span>BIG TWO</span>
        </div>

        <div className="h-4 w-px bg-slate-700 hidden sm:block" />

        {/* Room Code Badge */}
        <button
          onClick={copyRoomCode}
          className="flex items-center gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-mono text-slate-300 transition cursor-pointer"
          title="Click to copy Room Code"
        >
          <span className="text-slate-400 hidden xs:inline">Room:</span>
          <span className="font-bold text-amber-300">{roomId}</span>
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
        </button>

        {roundNumber > 0 && (
          <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/60 text-xs font-semibold">
            Round {roundNumber}
          </span>
        )}
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-1 sm:gap-2">
        {onToggleHistory && (
          <button
            onClick={onToggleHistory}
            className={`
              p-2 rounded-xl transition cursor-pointer text-xs flex items-center gap-1.5 border
              ${isHistoryOpen
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'}
            `}
            title="Toggle Play History Log"
          >
            <History className="w-4 h-4 text-amber-400" />
            <span className="hidden md:inline font-bold">History</span>
            {historyCount > 0 && (
              <span className="bg-amber-400 text-slate-950 font-bold px-1.5 py-0.2 rounded-full text-[10px] font-mono">
                {historyCount}
              </span>
            )}
          </button>
        )}

        {isHost && (
          <button
            onClick={onRestartRound}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-300 border border-slate-700 transition cursor-pointer text-xs flex items-center gap-1"
            title="Redeal / Restart Round"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden sm:inline">Redeal</span>
          </button>
        )}

        <button
          onClick={toggleSound}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-slate-100 border border-slate-700 transition cursor-pointer"
          title={isMuted ? 'Unmute audio' : 'Mute audio'}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
        </button>

        <button
          onClick={onOpenRules}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-300 border border-slate-700 transition cursor-pointer"
          title="View Big Two Rules & Rankings"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        <button
          onClick={onLeaveRoom}
          className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950/80 text-slate-400 hover:text-rose-300 border border-slate-700 hover:border-rose-800 transition cursor-pointer"
          title="Leave Room & Back to Lobby"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
