import React, { useState, useEffect } from 'react';
import { Users, Bot, Play, LogIn, Shuffle, ListOrdered, Palette } from 'lucide-react';
import { RoomConfig, TurnOrderMode } from '../types';
import { useCardTheme } from '../context/CardThemeContext';

interface RoomLobbyProps {
  playerName: string;
  onUpdatePlayer: (name: string) => void;
  onCreateRoom: (config: RoomConfig) => void;
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
  const [turnOrderMode, setTurnOrderMode] = useState<TurnOrderMode>('random');
  const [joinRoomInput, setJoinRoomInput] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
  const [cardInputValue, setCardInputValue] = useState<string>(String(13));

  const { themes, theme, setThemeId } = useCardTheme();

  // Maximum allowed cards per player based on selected player count
  const maxCardsForPlayerCount = Math.floor(52 / playerCount);

  // Sync numeric input when slider changes
  useEffect(() => {
    setCardInputValue(String(cardsPerPlayer));
  }, [cardsPerPlayer]);

  // Adjust cardsPerPlayer when playerCount changes
  const handlePlayerCountChange = (count: number) => {
    setPlayerCount(count);
    const max = Math.floor(52 / count);
    if (cardsPerPlayer > max) {
      setCardsPerPlayer(max);
      setCardInputValue(String(max));
    }
  };

  const handleCardInputChange = (value: string) => {
    setCardInputValue(value);
    const num = parseInt(value, 10);
    if (!isNaN(num) && num >= 3 && num <= maxCardsForPlayerCount) {
      setCardsPerPlayer(num);
    }
  };

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateRoom({
      playerCount,
      cardsPerPlayer: Math.min(cardsPerPlayer, maxCardsForPlayerCount),
      autoFillBots,
      turnOrderMode,
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

        {/* Tab Switcher */}
        <div className="flex w-full rounded-xl bg-slate-800 border border-slate-700 p-1 gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('create')}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition cursor-pointer ${
              activeTab === 'create'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Create Room
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('join')}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition cursor-pointer ${
              activeTab === 'join'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Join Room
          </button>
        </div>

        {/* Create Room Tab */}
        {activeTab === 'create' && (
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
                  <input
                    type="number"
                    min={3}
                    max={maxCardsForPlayerCount}
                    value={cardInputValue}
                    onChange={(e) => handleCardInputChange(e.target.value)}
                    onBlur={() => setCardInputValue(String(cardsPerPlayer))}
                    className="w-16 text-center text-sm font-mono font-bold text-amber-400 bg-slate-900 px-1 py-0.5 rounded border border-slate-700 focus:outline-none focus:border-amber-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
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

            {/* Turn Order Selection */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
              <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
                <ListOrdered className="w-4 h-4 text-amber-400" />
                Turn Order
              </label>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTurnOrderMode('random')}
                  className={`py-3 rounded-xl text-sm font-bold transition cursor-pointer flex items-center justify-center gap-2 ${
                    turnOrderMode === 'random'
                      ? 'bg-amber-500 text-slate-950 shadow-md ring-2 ring-amber-300'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                  title="Lowest card (3♦) leads and turns advance around the table"
                >
                  <Shuffle className="w-4 h-4" />
                  Random
                </button>
                <button
                  type="button"
                  onClick={() => setTurnOrderMode('manual')}
                  className={`py-3 rounded-xl text-sm font-bold transition cursor-pointer flex items-center justify-center gap-2 ${
                    turnOrderMode === 'manual'
                      ? 'bg-amber-500 text-slate-950 shadow-md ring-2 ring-amber-300'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                  title="You pick who plays 1st, 2nd, 3rd and 4th"
                >
                  <ListOrdered className="w-4 h-4" />
                  Manual
                </button>
              </div>

              <p className="text-[11px] text-slate-400">
                {turnOrderMode === 'manual'
                  ? 'You will arrange the 1st → 4th play order in the room before the first hand is dealt.'
                  : 'The player dealt the lowest card (3♦) leads; turns advance around the table.'}
              </p>
            </div>

            {/* Card Style (Theme) Selection */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
              <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
                <Palette className="w-4 h-4 text-amber-400" />
                Card Style
              </label>

              {themes.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {themes.map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setThemeId(t.id)}
                      className={`py-2.5 px-3 rounded-xl text-sm font-bold transition cursor-pointer flex items-center justify-center gap-2 border ${
                        theme?.id === t.id
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 ring-1 ring-amber-400'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      <span className="text-slate-100">♠</span>
                      {t.name}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">Using built-in Classic cards.</p>
              )}
            </div>

            {/* Start Game Action */}
            <button
              id="btn-create-start-game"
              type="submit"
              disabled={!playerName.trim()}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 disabled:hover:from-amber-500 disabled:hover:to-amber-500 text-slate-950 font-black text-base transition shadow-xl shadow-amber-500/20 active:scale-[0.99] disabled:active:scale-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>Launch Game</span>
            </button>
          </form>
        )}

        {/* Join Room Tab */}
        {activeTab === 'join' && (
          <form onSubmit={handleJoin} className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
              <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
                <LogIn className="w-4 h-4 text-amber-400" />
                Enter Room Code
              </label>
              <input
                type="text"
                value={joinRoomInput}
                onChange={(e) => setJoinRoomInput(e.target.value)}
                placeholder="e.g. B2-9481"
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-lg text-slate-100 text-center focus:outline-none focus:border-amber-400 font-mono uppercase tracking-widest placeholder:text-slate-600"
                autoFocus={activeTab === 'join'}
              />
            </div>

            <button
              id="btn-join-room"
              type="submit"
              disabled={!joinRoomInput.trim() || !playerName.trim()}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 disabled:hover:from-amber-500 disabled:hover:to-amber-500 text-slate-950 font-black text-base transition shadow-xl shadow-amber-500/20 active:scale-[0.99] disabled:active:scale-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
            >
              <LogIn className="w-5 h-5" />
              Join Room
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
