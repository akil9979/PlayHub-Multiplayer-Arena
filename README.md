# PlayHub

PlayHub is a real-time multiplayer Tic-Tac-Toe application with a React/Vite frontend, Node.js/Express/Socket.IO backend, and PostgreSQL persistence.

## Deployment

Deploy the PostgreSQL database first, then the backend, and finally the frontend. The frontend values must point to the deployed backend before its production build is created.

### Backend environment

Set these variables on the backend service. Do not commit the real values.

```env
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://user:password@host:5432/database
JWT_SECRET=replace_with_a_long_random_secret
FRONTEND_URL=https://your-frontend-domain.example
```

`DATABASE_URL` takes precedence over the local `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME` settings. `FRONTEND_URL` must be the exact browser origin, without a trailing API path.

### Frontend environment

These are public browser configuration values and must use the `VITE_` prefix. Do not put secrets in the frontend environment.

```env
VITE_API_URL=https://your-backend-domain.example/api/v1
VITE_SOCKET_URL=https://your-backend-domain.example
```

### Commands

Backend:

```bash
cd backend
npm ci
npm run build
npm start
```

Frontend:

```bash
cd frontend
npm ci
npm run build
npm run preview
```

A hosting platform can serve the generated `frontend/dist` directory with its static hosting service. The backend start command is `npm start`; it runs `tsx src/index.ts` and listens on `PORT`.

### Health check

Use `GET /health` on the backend service. A healthy server returns:

```json
{"status":"ok"}
```

### Deployment order

1. Create the PostgreSQL database and obtain its `DATABASE_URL`.
2. Configure backend variables, deploy the backend, and verify `/health`.
3. Configure frontend `VITE_API_URL` and `VITE_SOCKET_URL` with the deployed backend URL.
4. Build and publish the frontend.
5. Confirm the backend `FRONTEND_URL` exactly matches the published frontend origin.

Local development continues to use the defaults in the `.env.example` files. Copy those files to `.env` locally and replace the placeholder database and JWT values.
