# Titus-Sec

An LLM-assisted pentesting agent with a human-in-the-loop approval workflow.

## Architecture

- **backend/** — FastAPI service exposing tool discovery, task request/approval, and a WebSocket event stream. Talks to an LLM (Gemini or OpenAI, auto-detected from the API key format) to help plan actions.
- **plugins/** — Pluggable security tools (currently `nmap` for network scanning and `gobuster` for web directory enumeration), discovered dynamically via `pluggy`. Every plugin only *prepares* a command; nothing runs without explicit approval.
- **frontend/** — React + Tauri desktop UI with an embedded terminal (`XTermPanel`) for reviewing and approving tool runs.

## Getting started

```bash
cp .env.example .env   # fill in your own LLM_API_KEY, never commit .env
make install
make dev
```

## Safety model

- Every plugin returns a command + risk description instead of executing anything directly.
- Execution requires an explicit `/api/task/approve` call.
- Secrets (API keys) are loaded from `.env` only — see `.env.example` for the expected shape. `.env` is git-ignored and must never be committed.
