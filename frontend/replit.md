# JanMitra – RBI Policy Assistant

## Overview

JanMitra is an AI-powered platform that democratizes financial access by helping Indian citizens understand RBI (Reserve Bank of India) policies in simple language, multiple Indian regional languages, and personalized context based on occupation/category.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite + TailwindCSS (artifact: `janmitra`, preview at `/`)
- **API framework**: Express 5 (artifact: `api-server`, mounted at `/api`)
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **AI**: OpenAI via Replit AI Integrations (`gpt-5.2`)
- **Build**: esbuild (CJS bundle)
- **Charts**: Recharts

## Key Features

1. **Landing Page** (`/`) - Hero, features, how-it-works, fraud alerts
2. **Dashboard** (`/dashboard`) - Policy table, bar/line/pie charts
3. **Chatbot** (`/chatbot`) - AI assistant with voice input, language selector (EN/HI/TA/BN/MR), user type (Farmer/Student/MSME/Salaried)
4. **Settings** (`/settings`) - User preferences
5. **Policy Detail** (`/policies/:id`) - Full policy content

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)

## Database Schema

- `policies` table — RBI circular data (title, date, category, affectedGroup, summary, content, circularNumber, impactLevel)
- `chat_messages` table — Chat history (sessionId, role, content, language, timestamp)

## API Routes

- `GET /api/policies` — List policies (filter by category, affectedGroup, search)
- `GET /api/policies/:id` — Get single policy
- `GET /api/dashboard/summary` — Dashboard summary stats
- `GET /api/dashboard/policies-by-category` — Bar chart data
- `GET /api/dashboard/policies-timeline` — Timeline chart data
- `GET /api/dashboard/sector-impact` — Pie chart data
- `POST /api/chat/message` — Send AI chat message
- `GET /api/chat/history` — Get chat history

## Environment Variables

- `DATABASE_URL` — PostgreSQL connection string
- `AI_INTEGRATIONS_OPENAI_BASE_URL` — Replit AI proxy URL
- `AI_INTEGRATIONS_OPENAI_API_KEY` — Replit AI proxy key

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
