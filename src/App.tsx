import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  GameState,
  Player,
  Card,
  PlayedHand,
  WSMessage,
  ClientAction,
  RoomConfig,
} from './types';
import {
  evaluateHand,
  canBeatHand,
  findPlayableCombinations,
  sortCards,
} from './utils/cardUtils';
import { sound } from './utils/soundUtils';
import { CardThemeProvider } from './context/CardThemeContext';
import { RoomLobby } from './components/RoomLobby';
import { RoomWaitingLobby } from './components/RoomWaitingLobby';
import { GameHeader } from './components/GameHeader';
import { OpponentSeat } from './components/OpponentSeat';
import { TableDropZone } from './components/TableDropZone';
import { PlayerHand } from './components/PlayerHand';
import { RuleGuideModal } from './components/RuleGuideModal';
import { GameScoreboard } from './components/GameScoreboard';
import { GameHistory } from './components/GameHistory';

const LOCAL_STORAGE_PLAYER_KEY = 'bigtwo_player_profile';
const LOCAL_STORAGE_GAME_STATE_KEY = 'bigtwo_last_game_state';

// Avatars are no longer chosen by players; a random one is assigned on first
// launch so players still look distinct at the table.
const AVATARS = ['👑', '🦊', '🐼', '🐯', '🦁', '🦉', '🐲', '🦄', '🤖', '👾'];

export default function App() {
  // Player profile
  const [playerName, setPlayerName] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_PLAYER_KEY);
      if (saved) return JSON.parse(saved).name || 'Player 1';
    } catch {}
    return 'Player 1';
  });

  const [playerAvatar, setPlayerAvatar] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_PLAYER_KEY);
      if (saved) return JSON.parse(saved).avatar || '👑';
    } catch {}
    return AVATARS[Math.floor(Math.random() * AVATARS.length)] || '👑';
  });

  const [myPlayerId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_PLAYER_KEY);
      if (saved && JSON.parse(saved).id) return JSON.parse(saved).id;
    } catch {}
    const newId = `p_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    return newId;
  });

  // Game state
  const [gameState, setGameState] = useState<GameState | null>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_GAME_STATE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });

  // Card interaction state
  const [selectedCardIds, setSelectedCardIds] = useState<Set<string>>(new Set());
  const [hintPlayableCardIds, setHintPlayableCardIds] = useState<Set<string>>(new Set());
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [handSortAscending, setHandSortAscending] = useState(true);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);

  // WebSocket reference
  const wsRef = useRef<WebSocket | null>(null);
  const lastTurnPlayerRef = useRef<string | null>(null);

  // Save profile changes
  const handleUpdatePlayer = (name: string) => {
    setPlayerName(name);
    try {
      localStorage.setItem(LOCAL_STORAGE_PLAYER_KEY, JSON.stringify({ id: myPlayerId, name, avatar: playerAvatar }));
    } catch {}
  };

  // Rejoin info for the WebSocket. Kept in a ref so reconnects always use the
  // latest room/profile instead of a stale closure from an old effect run.
  const rejoinInfoRef = useRef<{ roomId: string; playerId: string; name: string; avatar: string } | null>(null);
  useEffect(() => {
    if (gameState?.roomId) {
      rejoinInfoRef.current = {
        roomId: gameState.roomId,
        playerId: myPlayerId,
        name: playerName,
        avatar: playerAvatar,
      };
    } else {
      rejoinInfoRef.current = null;
    }
  }, [gameState?.roomId, myPlayerId, playerName, playerAvatar]);

  // Connect / Reconnect to WebSocket
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    let socket: WebSocket | null = null;
    let reconnectTimeout: any = null;
    let stopped = false;

    function connect() {
      if (stopped) return;
      try {
        socket = new WebSocket(wsUrl);
        wsRef.current = socket;

        socket.onopen = () => {
          // If we have an existing room, sync back
          const info = rejoinInfoRef.current;
          if (info) {
            socket?.send(JSON.stringify({
              type: 'PLAYER_JOINED',
              payload: {
                roomId: info.roomId,
                player: {
                  id: info.playerId,
                  name: info.name,
                  avatar: info.avatar,
                  isBot: false,
                  cards: [],
                  cardsCount: 0,
                  hasPassed: false,
                  score: 0,
                  connected: true,
                },
              },
            }));
          }
        };

        socket.onmessage = (event) => {
          try {
            const data: WSMessage = JSON.parse(event.data);
            if (data.type === 'SYNC_STATE' && data.payload) {
              const updatedState: GameState = data.payload;
              setGameState(updatedState);
              setIsCreatingRoom(false);
              // Save state after every turn
              try {
                localStorage.setItem(LOCAL_STORAGE_GAME_STATE_KEY, JSON.stringify(updatedState));
              } catch {}

              // Play sounds based on state changes
              if (updatedState.status === 'playing') {
                if (updatedState.currentTurnPlayerId === myPlayerId && lastTurnPlayerRef.current !== myPlayerId) {
                  sound.playTurnChime();
                }
              } else if (updatedState.status === 'round-over') {
                sound.playWinFanfare();
              }

              lastTurnPlayerRef.current = updatedState.currentTurnPlayerId;
            }

            if (data.type === 'ERROR' && data.error) {
              sound.playInvalid();
              setIsCreatingRoom(false);
              setErrorMessage(data.error);
              setTimeout(() => setErrorMessage(null), 3000);

              // The room no longer exists (e.g. server restarted). Drop the stale
              // game state so we cleanly return to the home screen once, instead of
              // glitching between the game and home screens on every reconnect.
              if (data.code === 'ROOM_NOT_FOUND') {
                setGameState(null);
                try {
                  localStorage.removeItem(LOCAL_STORAGE_GAME_STATE_KEY);
                } catch {}
              }
            }
          } catch (err) {
            console.error('Error handling WS message:', err);
          }
        };

        socket.onclose = () => {
          if (!stopped) reconnectTimeout = setTimeout(connect, 2000);
        };

        socket.onerror = () => {
          socket?.close();
        };
      } catch (e) {
        if (!stopped) reconnectTimeout = setTimeout(connect, 2000);
      }
    }

    connect();

    return () => {
      stopped = true;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (socket) {
        // Detach handlers before closing so the close event doesn't schedule
        // a zombie reconnect after this effect has been cleaned up.
        socket.onclose = null;
        socket.close();
      }
    };
  }, [myPlayerId]);

  // Current Player entity
  const myPlayer = useMemo(() => {
    if (!gameState) return null;
    return gameState.players.find(p => p.id === myPlayerId) || null;
  }, [gameState, myPlayerId]);

  const isMyTurn = gameState?.status === 'playing' && gameState.currentTurnPlayerId === myPlayerId;
  const isHost = gameState?.hostId === myPlayerId;

  // Selected Cards objects
  const selectedCards = useMemo(() => {
    if (!myPlayer) return [];
    return myPlayer.cards.filter(c => selectedCardIds.has(c.id));
  }, [myPlayer, selectedCardIds]);

  // Evaluated hand of current selection
  const selectedHandEvaluation = useMemo(() => {
    if (selectedCards.length === 0 || !myPlayer) return null;
    return evaluateHand(selectedCards, myPlayer.id, myPlayer.name);
  }, [selectedCards, myPlayer]);

  // Check if selected hand can beat table
  const selectedHandCanBeat = useMemo(() => {
    if (!selectedHandEvaluation || !gameState) return null;
    return canBeatHand(selectedHandEvaluation, gameState.lastPlayedHand);
  }, [selectedHandEvaluation, gameState?.lastPlayedHand]);

  // Opponent players list
  const opponents = useMemo(() => {
    if (!gameState) return [];
    return gameState.players.filter(p => p.id !== myPlayerId);
  }, [gameState, myPlayerId]);

  // Actions
  const handleCreateRoom = (config: RoomConfig) => {
    const newRoomId = `B2-${Math.floor(1000 + Math.random() * 9000)}`;
    const me: Player = {
      id: myPlayerId,
      name: playerName,
      avatar: playerAvatar,
      isBot: false,
      cards: [],
      cardsCount: 0,
      hasPassed: false,
      score: 0,
      connected: true,
      isHost: true,
    };

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      setIsCreatingRoom(true);
      wsRef.current.send(JSON.stringify({
        type: 'PLAYER_JOINED',
        payload: {
          roomId: newRoomId,
          player: me,
          roomConfig: config,
        },
      }));

      // Rooms that fill seats with AI bots (random turn order) deal the first
      // hand immediately. Rooms created without AI fill, or with a manual turn
      // order, wait in the lobby until the host starts the game.
      if (config.autoFillBots && config.turnOrderMode !== 'manual') {
        setTimeout(() => {
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            const action: ClientAction = {
              type: 'START_GAME',
              roomId: newRoomId,
              playerId: myPlayerId,
            };
            wsRef.current.send(JSON.stringify({ type: 'ACTION', payload: action }));
          }
        }, 300);
      }
    }
  };

  const handleStartGame = () => {
    if (!gameState) return;
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const action: ClientAction = {
        type: 'START_GAME',
        roomId: gameState.roomId,
        playerId: myPlayerId,
      };
      wsRef.current.send(JSON.stringify({ type: 'ACTION', payload: action }));
    }
  };

  const handleSetTurnOrder = (turnOrder: string[]) => {
    if (!gameState) return;
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const action: ClientAction = {
        type: 'SET_TURN_ORDER',
        roomId: gameState.roomId,
        playerId: myPlayerId,
        turnOrder,
      };
      wsRef.current.send(JSON.stringify({ type: 'ACTION', payload: action }));
    }
  };

  const handleJoinRoom = (roomId: string) => {
    const me: Player = {
      id: myPlayerId,
      name: playerName,
      avatar: playerAvatar,
      isBot: false,
      cards: [],
      cardsCount: 0,
      hasPassed: false,
      score: 0,
      connected: true,
    };

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'PLAYER_JOINED',
        payload: {
          roomId,
          player: me,
        },
      }));
    }
  };

  const handleToggleCard = (card: Card) => {
    sound.playCardSelect();
    setSelectedCardIds(prev => {
      const next = new Set(prev);
      if (next.has(card.id)) {
        next.delete(card.id);
      } else {
        // Big Two hands are 1, 2, 3, or 5 cards max
        if (next.size < 5) {
          next.add(card.id);
        }
      }
      return next;
    });
  };

  const handleClearSelection = () => {
    setSelectedCardIds(new Set());
    setHintPlayableCardIds(new Set());
  };

  const handleSortCards = () => {
    if (!myPlayer || !gameState) return;
    const sorted = sortCards(myPlayer.cards);
    const ordered = handSortAscending ? sorted : [...sorted].reverse();
    setHandSortAscending(!handSortAscending);
    sound.playCardSelect();
    const updatedPlayers = gameState.players.map(p => {
      if (p.id === myPlayerId) {
        return { ...p, cards: ordered };
      }
      return p;
    });
    setGameState({ ...gameState, players: updatedPlayers });

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const action: ClientAction = {
        type: 'REORDER_CARDS',
        roomId: gameState.roomId,
        playerId: myPlayerId,
        cards: ordered,
      };
      wsRef.current.send(JSON.stringify({ type: 'ACTION', payload: action }));
    }
  };

  const handlePlaySelected = () => {
    if (!isMyTurn || !selectedHandEvaluation || !selectedHandCanBeat?.canBeat || !gameState) {
      sound.playInvalid();
      return;
    }

    sound.playCardSnap();
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const action: ClientAction = {
        type: 'PLAY_HAND',
        roomId: gameState.roomId,
        playerId: myPlayerId,
        cards: selectedCards,
      };
      wsRef.current.send(JSON.stringify({ type: 'ACTION', payload: action }));
      handleClearSelection();
    }
  };

  const handlePass = () => {
    if (!isMyTurn || !gameState || !gameState.lastPlayedHand) {
      sound.playInvalid();
      return;
    }

    sound.playPass();
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const action: ClientAction = {
        type: 'PASS',
        roomId: gameState.roomId,
        playerId: myPlayerId,
      };
      wsRef.current.send(JSON.stringify({ type: 'ACTION', payload: action }));
      handleClearSelection();
    }
  };

  const handleShowHint = () => {
    if (!myPlayer || !gameState) return;
    const playable = findPlayableCombinations(myPlayer.cards, gameState.lastPlayedHand);
    if (playable.length === 0) {
      sound.playPass();
      setErrorMessage('No playable combinations found. You can pass your turn.');
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }

    sound.playCardSelect();
    // Highlight first best combination or mark all playable card IDs
    const bestCombo = playable[0];
    const cardIdSet = new Set(bestCombo.map(c => c.id));
    setSelectedCardIds(cardIdSet);

    const allPlayableIds = new Set<string>();
    playable.forEach(combo => combo.forEach(c => allPlayableIds.add(c.id)));
    setHintPlayableCardIds(allPlayableIds);
  };

  const handleCardDragStart = (e: React.DragEvent, card: Card) => {
    // If not selected, select it
    if (!selectedCardIds.has(card.id)) {
      setSelectedCardIds(new Set([card.id]));
    }
    e.dataTransfer.setData('text/plain', card.id);
  };

  const handleCardDragEnd = () => {
    // drag cleanup
  };

  const handleDropCardsOnTable = () => {
    if (isMyTurn && selectedHandEvaluation && selectedHandCanBeat?.canBeat) {
      handlePlaySelected();
    } else {
      sound.playInvalid();
      if (!isMyTurn) {
        setErrorMessage('Wait for your turn.');
      } else if (selectedHandCanBeat?.reason) {
        setErrorMessage(selectedHandCanBeat.reason);
      } else {
        setErrorMessage('Select a valid Big Two combination first!');
      }
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  const handleReorderCards = (sourceIndex: number, targetIndex: number) => {
    if (!myPlayer || !gameState) return;
    const newCards = [...myPlayer.cards];
    const [movedCard] = newCards.splice(sourceIndex, 1);
    newCards.splice(targetIndex, 0, movedCard);

    sound.playCardSelect();
    const updatedPlayers = gameState.players.map(p => {
      if (p.id === myPlayerId) {
        return { ...p, cards: newCards };
      }
      return p;
    });
    setGameState({ ...gameState, players: updatedPlayers });

    // Sync card order to server
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const action: ClientAction = {
        type: 'REORDER_CARDS',
        roomId: gameState.roomId,
        playerId: myPlayerId,
        cards: newCards,
      };
      wsRef.current.send(JSON.stringify({ type: 'ACTION', payload: action }));
    }
  };

  const handleNextRound = () => {
    if (!gameState) return;
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const action: ClientAction = {
        type: 'RESTART_ROUND',
        roomId: gameState.roomId,
        playerId: myPlayerId,
      };
      wsRef.current.send(JSON.stringify({ type: 'ACTION', payload: action }));
      handleClearSelection();
    }
  };

  const handleReturnToLobby = () => {
    if (gameState && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const action: ClientAction = {
        type: 'LEAVE_ROOM',
        roomId: gameState.roomId,
        playerId: myPlayerId,
      };
      wsRef.current.send(JSON.stringify({ type: 'ACTION', payload: action }));
    }
    setGameState(null);
    try {
      localStorage.removeItem(LOCAL_STORAGE_GAME_STATE_KEY);
    } catch {}
  };

  // Find opponent positions:
  // 2 players: 1 top
  // 3 players: 1 left, 1 right
  // 4 players: 1 left, 1 top, 1 right
  const positionedOpponents = useMemo(() => {
    if (opponents.length === 1) {
      return [{ player: opponents[0], position: 'top' as const }];
    }
    if (opponents.length === 2) {
      return [
        { player: opponents[0], position: 'left' as const },
        { player: opponents[1], position: 'right' as const },
      ];
    }
    if (opponents.length === 3) {
      return [
        { player: opponents[0], position: 'left' as const },
        { player: opponents[1], position: 'top' as const },
        { player: opponents[2], position: 'right' as const },
      ];
    }
    return [];
  }, [opponents]);

  // Current turn player object
  const currentTurnPlayer = useMemo(() => {
    if (!gameState) return null;
    return gameState.players.find(p => p.id === gameState.currentTurnPlayerId) || null;
  }, [gameState]);

  // If no active game state, show the create/join Lobby setup
  if (!gameState) {
    return (
      <CardThemeProvider>
        <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
          <GameHeader
            roomId="OFFLINE"
            roundNumber={0}
            onOpenRules={() => setIsRulesModalOpen(true)}
            onLeaveRoom={handleReturnToLobby}
            onRestartRound={() => {}}
            isHost={true}
          />

          <div className="flex-1 flex items-center justify-center py-6 px-3">
            {isCreatingRoom ? (
              <div className="text-center text-slate-300 text-sm font-semibold animate-pulse">
                Creating room…
              </div>
            ) : (
              <RoomLobby
                playerName={playerName}
                onUpdatePlayer={handleUpdatePlayer}
                onCreateRoom={handleCreateRoom}
                onJoinRoom={handleJoinRoom}
                activeRoomId={null}
                isHost={false}
              />
            )}
          </div>

          <RuleGuideModal
            isOpen={isRulesModalOpen}
            onClose={() => setIsRulesModalOpen(false)}
          />
        </main>
      </CardThemeProvider>
    );
  }

  // Active room waiting in the lobby (players still joining / manual turn order)
  if (gameState.status === 'lobby') {
    return (
      <CardThemeProvider>
        <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
          <GameHeader
            roomId={gameState.roomId}
            roundNumber={0}
            onOpenRules={() => setIsRulesModalOpen(true)}
            onLeaveRoom={handleReturnToLobby}
            onRestartRound={() => {}}
            isHost={isHost}
          />

          <div className="flex-1 flex items-center justify-center py-6 px-3">
            <RoomWaitingLobby
              gameState={gameState}
              myPlayerId={myPlayerId}
              isHost={isHost}
              onStartGame={handleStartGame}
              onSetTurnOrder={handleSetTurnOrder}
            />
          </div>

          <RuleGuideModal
            isOpen={isRulesModalOpen}
            onClose={() => setIsRulesModalOpen(false)}
          />
        </main>
      </CardThemeProvider>
    );
  }

  return (
    <CardThemeProvider>
      <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between overflow-x-hidden select-none">
      {/* Top Header */}
      <GameHeader
        roomId={gameState.roomId}
        roundNumber={gameState.roundNumber}
        historyCount={gameState.history?.length || 0}
        isHistoryOpen={isHistoryOpen}
        onToggleHistory={() => setIsHistoryOpen(prev => !prev)}
        onOpenRules={() => setIsRulesModalOpen(true)}
        onLeaveRoom={handleReturnToLobby}
        onRestartRound={handleNextRound}
        isHost={isHost}
      />

      {/* Floating Error Toast */}
      {errorMessage && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-rose-900/90 text-rose-100 text-xs sm:text-sm font-semibold rounded-full border border-rose-500/50 shadow-2xl animate-in fade-in slide-in-from-top-4">
          ⚠️ {errorMessage}
        </div>
      )}

      {/* Game Table Arena */}
      <div className="flex-1 w-full max-w-7xl mx-auto px-2 sm:px-4 py-1 sm:py-2 flex flex-col justify-between relative">
        {/* Mobile (3-4 players): all opponents as a compact name+count row; the table gets full width below */}
        {gameState.players.length > 2 && (
          <div className="sm:hidden w-full flex items-center justify-center gap-1.5 py-0.5 flex-wrap">
            {positionedOpponents.map(o => (
              <OpponentSeat
                key={o.player.id}
                player={o.player}
                isCurrentTurn={gameState.currentTurnPlayerId === o.player.id}
                position="top"
                playersCount={gameState.players.length}
                compact
              />
            ))}
          </div>
        )}

        {/* Top Opponent Seat (desktop; or the single opponent in 2-player mode) */}
        <div className={`${gameState.players.length > 2 ? 'hidden sm:flex' : 'flex'} w-full justify-center py-0.5 sm:py-1`}>
          {positionedOpponents
            .filter(o => o.position === 'top')
            .map(o => (
              <OpponentSeat
                key={o.player.id}
                player={o.player}
                isCurrentTurn={gameState.currentTurnPlayerId === o.player.id}
                position="top"
                playersCount={gameState.players.length}
              />
            ))}
        </div>

        {/* Center Arena with Left/Right Opponents and Center Table Dropzone */}
        <div className="w-full flex items-center justify-between gap-1.5 sm:gap-4 my-auto">
          {/* Left Opponent (desktop only; on mobile opponents sit in the top row) */}
          <div className="hidden sm:flex flex-col items-center justify-center min-w-[120px]">
              {positionedOpponents
                .filter(o => o.position === 'left')
                .map(o => (
                  <OpponentSeat
                    key={o.player.id}
                    player={o.player}
                    isCurrentTurn={gameState.currentTurnPlayerId === o.player.id}
                    position="left"
                    playersCount={gameState.players.length}
                  />
                ))}
              </div>

          {/* Center Felt Table Dropzone */}
          <div className="flex-1 flex justify-center max-w-2xl">
            <TableDropZone
              lastPlayedHand={gameState.lastPlayedHand}
              currentTurnPlayer={currentTurnPlayer}
              isMyTurn={isMyTurn}
              selectedCards={selectedCards}
              selectedHandEvaluation={selectedHandEvaluation}
              selectedHandCanBeat={selectedHandCanBeat}
              onDropCards={handleDropCardsOnTable}
              onPlaySelected={handlePlaySelected}
              onPass={handlePass}
              onAutoSort={handleSortCards}
              onShowHint={handleShowHint}
              onToggleHistory={() => setIsHistoryOpen(prev => !prev)}
            />
          </div>

          {/* Right Opponent (desktop only; on mobile opponents sit in the top row) */}
          <div className="hidden sm:flex flex-col items-center justify-center min-w-[120px]">
              {positionedOpponents
                .filter(o => o.position === 'right')
                .map(o => (
                  <OpponentSeat
                    key={o.player.id}
                    player={o.player}
                    isCurrentTurn={gameState.currentTurnPlayerId === o.player.id}
                    position="right"
                    playersCount={gameState.players.length}
                  />
                ))}
              </div>
        </div>

        {/* Bottom: Player's Hand */}
        {myPlayer && (
          <PlayerHand
            player={myPlayer}
            selectedCardIds={selectedCardIds}
            playableCardIds={hintPlayableCardIds}
            isMyTurn={isMyTurn}
            onToggleCard={handleToggleCard}
            onSortCards={handleSortCards}
            onClearSelection={handleClearSelection}
            onReorderCards={handleReorderCards}
            sortAscending={handSortAscending}
          />
        )}
      </div>

      {/* History Overlay */}
      {isHistoryOpen && (
        <div className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3">
          <div
            className="absolute inset-0"
            onClick={() => setIsHistoryOpen(false)}
          />
          <div className="relative w-full max-w-md animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <GameHistory
              history={gameState.history || []}
              onCloseMobile={() => setIsHistoryOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Rules Guide Modal */}
      <RuleGuideModal
        isOpen={isRulesModalOpen}
        onClose={() => setIsRulesModalOpen(false)}
      />

      {/* End of Round Scoreboard Modal */}
      {gameState.status === 'round-over' && (
        <GameScoreboard
          gameState={gameState}
          myPlayerId={myPlayerId}
          isHost={isHost}
          onNextRound={handleNextRound}
          onReturnToLobby={handleReturnToLobby}
        />
      )}
      </main>
    </CardThemeProvider>
  );
}
