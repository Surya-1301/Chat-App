# Chat App

A real-time chat application built with React App.

## Features

- 🔐 User authentication (login/register)
- 👥 User management
- 💬 Real-time messaging with Socket.IO
- ✨ Typing indicators
- 📱 Message delivery and read receipts
- 🎨 Modern, responsive UI
- 🔒 Secure token-based authentication
- 📱 Cross-platform mobile app

## Project Structure

```
Chat App/                      # repo root
├── backend/                   # Express API + Socket.IO + Mongoose (server-side)
│   ├── src/
│   ├── routes/
│   ├── models/
│   └── package.json
├── frontend/                  # React web client (Create React App)
│   ├── src/
│   ├── public/
│   └── package.json
├── mobile/                    # legacy Expo/mobile app (kept for history)
├── config/                    # shared config (DB, env, etc.)
├── scripts/                   # utility scripts (cleanup, seeds, etc.)
├── AUTHENTICATION_GUIDE.md
├── REAL_TIME_FEATURES.md
├── NETLIFY_DEPLOY.md
├── DEPLOY.md
├── package.json               # root scripts (dev/start)
└── README.md
```

## Prerequisites

- Node.js (v16 or higher)
- MongoDB database
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator (for iOS development) or Android Studio (for Android development)

## Environment Variables

### Server (.env)
```env
# Chat App (monorepo)

This repository contains a real-time chat application with separate frontend and backend projects.

- frontend/ — React web client (converted from Expo → Create React App)
- backend/  — Node.js + Express API server (Mongoose + Socket.IO)

This README covers running both projects locally, the development convenience script, build/deploy notes, and common troubleshooting steps.

## Quick start (recommended)

From the repository root you can start backend and frontend together:
# Chat App (monorepo)

This repository contains a real-time chat application with separate frontend and backend projects.

The mobile/ folder is kept for history only; the active web client is in `frontend/` (Create React App).

## Quick start (recommended)

From the repository root you can start backend and frontend together:

```bash
# from repo root
npm run dev
```

This runs both services in parallel:
- Backend: `backend` runs with `nodemon` (default port 4000)
- Frontend: `frontend` runs with `react-scripts start` (default port 3000)

Open the frontend in the browser: http://localhost:3000

## Project layout

```
Chat App/
├── backend/            # Express API + Socket.IO + Mongoose
│   ├── src/
│   ├── scripts/
# Chat App (monorepo)

A concise guide for running and deploying the Chat App web project.

Contents
- `frontend/` — React web client (Create React App)
- `backend/` — Express API server (Mongoose + Socket.IO)

Quick start
-----------
Start both services from the repository root:

```bash
# from repo root
npm run dev
```

This runs the backend (nodemon) and the frontend (`react-scripts start`) in parallel.

Project layout
--------------

```
Chat App/
├── backend/   # API server
├── frontend/  # React web client
├── mobile/    # legacy / kept for history (not required for web)
└── package.json (root scripts)
```

Environment
-----------

Backend: create `backend/.env` with:

```properties
PORT=4000
NODE_ENV=development
MONGO_URI=<your-mongodb-connection-string>
JWT_SECRET=<your-jwt-secret>
CORS_ORIGINS=http://localhost:3000
```

Frontend: CRA reads build-time env variables prefixed with `REACT_APP_`. Example:

```
REACT_APP_API_URL=http://localhost:4000
```

Install
-------

Install dependencies at repo root and/or per package:

```bash
npm install
cd frontend && npm install
cd ../backend && npm install
```

Commands
--------

- `npm run dev` (root) — start backend + frontend in parallel
- `cd backend && npm run dev` — start backend only (nodemon)
- `cd frontend && npm start` — start frontend only (CRA dev server)
- `cd frontend && npm run build` — create production build (`frontend/build`)

Deploy (Netlify)
----------------

- Base directory: `frontend`
- Build command: `npm run build`
- Publish directory: `frontend/build`
- Set `REACT_APP_API_URL` in Netlify environment variables to your backend URL
- Configure SPA redirect (if required) by adding `_redirects` in `frontend/public` with:

```
/*  /index.html  200
```

Notes & troubleshooting
-----------------------

- DB connection errors: verify `MONGO_URI` and your Atlas IP whitelist.
- `react-refresh/runtime` dev error: if CRA complains about imports outside `src`, it's a hoisting/monorepo resolution issue. The production `npm run build` is unaffected. Recommended fixes:
    - install `react-refresh` inside `frontend` (avoid hoisting), or
    - make `frontend` an independent project root.
- Ports: frontend uses 3000, backend uses 4000 by default.

Contributing
------------

- Use feature branches and open pull requests against `main`.

License
-------

MIT

---
