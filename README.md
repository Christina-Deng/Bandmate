# BandMate

BandMate is a band rehearsal assistant web app — React frontend, Fastify backend, and PostgreSQL database.

## Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [Docker](https://docs.docker.com/get-docker/) (for PostgreSQL)

## Quick Start

### 1. Database

```bash
docker compose up -d
```

Connection: `localhost:5432`, database `bandmate`, user `bandmate`, password `bandmate`.

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env   # or use existing .env
npx prisma migrate dev
npm run dev
```

API runs at `http://localhost:3000`.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs at `http://localhost:5173`.

## Tests

```bash
cd backend && npm test
```

## Project Structure

- `frontend/` — React + Vite + Tailwind SPA
- `backend/` — Fastify + Prisma API
- `docs/superpowers/` — design spec and implementation plan

## Phase 1 Features

- Register / login
- Create or join a band via invite code
- Skill questionnaire (practice duration + instrument skills → level 1–5)
- Daily practice check-in with optional audio upload
- Team dashboard showing who practiced today
- Song recommendation page (placeholder for Phase 2)
