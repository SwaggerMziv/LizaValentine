# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ValentineSaturn is a personal Valentine's Day web app featuring a multi-stage puzzle game, a trolling fake-error phase, admin approval workflow, and a romantic final card. Built with Next.js (frontend) + FastAPI (backend), orchestrated via Docker Compose.

## Commands

### Docker (full stack)
```bash
docker compose up --build        # Build and run all services
docker compose up -d             # Run detached
docker compose down              # Stop all services
```

### Frontend (from `Frontend/`)
```bash
npm install                      # Install dependencies
npm run dev                      # Dev server on :3000
npm run build                    # Production build (standalone output)
npm run lint                     # ESLint
```

### Backend (from `Backend/`, with venv activated)
```bash
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000   # Dev server
alembic upgrade head                         # Run migrations
alembic revision --autogenerate -m "msg"     # Create migration
```

## Architecture

### Stack
- **Frontend:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Framer Motion, shadcn/ui
- **Backend:** FastAPI, SQLAlchemy 2 (async), asyncpg, Alembic, Pydantic Settings
- **Infrastructure:** Docker Compose → PostgreSQL 16, Nginx reverse proxy, S3-compatible storage

### Backend Layers (`Backend/app/`)
Router (`router.py`) → Service (`service.py`) → Models (`models.py`) + Database (`database.py`)
- `schemas.py` — Pydantic request/response schemas
- `puzzles.py` — Loads puzzle definitions from `puzzle_config.json`
- `s3.py` — Presigned URL generation for photo puzzles
- `config.py` — Pydantic Settings (reads from `.env`)

### Frontend Structure (`Frontend/src/`)
- `app/` — Next.js App Router pages: home, `/puzzle`, `/valentine`, `/admin`, `/expired`
- `components/` — Puzzle type components (`PhotoPuzzle`, `TextPuzzle`, `CaptchaPuzzle`, `Puzzle5`, `FakeError`), `ValentineCard`, `Timer`, `StarfieldBackground`
- `lib/api.ts` — Typed API client for all backend endpoints
- `lib/valentine-text.ts` — Editable Valentine message content
- `hooks/usePuzzle.ts` — Session management hook (fingerprint-based)
- `hooks/useTimer.ts` — Countdown timer logic

### Data Flow
1. Browser generates fingerprint → backend creates session (4h TTL)
2. User progresses through 5 configurable puzzle stages (defined in `Backend/puzzle_config.json`)
3. Answer validation uses fuzzy matching with aliases
4. After stage 5: trolling phase (`FakeError` component with fake system errors)
5. Challenge submission (proof task) → admin approval via `/admin` panel → success card

### Key Data Models
- `Session` — UUID PK, fingerprint (unique), current_stage (0-7), challenge_status, trolling_phase, expires_at
- `AttemptLog` — FK to session, tracks stage/answer/correct per attempt

### Nginx Routing
- `/api/*` → backend:8000
- `/*` → frontend:3000

## Configuration

Environment variables via `.env` (see `.env.example`):
- `DATABASE_URL` — PostgreSQL async connection string
- `S3_ENDPOINT_URL`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_REGION` — S3 storage
- `CORS_ORIGINS` — JSON array of allowed origins
- `ADMIN_PASSWORD` — Admin panel password (default: `saturn-admin`)
- `SESSION_DURATION_HOURS` — Session TTL (default: 4)
- `NEXT_PUBLIC_API_URL` — Frontend API base URL

## Puzzle Customization

All puzzle content (questions, answers, aliases, wrong-attempt messages, success messages, photo keys) is configured in `Backend/puzzle_config.json`. No code changes needed to modify puzzle content.
