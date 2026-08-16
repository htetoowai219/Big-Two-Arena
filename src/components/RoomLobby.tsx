import React, { useState } from 'react';
import { Users, Bot, Play, LogIn, Shield } from 'lucide-react';

interface RoomLobbyProps {
  playerName: string;
  onUpdatePlayer: (name: string) => void;
  onCreateRoom: (config: { playerCount: number; cardsPerPlayer: number; autoFillBots: boolean }) => void;
  onJoinRoom: (roomId: string) => void;
  activeRoomId?: string | null;
  isHost?: boolean;
}

export const RoomLobby: React.FC<RoomLobbyProps> = ({
  playerName,
  onUpdatePlayer,
  onCreateRoom,
  onJoinRoom,
  activeRoomId,
  isHost,
}) => {
  const [playerCount, setPlayerCount] = useState<number>(4);
  const [cardsPerPlayer, setCardsPerPlayer] = useState<number>(13);
  const [autoFillBots, setAutoFillBots] = useState<boolean>(true);
  const [joinRoomInput, setJoinRoomInput] = useState<string>('');

  // Maximum allowed cards per player based on selected player count
  const maxCardsForPlayerCount = Math.floor(52 / playerCount);

  // Adjust cardsPerPlayer when playerCount changes
  const handlePlayerCountChange = (count: number) => {
    setPlayerCount(count);
    const max = Math.floor(52 / count);
    if (cardsPerPlayer > max) {
      setCardsPerPlayer(max);
    }
  };

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateRoom({
      playerCount,
      cardsPerPlayer: Math.min(cardsPerPlayer, maxCardsForPlayerCount),
      autoFillBots,
    });
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinRoomInput.trim()) {
      onJoinRoom(joinRoomInput.trim().toUpperCase());
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4 sm:p-6 text-slate-100 flex flex-col items-center">
      {/* Brand Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-slate-900 border border-slate-700 mb-3 shadow-xl">
          <div className="flex items-center gap-2 text-2xl sm:text-3xl font-black">
            <span className="text-slate-100 drop-shadow">♠</span>
            <span className="text-red-500 drop-shadow">♥</span>
            <span className="text-slate-100 drop-shadow">♣</span>
            <span className="text-red-500 drop-shadow">♦</span>
          </div>
        </div>

        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-100">
          BIG TWO
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-md mx-auto">
          Authentic rules, real-time multiplayer, smart bot fills & custom card reordering.
        </p>
      </div>

      {/* Main Container Card */}
      <div className="w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl backdrop-blur-md space-y-6">
        {/* Player Profile Section */}
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
            Your Name
          </label>

          <input
            type="text"
            value={playerName}
            onChange={(e) => onUpdatePlayer(e.target.value)}
            placeholder="Enter your name to play"
            maxLength={20}
            autoFocus
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition"
          />

          {!playerName.trim() && (
            <p className="text-xs text-amber-400/90">Enter a name to launch or join a game.</p>
          )}
        </div>

        {/* Room & Game Configuration */}
        <form onSubmit={handleCreateRoom} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Player Count Selection (up to 4) */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
              <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
                <Users className="w-4 h-4 text-amber-400" />
                Player Count (Up to 4)
              </label>

              <div className="grid grid-cols-3 gap-2">
                {[2, 3, 4].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => handlePlayerCountChange(count)}
                    className={`py-2.5 rounded-xl text-sm font-bold transition cursor-pointer flex flex-col items-center ${
                      playerCount === count
                        ? 'bg-amber-500 text-slate-950 shadow-md ring-2 ring-amber-300'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <span>{count} Players</span>
                    <span className="text-[10px] opacity-80">Max {Math.floor(52 / count)} cards</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Cards per player selection */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
                  <span>Cards Dealt / Player</span>
                </label>
                <span className="text-sm font-mono font-bold text-amber-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                  {cardsPerPlayer} Cards
                </span>
              </div>

              <input
                type="range"
                min={3}
                max={maxCardsForPlayerCount}
                value={cardsPerPlayer}
                onChange={(e) => setCardsPerPlayer(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
              />

              <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                <span>Min: 3</span>
                <span>Total dealt: {cardsPerPlayer * playerCount} / 52</span>
                <span>Max: {maxCardsForPlayerCount}</span>
              </div>
            </div>
          </div>

          {/* AI Bot Fill Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-200">Auto-fill Missing Slots with AI Bots</div>
                <div className="text-xs text-slate-400">Play immediately solo or with friends online</div>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={autoFillBots}
                onChange={(e) => setAutoFillBots(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>

          {/* Start Game Action */}
          <button
            id="btn-create-start-game"
            type="submit"
            disabled={!playerName.trim()}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 disabled:hover:from-amber-500 disabled:hover:to-amber-500 text-slate-950 font-black text-base transition shadow-xl shadow-amber-500/20 active:scale-[0.99] disabled:active:scale-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>Launch Game ({playerCount} Players • {cardsPerPlayer} Cards)</span>
          </button>
        </form>

        {/* Join Room by Code Divider */}
        <div className="relative flex items-center justify-center my-4">
          <div className="border-t border-slate-800 w-full" />
          <span className="bg-slate-900 px-3 text-xs uppercase font-semibold text-slate-500 absolute">
            Or Join Existing Room
          </span>
        </div>

        {/* Join Room Form */}
        <form onSubmit={handleJoin} className="flex items-center gap-2">
          <input
            type="text"
            value={joinRoomInput}
            onChange={(e) => setJoinRoomInput(e.target.value)}
            placeholder="Enter Room Code (e.g. B2-9481)"
            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-amber-400 font-mono uppercase"
          />
          <button
            id="btn-join-room"
            type="submit"
            disabled={!joinRoomInput.trim() || !playerName.trim()}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-200 text-sm font-bold border border-slate-700 transition cursor-pointer flex items-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            Join
          </button>
        </form>
      </div>

      {/* Rules Summary Badge */}
      <div className="mt-4 text-xs text-slate-400 flex items-center gap-2">
        <Shield className="w-4 h-4 text-emerald-400" />
        <span>Full 52-card deck • ♠ &gt; ♥ &gt; ♣ &gt; ♦ • 2 &gt; A &gt; ... &gt; 3 • 4 Twos Auto-Win</span>
      </div>
    </div>
  );
};
