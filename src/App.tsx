import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  GameState,
  Player,
  Card,
  PlayedHand,
  WSMessage,
  ClientAction,
} from './types';
import {
  evaluateHand,
  canBeatHand,
  findPlayableCombinations,
  sortCards,
} from './utils/cardUtils';
import { sound } from './utils/soundUtils';
import { RoomLobby } from './components/RoomLobby';
import { GameHeader } from './components/GameHeader';
import { OpponentSeat } from './components/OpponentSeat';
import { TableDropZone } from './components/TableDropZone';
import { PlayerHand } from './components/PlayerHand';
import { RuleGuideModal } from './components/RuleGuideModal';
import { GameScoreboard } from './components/GameScoreboard';
import { EmoteBar } from './components/EmoteBar';

const LOCAL_STORAGE_PLAYER_KEY = 'bigtwo_player_profile';
const LOCAL_STORAGE_GAME_STATE_KEY = 'bigtwo_last_game_state';

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
    return '👑';
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
  const [activeEmotes, setActiveEmotes] = useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // WebSocket reference
  const wsRef = useRef<WebSocket | null>(null);
  const lastTurnPlayerRef = useRef<string | null>(null);

  // Save profile changes
  const handleUpdatePlayer = (name: string, avatar: string) => {
    setPlayerName(name);
    setPlayerAvatar(avatar);
    try {
      localStorage.setItem(LOCAL_STORAGE_PLAYER_KEY, JSON.stringify({ id: myPlayerId, name, avatar }));
    } catch {}
  };

  // Connect / Reconnect to WebSocket
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    let socket: WebSocket | null = null;
    let reconnectTimeout: any = null;

    function connect() {
      try {
        socket = new WebSocket(wsUrl);
        wsRef.current = socket;

        socket.onopen = () => {
          // If we have an existing room, sync back
          if (gameState?.roomId) {
            socket?.send(JSON.stringify({
              type: 'PLAYER_JOINED',
              payload: {
                roomId: gameState.roomId,
                player: {
                  id: myPlayerId,
                  name: playerName,
                  avatar: playerAvatar,
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
              setErrorMessage(data.error);
              setTimeout(() => setErrorMessage(null), 3000);
            }
          } catch (err) {
            console.error('Error handling WS message:', err);
          }
        };

        socket.onclose = () => {
          reconnectTimeout = setTimeout(connect, 2000);
        };

        socket.onerror = () => {
          socket?.close();
        };
      } catch (e) {
        reconnectTimeout = setTimeout(connect, 2000);
      }
    }

    connect();

    return () => {
      if (socket) socket.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [gameState?.roomId, myPlayerId, playerName, playerAvatar]);

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
  const handleCreateRoom = (config: { playerCount: number; cardsPerPlayer: number; autoFillBots: boolean }) => {
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
      wsRef.current.send(JSON.stringify({
        type: 'PLAYER_JOINED',
        payload: {
          roomId: newRoomId,
          player: me,
          roomConfig: config,
        },
      }));

      // Immediately request START_GAME
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
    sound.playCardSelect();
    const updatedPlayers = gameState.players.map(p => {
      if (p.id === myPlayerId) {
        return { ...p, cards: sorted };
      }
      return p;
    });
    setGameState({ ...gameState, players: updatedPlayers });
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
    setGameState(null);
    try {
      localStorage.removeItem(LOCAL_STORAGE_GAME_STATE_KEY);
    } catch {}
  };

  const handleSendEmote = (emote: string) => {
    setActiveEmotes(prev => ({ ...prev, [myPlayerId]: emote }));
    setTimeout(() => {
      setActiveEmotes(prev => {
        const next = { ...prev };
        delete next[myPlayerId];
        return next;
      });
    }, 2500);
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

  // If no active game state or in lobby, show Lobby setup
  if (!gameState || gameState.status === 'lobby') {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
        <GameHeader
          roomId={gameState?.roomId || 'OFFLINE'}
          roundNumber={0}
          onOpenRules={() => setIsRulesModalOpen(true)}
          onLeaveRoom={handleReturnToLobby}
          onRestartRound={() => {}}
          isHost={true}
        />

        <div className="flex-1 flex items-center justify-center py-6 px-3">
          <RoomLobby
            playerName={playerName}
            playerAvatar={playerAvatar}
            onUpdatePlayer={handleUpdatePlayer}
            onCreateRoom={handleCreateRoom}
            onJoinRoom={handleJoinRoom}
            activeRoomId={gameState?.roomId}
            isHost={isHost}
          />
        </div>

        <RuleGuideModal
          isOpen={isRulesModalOpen}
          onClose={() => setIsRulesModalOpen(false)}
        />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between overflow-x-hidden select-none">
      {/* Top Header */}
      <GameHeader
        roomId={gameState.roomId}
        roundNumber={gameState.roundNumber}
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
      <div className="flex-1 w-full max-w-6xl mx-auto px-2 sm:px-4 py-2 flex flex-col justify-between relative">
        {/* Top Opponent Seat (if present) */}
        <div className="w-full flex justify-center py-1">
          {positionedOpponents
            .filter(o => o.position === 'top')
            .map(o => (
              <OpponentSeat
                key={o.player.id}
                player={o.player}
                isCurrentTurn={gameState.currentTurnPlayerId === o.player.id}
                position="top"
                activeEmote={activeEmotes[o.player.id]}
              />
            ))}
        </div>

        {/* Center Arena with Left/Right Opponents & Center Table Dropzone */}
        <div className="w-full flex items-center justify-between gap-2 sm:gap-4 my-auto">
          {/* Left Opponent */}
          <div className="flex flex-col items-center justify-center min-w-[90px] sm:min-w-[120px]">
            {positionedOpponents
              .filter(o => o.position === 'left')
              .map(o => (
                <OpponentSeat
                  key={o.player.id}
                  player={o.player}
                  isCurrentTurn={gameState.currentTurnPlayerId === o.player.id}
                  position="left"
                  activeEmote={activeEmotes[o.player.id]}
                />
              ))}
          </div>

          {/* Center Felt Table Dropzone */}
          <div className="flex-1 flex justify-center">
            <TableDropZone
              lastPlayedHand={gameState.lastPlayedHand}
              currentTurnPlayer={currentTurnPlayer}
              isMyTurn={isMyTurn}
              passCount={gameState.passCount}
              totalPlayers={gameState.players.length}
              selectedCards={selectedCards}
              selectedHandEvaluation={selectedHandEvaluation}
              selectedHandCanBeat={selectedHandCanBeat}
              onDropCards={handleDropCardsOnTable}
              onPlaySelected={handlePlaySelected}
              onPass={handlePass}
              onAutoSort={handleSortCards}
              onShowHint={handleShowHint}
            />
          </div>

          {/* Right Opponent */}
          <div className="flex flex-col items-center justify-center min-w-[90px] sm:min-w-[120px]">
            {positionedOpponents
              .filter(o => o.position === 'right')
              .map(o => (
                <OpponentSeat
                  key={o.player.id}
                  player={o.player}
                  isCurrentTurn={gameState.currentTurnPlayerId === o.player.id}
                  position="right"
                  activeEmote={activeEmotes[o.player.id]}
                />
              ))}
          </div>
        </div>

        {/* Floating Quick Emote Bar */}
        <div className="w-full flex justify-center py-1">
          <EmoteBar onSendEmote={handleSendEmote} />
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
            onCardDragStart={handleCardDragStart}
            onCardDragEnd={handleCardDragEnd}
          />
        )}
      </div>

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
  );
}
