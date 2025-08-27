# Chat App Server

## Setup

1. Copy `.env.example` to `.env` and fill values
2. Install dependencies
```bash
cd server
npm install
```
3. Run
```bash
npm run dev
```

## REST API
- POST /auth/register
- POST /auth/login
- GET /users (auth)
- GET /conversations/:id/messages (auth)

## Socket Events
- message:send
- message:new
- typing:start
- typing:stop
- message:read

## Deployment (Render + MongoDB Atlas)
1. Create a free MongoDB Atlas cluster and get a connection string (MONGO_URI)
2. Fork or push this repo to GitHub
3. In the `server/` folder, the Dockerfile and render.yaml are ready
4. On Render:
   - New + → Blueprint → Connect repo
   - Choose `server/render.yaml`
   - Set env vars: `MONGO_URI`, `JWT_SECRET`, optional `CORS_ORIGINS`
   - Deploy
5. After deploy: note the public URL, e.g. `https://chat-app-server.onrender.com`
6. Mobile: set `EXPO_PUBLIC_API_URL` to that URL
```bash
# Web/dev session
cd mobile
EXPO_PUBLIC_API_URL=https://<your-render-url> npm start
```

