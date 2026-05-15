# CodeRoom - Realtime Interview Platform

FastAPI + React project scaffold for a live interview room with chat, collaborative code sync, timer sync, and phased roadmap support.

## Repository Structure

- `backend/` FastAPI, SQLAlchemy, WebSockets
- `frontend/` React (Vite)

## Phase 1 Implemented

- Signup/login (`/auth/register`, `/auth/login`, `/auth/me`)
- Create room (`/rooms/create`)
- Join room by code (`/rooms/join`)
- Fetch room and participants
- Interview session start/end/history
- Realtime WebSocket events:
  - `join_room`
  - `leave_room`
  - `chat_message`
  - `code_update`
  - `timer_start`
  - `timer_pause`
  - `timer_reset`
  - `participant_joined`
  - `participant_left`
- Basic room UI layout:
  - Header (room name, timer, participants, leave)
  - Editor + chat split
  - Output console

## Phase 2 Progress Implemented

- Syntax highlighting editor with Monaco
- Multi-language execution support mapping (`python`, `javascript`, `java`, `cpp`)
- WebSocket `run_code` -> `code_output` event flow
- Live participant presence state (`presence_state`)
- Room expiry enforcement across room/session/WS entry points
- Timer state sync (`timer_state`) with running/paused handling

## Phase 3 Progress Implemented

- Interview feedback API and persistence (`interview_feedback` table)
- Candidate scorecard fields (communication, problem solving, coding, overall)
- Interviewer-only controls for session start/end and feedback submission
- Session end now stores final code snapshot in `code_snapshots`
- Session history now includes:
  - chat count per session window
  - latest code snapshot metadata
  - latest overall score
- Frontend panels:
  - feedback panel (interviewer)
  - scorecard panel
  - interview history panel
  - embedded Metered video/voice panel with backend-issued room token

## Metered Setup

Add these values in `backend/.env`:

- `METERED_DOMAIN=app.metered.live`
- `METERED_SECRET_KEY=...`
- `METERED_EMBED_SDK_URL=https://cdn.metered.ca/sdk/frame/1.4.3/sdk-frame.min.js`

API used by frontend:

- `GET /api/v1/video/rooms/{room_code}/credentials`

## Run Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload
```

## Run Frontend

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

## Open-Source Code Execution

- We use **Judge0** for code execution.
- You can host it yourself or use their API.
- Set `JUDGE0_API_URL` in `backend/.env` (default is `http://localhost:2358`).
- Set `JUDGE0_API_KEY` if required by your hosting environment.
