# Big Two Arena — Project Spec & Progress Tracker

## Overview

Big Two Arena is a real-time multiplayer **Big Two** (Chik Deng / 大老二) card game. It supports
online play between humans plus AI-bot fill for missing seats, authentic hand rankings, drag-and-drop
interaction, a full rules guide, play history, emotes, procedural sound effects, and persistent room
state.

Built as a Google AI Studio applet (see `metadata.json`) with a single-process Node server that serves
the Vite SPA and runs the WebSocket game server.

---

## Tech Stack

| Layer     | Technology |
|-----------|------------|
| Frontend  | React 19, TypeScript, Vite 6, Tailwind CSS v4, lucide-react, canvas-confetti |
| Server    | Express 4, `ws` (WebSocket), `tsx` (dev runner), esbuild (prod bundle) |
| State     | Client: React hooks + `localStorage`. Server: in-memory `Map` room store |
| Build     | `npm run build` → `vite build` + bundled `dist/server.cjs` |
| Anim/Sfx | Web Audio API (procedural, no audio assets), CSS/Tailwind transitions |

`motion` is listed in `package.json` but is **not imported anywhere** (dead dependency — see Known Issues).

---

## Architecture

### Server (`server.ts`)
- Express app + `ws` WebSocket server on `PORT = 3000`, serves Vite middleware in dev, static `dist/`
  in production, SPA fallback `app.get('*')`.
- **In-memory stores:** `rooms: Map<roomId, GameState>`, `clients: Map<ws, {roomId, playerId}>`,
  `botTimeouts: Map<roomId, timeout>`.
- **Message protocol:** JSON over WS.
  - Client → Server: `PLAYER_JOINED` (create/join room + room config), `ACTION`
    (`PLAY_HAND`, `PASS`, `START_GAME`, `RESTART_ROUND`, `UPDATE_SETTINGS`, `REORDER_CARDS`,
    `LEAVE_ROOM`), `PING`.
  - Server → Client: `SYNC_STATE` (full `GameState` broadcast to room), `ERROR`, `PONG`.
- **Bot turn driver:** `scheduleBotTurn()` sets a 750 ms timer; on fire it runs `decideBotMove()` and
  plays/passes for the bot, then broadcasts.
- **REST endpoints:** `GET /api/health`, `GET /api/rooms/:roomId`.
- No persistence to disk — rooms live only in memory (server restart wipes all rooms).

### Game flow
1. Host creates room (code `B2-XXXX`), bots auto-fill to the chosen player count.
2. `START_GAME`/`RESTART_ROUND` → `initializeNewGame()`:
   - Shuffle full 52-card deck, deal `cardsPerPlayer` per player, sort each hand.
   - Check **4-Twos instant win** (only if the player holds ≥ 4 cards).
   - Starting player = lowest total card (`3♦`), stored as `currentTurnPlayerId` / `leadPlayerId`.
   - Increments `roundNumber`.
3. Turn loop: `handlePlayHand()` validates ownership → `evaluateHand()` → `canBeatHand()` → remove
    cards → record to `history` → advance. `handlePass()` records a pass entry to `history` and tracks
    `passCount`; when every other player passes, control returns to `lastPlayedPlayerId` and the table is
    cleared (fresh trick).
4. Round ends when a player empties their hand (`status: 'round-over'`) or on 4-Twos instant win.
   Scoring: winner +20; each other player loses `remainingCards * (≥10 ? 2 : 1)` (floor 0); instant
   win gives +50.

### Scoring
- Winner: `+20`.
- Losers: `-cardsLeft`, doubled if `cardsLeft >= 10` (min 0).
- 4-Twos instant win: `+50` (no penalty to others).

---

## Game Rules (as implemented)

- **Deck:** 52 cards, ranks `3 < 4 < … < K < A < 2`. Suits (low→high): `♦ < ♣ < ♥ < ♠`.
  Card `totalRank = rankValue*4 + suitValue` (so `3♦` = 12, `2♠` = 63).
- **Hands:** single, pair, triple, and 5-card combos. 5-card combo hierarchy (high→low):
  straight flush > four-of-a-kind > full house > straight.
- **Beating:** same size + same category; 5-card combos compare combo tier first, then rank value.
  Wrap-around straights `A-2-3-4-5`, `2-3-4-5-6`, `Q-K-A-2-3` are **accepted** (variant rules —
  see Known Issues #K5).
- **Passing/Control:** a player leading the trick cannot pass; when all others pass the last player
  regains control with a fresh table.
- **Instant win:** being dealt all four 2s wins the round immediately.
- **Custom variants:** 2–4 players, 3–13 cards per player (configurable in lobby).

---

## Project Structure

```
server.ts                          # Express + WS game server, room/game logic
src/
  App.tsx                          # Root component: WS client, game orchestration, layout
  main.tsx                         # React entry
  types.ts                         # Card, Player, GameState, WSMessage, ClientAction…
  index.css                        # Tailwind v4 import only
  utils/
    cardUtils.ts                   # Deck, sort, hand evaluation, canBeat, playable combos
    botAi.ts                       # decideBotMove() bot strategy
    soundUtils.ts                  # Procedural Web Audio SFX engine
  components/
    RoomLobby.tsx                  # Profile editor, create/join room, game config
    GameHeader.tsx                 # Brand, room code, round badge, mute/rules/history/leave
    OpponentSeat.tsx               # Opponent card stack, score, connected/passed badges
    TableDropZone.tsx              # Center felt, active hand display, Play/Pass/Hint bar
    PlayerHand.tsx                 # My hand: select, drag-reorder, sort, clear
    PlayingCard.tsx                # Rendered card (front/back, sizes sm/md/lg)
    RuleGuideModal.tsx             # Rules & rankings modal
    GameScoreboard.tsx             # Round-end standings + confetti + Next Round
    GameHistory.tsx                # Play history overlay panel
```

---

## Feature Status

| Feature | Status | Notes |
|---|---|---|
| Real-time multiplayer rooms (WS) | ✅ Done | Join via room code, replace bot slots |
| AI bot fill (autoFillBots) | ✅ Done | Bot names Kai/Mei/Leo |
| Bot AI strategy | ✅ Done | Cheap-winner logic, saves 2s, emergency aggression |
| Hand evaluation & rankings | ✅ Done | singles/pairs/triples/straight/full house/4oak/straight flush |
| Pass / trick control | ✅ Done | |
| 4-Twos instant win | ✅ Done | +50 pts |
| Custom player count & cards-per-player | ✅ Done | 2–4 players, 3–13 cards |
| Scoring + round-end scoreboard | ✅ Done | +20 / penalties / confetti |
| Card selection, hint, auto-sort | ✅ Done | Sort button toggles ascending (3 → 2, smallest left) / descending (2 → 3, biggest left) |
| Drag to reorder hand | ✅ Done | `REORDER_CARDS` synced to server |
| Drag to play on table | ❌ Broken | Drop handler never wired (see #K1) |
| Emotes | ❌ Removed | EmoteBar removed; emote bubble in OpponentSeat removed |
| Play history panel | ✅ Done | Centered overlay modal on all screens + X close button; records plays and passes (`<name> passed`), header counts plays only |
| Sound effects (Web Audio) | ✅ Done | Card select/snap, pass, invalid, turn chime, win fanfare |
| Rules guide modal | ✅ Done | |
| Lobby / profile persistence (localStorage) | ✅ Done | |
| Game-state persistence | ⚠️ Partial | Client localStorage only; server rooms are in-memory |
| Restart round / next round | ✅ Done | |
| Leave room / disconnect handling | ✅ Done | Marks disconnected; room deleted when no humans remain |
| Stale-room reconnect handling | ✅ Done | Server returns `ROOM_NOT_FOUND`; client clears stale state (see fix below) |
| `ADD_BOT` / `KICK_BOT` actions | ❌ Stub | In type union but no server handling |
| `game-over` overall match state | ❌ Stub | Type exists, never reached (no match threshold) |

---

## Known Issues & Bugs

### Functionality
- **K1 — Drag-and-drop onto the table does not work.** `App.tsx` passes `onDropCards={handleDropCardsOnTable}` to `TableDropZone`, but the component never declares that prop and has no `onDrop`/`onDragOver` handlers on the felt. Dropping cards on the table does nothing. `handleDropCardsOnTable` is effectively dead code.
- **K2 — Game can stall on a disconnected human.** If a human disconnects mid-round (or their tab closes), no bot takeover / auto-pass exists. Bots keep playing only while the turn belongs to them; a missing human's turn blocks the game forever.
- **K3 — (Resolved) Emotes were local-only and have been removed entirely.** The EmoteBar component and the emote bubble in `OpponentSeat` were deleted. The `EmoteBar.tsx` file no longer exists.
- **K4 — Joining mid-round as a replacement resets score.** When a human joins an existing room and replaces a bot slot (`server.ts:346-354`), the human inherits the bot's cards but `score` is reset to 0, losing accumulated round points.
- **K5 — (Resolved) Non-standard wrap-around straights accepted.** Previously `getStraightTopCard` allowed `A-2-3-4-5`, `2-3-4-5-6`, and `Q-K-A-2-3`. Straights are now strictly consecutive in rank order, running from `3-4-5-6-7` up to `J-Q-K-A-2`; the lowest (3) and highest (2) cards can only be the start/end of a straight, never mid-sequence, so all wrap-around variants are rejected.
- **K6 — No overall match ("game over") flow.** `GameStatus` includes `'game-over'` but no code path ever reaches it; rounds can be restarted indefinitely with no final winner / target score.
- **K7 — `ADD_BOT` / `KICK_BOT` unimplemented.** Declared in `ClientAction` (`types.ts:70`) but never handled in `server.ts`.
- **K8 — Host change on leave is not handled.** If the host leaves, no other player is promoted to host, so lobby settings and round restart become unavailable to the remaining humans.
- **K9 — Race on room creation + start.** `handleCreateRoom` (`App.tsx:235`) sends `START_GAME` after a hard-coded 300 ms `setTimeout`, relying on the server having processed `PLAYER_JOINED`. Under load/slow WS this can fail to start the game.

### Robustness / Hygiene
- **K10 — In-memory only; no room TTL.** A server restart destroys every room; a room whose humans all disconnected (but never sent `LEAVE_ROOM`) persists forever with no cleanup.
- **K11 — Collision-prone bot IDs.** `UPDATE_SETTINGS` regenerates bots as `bot_1/2/3` (`server.ts:397`) while `PLAYER_JOINED`/`START_GAME` use `bot_<ts>_<n>`. Repeated settings changes can create duplicate IDs.
- **K12 — `REORDER_CARDS` is unvalidated / non-broadcast.** Any client can send any `cards` array; the server stores it silently. A reconnecting player's hand order is whatever the last client sent.
- **K13 — Stale branding.** `package.json` name is `react-example`; `index.html` still titles the app "My Google AI Studio App" with the default AI Studio description/og tags.
- **K14 — Dead code / deps.** `motion` is in `package.json` but unused; `sound.playDealSound()` (`soundUtils.ts:161`) is never called.
- **K15 — Lint script requires installs.** `npm run lint` (`tsc --noEmit`) currently fails with `Cannot find module 'react'` etc. only because `node_modules` is not installed in this checkout — not a source-code error. Run `bun install` / `npm install` first.
- **K16 — Room-code space is small.** Codes are `B2-` + 4 random digits (9 000 possible) with no uniqueness check; collisions are possible.
- **K17 — Winner fanfare plays for everyone.** `App.tsx` plays the win fanfare on *any* `round-over`, including when a bot/opponent wins, and the sound volume is not adjustable (only mute).
- **K18 — Stale local state on load.** If `localStorage` holds an old `GameState` for a room that no longer exists server-side, reconnect silently re-creates a brand-new default-config room with that same id, which can confuse users.

---

## Progress / Milestones

- [x] **M1 — Core playable game** — deck, dealing, hand evaluation, turn rotation, play/pass, round over + scoreboard (initial commits `dff47a7`, `a5f6f00`).
- [x] **M2 — Polish pass** — history panel, drag-reorder hand, leave-room handling, header actions, lobby config refinements (commit `a1addff`).
- [x] **M3a — Reconnect / screen-glitch fix + mobile + history UX** (session 2026-08-16):
  - Server no longer silently recreates a room on `PLAYER_JOINED` without `roomConfig`; returns `ROOM_NOT_FOUND` instead. `ROOM_FULL` error added for full rooms.
  - Client WebSocket effect rewritten (rejoin info in a ref, zombie-reconnect timers prevented); on `ROOM_NOT_FOUND` it clears stale state once and returns to the home screen with a toast — no more bouncing between game and home screens mid-game (caused by `tsx` restarts wiping in-memory rooms during dev).
  - History log is a centered overlay modal on all screen sizes, always with an X close button; toggled from the header or the table on smaller screens.
  - Mobile fixes: header fits 320px screens (wordmark hides <400px, Redeal button desktop-only, tighter padding), narrower opponent columns; in 3–4 player games all opponents move into a compact name + card-count row at the top and the table takes full width (the classic left/top/right seats are desktop-only), while 2-player keeps the top opponent's card-back fan on phones.
  - EmoteBar removed.
- [ ] **M3 — Remaining polish** — table drop-to-play, disconnect takeover, multiplayer emotes, host promotion.
- [ ] **M4 — Match flow** — overall `game-over` win condition / target score, room TTL cleanup, `ADD_BOT`/`KICK_BOT`.
- [ ] **M5 — Hardening** — stable bot ids, room-code uniqueness, reorder validation, brand cleanup.

---

## Dev Commands

```bash
bun install          # install deps (node_modules currently absent in this checkout)
npm run dev          # dev server (tsx server.ts) → http://localhost:3000
npm run lint         # tsc --noEmit (needs installs first)
npm run build        # vite build + bundle server → dist/
npm run start        # node dist/server.cjs (production)
```
