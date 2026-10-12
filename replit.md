# AI Sports Coach

AI Sports Coach guides athletes through structured drills and makes movement feedback more accessible, starting with badminton footwork.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/ai-sports-coach/src/App.tsx` — user flow, routes, and coaching UI
- `artifacts/ai-sports-coach/src/index.css` — visual tokens and motion
- `artifacts/api-server/src/routes/coaching.ts` — sport/activity catalog and analysis contract
- `lib/api-spec/openapi.yaml` — source of truth for the generated API client

## Architecture decisions

- The product is universal; badminton footwork is the only live activity in this MVP.
- Analysis results never invent scores: unavailable pose processing returns explicit insufficient-data states.
- The browser stores the latest result locally so uploaded video bytes do not need permanent storage.

## Product

Users can explore supported sports, choose a structured drill, follow smartphone recording guidance, validate a video clip, submit it for analysis, and view an honest result state. Badminton footwork is available now; other sports and activities are clearly marked as coming soon.

## User preferences

No persistent preferences recorded.

## Gotchas

- The analysis endpoint currently accepts clip metadata and clearly reports processing unavailable until the Python pose pipeline is connected.
- Run API codegen after changing `lib/api-spec/openapi.yaml`.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
