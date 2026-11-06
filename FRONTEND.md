# Quest Board — Frontend

React/Vite web app for the Quest Board challenge: a single-screen quest board consuming the backend REST
API from `apps/rest-server`. Built on Taqtile's internal React Web template (design system, tooling
conventions), with the GraphQL/Firebase/auth pieces of that template removed — this app talks to a plain
REST API.

## Stack

- [Vite](https://vite.dev/) — dev server and bundler
- [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/) + `tailwind-variants` — styling
- `src/atomic/` — Taqtile's Atomic Design system (Button, text inputs, Typography, Modal, Grid, Loading...)
- [Vitest](https://vitest.dev/) + Testing Library — unit/component tests
- [Storybook](https://storybook.js.org/) — isolated component development

## Setup

Follow the setup in the root [`README.md`](README.md#how-to-run-the-project): it installs the dependencies
of every app (`bun install` at the repo root) and creates `apps/web/.env` from its sample. That file points
the app at the API:

```bash
# apps/web/.env
VITE_API_URL=http://localhost:3000
```

## Running

```bash
bun run dev                      # from the repo root: starts the API (3000) and the web app (4000) together
bunx nx dev @repo/web            # from the repo root: just the web app, at http://localhost:4000
```

Running the web app alone only makes sense when the API is already running: without it, the board shows a
connection error.

## Testing

```bash
bunx nx test @repo/web           # from the repo root
# or, from apps/web/:
bun run test                     # Vitest
bun run storybook                # isolated component development, http://localhost:6006
```

## Code quality

```bash
bun run typecheck                # tsc -b
```

Lint/format run through the same root-level `oxlint`/`oxfmt` as the backend (`bun run lint` at the repo
root). `src/atomic/` and `.storybook/` are excluded from both — that's Taqtile's own design-system template
code, vendored as-is, not something this project's lint rules should reformat.

## Architecture

Layers under `apps/web/src/`, following Taqtile's internal React Web template conventions — sibling
folders, each with its own path alias:

- **`atomic/`** — the design system: pure, business-rule-free UI components (`atm.*`/`mol.*`/`obj.*`
  prefixes), each with its own `.component.tsx` + `.component.style.tsx` + `.stories.tsx`.
- **`core/http/`** — the REST client (`http-client.ts`, a thin `fetch` wrapper).
- **`domain/model/`** — shared domain types (`quest.model.ts`).
- **`domain/quests/`** — use-case hooks (`use-list-quests.use-case.ts`, `use-create-quest.use-case.ts`)
  that own loading/error state and call the datasource.
- **`data/quests/`** — the quests datasource (`GET /quests`, `POST /quests`) and the zod schema that
  validates the response before it's trusted as a `Quest`.
- **`components/quests/`** — the actual screen: `quest-board.page.tsx`, `quest-card.component.tsx`,
  `create-quest-modal.component.tsx`, presentation helpers (status/difficulty labels, column definitions).

Path aliases (`@atomic`, `@components`, `@core`, `@data`, `@domain`, `@utils`, `@assets`) are configured in
`tsconfig.app.json`/`vite.config.ts` — import through them across folders instead of relative paths.
There's no `@app` alias: the template reserves `src/app` for Expo-Router-style routes, and this app has no
router (a single screen, rendered directly from `App.tsx`).

## Quest board feature

A 3-column kanban board (Pergaminhos Novos / Em Jornada / Lendas Concluídas), one column per real quest
status, with a modal to create new quests. Moving a quest between columns persists its status through
`PATCH /quests/:id`, and quests can be edited from the board through the same endpoint. Difficulty is
chosen when creating a quest (`easy`, `normal` or `high`, defaulting to `normal`); the XP reward is
read-only, derived by the backend from the chosen difficulty. The XP bar reflects the sum of the XP
rewards of resolved quests: every 100 XP is a new level, and the bar shows progress within the current
level.
