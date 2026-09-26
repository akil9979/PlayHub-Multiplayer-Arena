# PlayHub

PlayHub is a real-time multiplayer Tic-Tac-Toe platform built for competitive play.

Create an account, challenge online players, join live rooms, track match history and statistics, and climb the leaderboard through a responsive web experience.

- **Live demo:** [playhub-multiplayer-arena-1.onrender.com](https://playhub-multiplayer-arena-1.onrender.com)
- **Repository:** [github.com/akil9979/Multiplayer-Tic-Tac-Toe](https://github.com/akil9979/Multiplayer-Tic-Tac-Toe)

## Features

- User registration and login
- JWT authentication with HttpOnly cookies
- Real-time multiplayer Tic-Tac-Toe
- Socket.IO gameplay and authenticated connections
- Online player presence
- Player-to-player challenges
- Rematch flow after completed games
- Game history and player profiles
- Player statistics, including wins, losses, draws, and win rate
- Global leaderboard
- Responsive React interface
- Loading, error, skeleton, empty, and socket-status states

## Tech Stack

| Area | Technologies |
| --- | --- |
| Frontend | React, TypeScript, Tailwind CSS, Redux Toolkit, React Router, Axios |
| Backend | Node.js, Express, TypeScript, Socket.IO |
| Database | PostgreSQL / Neon |
| Authentication | JWT, HttpOnly cookies |
| Deployment | Render, Neon |

## Architecture

```text
React frontend
			|
			+-- Axios (HTTP) / Socket.IO (real-time events)
			|
Express + Socket.IO backend
			|
PostgreSQL / Neon
```

The backend keeps responsibilities separated by concern:

- **Routes** map HTTP endpoints to handlers.
- **Middleware** handles authentication and request-level checks.
- **Controllers** validate input and coordinate responses.
- **Models** contain database queries for users, games, history, and statistics.
- **Socket and game managers** coordinate connected users, challenges, rooms, moves, and rematches.

## Project Structure

```text
backend/
	src/
		config/          Database and environment configuration
		controllers/     HTTP request handlers
		games/           Server-authoritative game logic
		middleware/      Authentication middleware
		models/          PostgreSQL queries
		routes/          User and game API routes
		sockets/         Socket.IO setup and events
		types/           Shared backend TypeScript types
		utils/           Validation, room, challenge, and presence helpers
	test_leaderboard.ts
	test_suite.ts

frontend/
	src/
		api/              Axios client
		components/       Reusable UI components
		pages/            Landing, auth, dashboard, game, profile, and leaderboard views
		redux/             Redux Toolkit store and auth slice
		types/             Frontend TypeScript types
		utils/             API error and socket-status helpers
		App.tsx
		Socket.ts
		index.css
	public/
	vite.config.ts
```

## Screenshots

Screenshots are not currently included in the repository. For a complete project presentation, add captures of these states to the repository and reference the actual committed files here:

- Landing page
- Dashboard
- Multiplayer game board
- Online players and challenge flow
- Player profile
- Leaderboard

## Local Setup

### Prerequisites

- Node.js and npm
- PostgreSQL, or a hosted PostgreSQL database such as Neon

### Backend

```bash
cd backend
npm ci
```

Create `backend/.env` from `backend/.env.example`, then set the required values described below. Start the development server with:

```bash
npm run dev
```

The backend listens on port `5000` by default. Its health endpoint is `GET /health`.

### Frontend

In a second terminal:

```bash
cd frontend
npm ci
```

Create `frontend/.env` from `frontend/.env.example`, then start Vite:

```bash
npm run dev
```

The frontend defaults to `http://localhost:5173` and connects to the local backend at `http://localhost:5000`.

### Production checks

```bash
# frontend
npm run build
npm run lint

# backend
npx tsc --noEmit
```

## Environment Variables

### Backend: `backend/.env`

| Variable | Purpose |
| --- | --- |
| `NODE_ENV` | Runtime mode, such as `development` or `production` |
| `PORT` | HTTP server port; Render supplies this in deployment |
| `DATABASE_URL` | PostgreSQL connection string; takes precedence when set |
| `DB_HOST` | Local PostgreSQL host when `DATABASE_URL` is not set |
| `DB_PORT` | Local PostgreSQL port |
| `DB_USER` | Local PostgreSQL user |
| `DB_PASSWORD` | Local PostgreSQL password |
| `DB_NAME` | Local PostgreSQL database name |
| `JWT_SECRET` | Secret used to sign and verify authentication tokens |
| `FRONTEND_URL` | Exact frontend origin allowed to use credentialed requests |

### Frontend: `frontend/.env`

| Variable | Purpose |
| --- | --- |
| `VITE_API_URL` | Backend API base URL, including `/api/v1` |
| `VITE_SOCKET_URL` | Backend origin used by Socket.IO |

Never commit real secrets. Use the committed `.env.example` files as templates.

## Deployment

The production setup uses:

- **Frontend:** Render static web service at [playhub-multiplayer-arena-1.onrender.com](https://playhub-multiplayer-arena-1.onrender.com)
- **Backend:** Render web service at [playhub-multiplayer-arena.onrender.com](https://playhub-multiplayer-arena.onrender.com)
- **Database:** Neon PostgreSQL

Configure the backend with `NODE_ENV`, `PORT`, `DATABASE_URL`, `JWT_SECRET`, and `FRONTEND_URL`. Configure the frontend build with `VITE_API_URL` and `VITE_SOCKET_URL`. Build the frontend after setting its `VITE_` variables because Vite embeds them into the generated client bundle.

Verify the backend deployment with:

```text
GET https://playhub-multiplayer-arena.onrender.com/health
```

The expected response is:

```json
{"status":"ok"}
```

## Roadmap

These are planned improvements, not current features:

- Additional multiplayer games
- Advanced matchmaking
- In-app notifications
- Friends and player-following system
- Redis-backed shared presence for multiple backend instances
- Automated unit, integration, and end-to-end tests
