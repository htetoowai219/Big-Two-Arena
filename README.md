# Big Two Arena 🃏

Real-time multiplayer **Big Two** (大老二 / Chik Deng) card game with authentic rules, smart AI bot fill for empty seats, drag-and-drop controls, and persistent rooms that survive server restarts.

## Live Demo

🎮 **Play it now:** [https://big-two-arena.onrender.com/](https://big-two-arena.onrender.com/)

Create a room on one device and join it from another by room code (e.g. `B2-9481`) — bots fill the remaining seats automatically.

> Note: the free-tier Render instance sleeps after ~15 minutes of inactivity. If the first load is slow or shows "Not Found", just refresh.

## Features

- **Authentic Big Two rules** — full 52-card deck, correct suit order (♦ < ♣ < ♥ < ♠), rank order (3 < 4 < … < A < 2), and hand rankings.
- **Real-time multiplayer** — rooms of 2–4 players over WebSockets; join friends by room code.
- **AI bot fill** — missing seats are filled by smart bots so you can play solo instantly or with any number of friends.
- **Drag-and-drop** — drag cards to reorder your hand and drop combos onto the table; mobile supports tap-to-select with a stacked two-row layout.
- **Hand guide & history** — built-in rules guide and a play-by-play history of every hand.
- **Customizable games** — choose player count (2–4) and cards dealt per player (3 up to 13).
- **Persistent rooms** — game state is stored in MongoDB with a TTL, so rooms and scores survive server restarts/redeploys.
- **Instant win detection** — dealt all four 2's? Instant victory.
- **Procedural sound effects** — Web Audio API, no audio assets needed.

## Tech Stack

| Layer     | Technology |
|-----------|------------|
| Frontend  | React 19, TypeScript, Vite 6, Tailwind CSS v4, lucide-react, canvas-confetti |
| Backend   | Express 4, `ws` (WebSocket), Mongoose (MongoDB) |
| Tooling   | `tsx` (dev runner), esbuild (server bundle), Vite (client build) |
| Deploy    | Docker, Render (or any container host) |

## Getting Started

### Prerequisites

- Node.js **>= 20**
- MongoDB (local, or a free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster) — *optional*; without it the server runs in-memory only.

### Install & run locally

```bash
# 1. Install dependencies
npm install

# 2. Configure environment (optional — defaults work for local dev)
cp .env.example .env
#    set MONGODB_URI to your connection string if you want persistence

# 3. Start the dev server (Vite + WebSocket backend on the same port)
npm run dev
# → http://localhost:3000
```

### Other scripts

```bash
npm run lint        # type-check the whole project (tsc --noEmit)
npm run build       # build the SPA + bundle the server into dist/
npm start           # run the production server (node dist/server.cjs)
npm run preview     # preview the built SPA
```

## Environment Variables

| Variable          | Default                                  | Description                                             |
|-------------------|------------------------------------------|---------------------------------------------------------|
| `PORT`            | `3000`                                   | HTTP/WebSocket port (Render injects its own).           |
| `NODE_ENV`        | `development`                            | `production` serves the built SPA from `dist/`.         |
| `MONGODB_URI`     | `mongodb://localhost:27017/big-two-arena`| MongoDB connection string (rooms persist here).         |
| `ROOM_TTL_SECONDS`| `86400`                                  | How long an abandoned room lives in the DB before expiry. |

## How to Play

1. Enter your name.
2. **Launch Game** to create a room (bots fill the empty seats) or **join** a friend's room by its `B2-XXXX` code.
3. The player with the lowest card (3♦) starts. Play a single, pair, triple, or a valid five-card combo.
4. Every other player must beat the current hand or pass. Control returns to the last player who played once everyone else passes.
5. Empty your hand first to win the round. Highest-scoring player takes the game.

**Hand rankings** (high to low): Straight Flush > Four of a Kind > Full House > Straight; also Singles, Pairs, Triples. Suits rank ♦ < ♣ < ♥ < ♠; ranks 3 < … < A < 2.

## Architecture

```
server/                    # Node backend
├── index.ts               # entrypoint: Vite/static serving, Mongo connect, listen
├── app.ts                 # Express + HTTP + WebSocketServer assembly
├── config/                # env + mongoose connection
├── models/                # Mongoose schemas (Room)
├── repositories/          # DB access layer (save/load/delete rooms)
├── game/engine.ts         # pure game logic (deal, play, pass, win)
├── services/              # game service + bot turn scheduler
├── sockets/               # WS connection handler + per-room broadcast manager
├── controllers/           # REST handlers
└── routes/                # /api router
src/                       # React client
├── App.tsx                # state, WebSocket client, screens
├── components/            # lobby, hand, table, opponents, history, scoreboard…
├── utils/                 # card logic, bot AI, procedural sounds
└── types.ts               # shared TypeScript types
```

**Protocol** (JSON over WebSocket):

- Client → Server: `PLAYER_JOINED` (create/join a room + room config), `ACTION` (`PLAY_HAND`, `PASS`, `START_GAME`, `RESTART_ROUND`, `UPDATE_SETTINGS`, `REORDER_CARDS`, `LEAVE_ROOM`), `PING`.
- Server → Client: `SYNC_STATE` (full game state broadcast to the room), `ERROR`, `PONG`.

## Deployment

The project ships a Dockerfile, so it runs anywhere that hosts containers (Render, Railway, Fly.io, a VPS…).

### Render (recommended)

1. Push the repo to GitHub.
2. In Render, **New → Web Service** → connect the repo. Render auto-detects the `Dockerfile`.
3. Add environment variables (see table above):
   - `NODE_ENV` = `production`
   - `MONGODB_URI` = your Atlas connection string
4. Deploy. The health check hits `/api/health` and Render auto-deploys on every push.

A `render.yaml` blueprint is included for the Blueprint flow — update the `repo` field first.

### Local Docker build

```bash
docker build -t big-two-arena .
docker run -p 3000:3000 -e NODE_ENV=production -e MONGODB_URI=mongodb://… big-two-arena
```

## License

[MIT](./LICENSE) © 2026 Htet Oo Wai
