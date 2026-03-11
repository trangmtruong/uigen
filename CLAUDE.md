# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run setup        # Install deps + generate Prisma client + run migrations
npm run dev          # Start dev server with Turbopack (NODE_OPTIONS compat layer)
npm run build        # Production build
npm run test         # Run all tests with Vitest
npx vitest run src/lib/__tests__/file-system.test.ts  # Run a single test file
npm run db:reset     # Force reset Prisma SQLite database
```

## Architecture

UIGen is an AI-powered React component generator. Users describe a component in chat; Claude generates/edits code in a virtual file system; a live preview renders the result.

### Key Data Flow

1. User sends message → `POST /api/chat` (`src/app/api/chat/route.ts`)
2. API streams response from Claude (Haiku 4.5) via Vercel AI SDK
3. Claude uses two tools: `str_replace_editor` and `file_manager` to write/modify files
4. Tool results update the **virtual file system** (in-memory, `src/lib/file-system.ts`)
5. On finish, project state (messages + VFS) is serialized and saved to SQLite via Prisma
6. Frontend renders updated files in Monaco editor and live preview iframe

### Three-Panel UI (`src/app/main-content.tsx`)

- **Left (35%)**: Chat interface — `src/components/chat/`
- **Right (65%)**: Preview iframe OR file tree + Monaco editor — `src/components/preview/`, `src/components/editor/`

### Virtual File System (`src/lib/file-system.ts`)

In-memory tree — no disk writes. Supports CRUD, rename, serialization. State is passed to the API on every request and returned serialized for persistence.

### LLM Provider (`src/lib/provider.ts`)

Uses `claude-haiku-4-5` via `@ai-sdk/anthropic`. Falls back to a `MockLanguageModel` (generates static component templates) when `ANTHROPIC_API_KEY` is not set.

### Authentication

JWT-based sessions stored in cookies. `src/middleware.ts` protects routes. Server actions in `src/actions/` handle sign-up, sign-in, logout. Anonymous users can use the app with limited agentic steps; registered users get project persistence.

### Database

Prisma + SQLite. Two models: `User` and `Project`. Projects store `messages` and `data` (serialized VFS) as JSON blobs. Schema: `prisma/schema.prisma`.

### State Management

- `src/lib/contexts/file-system-context.tsx` — VFS state shared across editor/preview
- `src/lib/contexts/chat-context.tsx` — Chat messages and streaming state

### Path Alias

`@/*` maps to `./src/*` — use this for all internal imports.

## Code Style

Use comments sparingly. Only comment complex code.

## Environment

Copy `.env` and set `ANTHROPIC_API_KEY` for real AI generation. Without it, the mock provider returns static component stubs.
