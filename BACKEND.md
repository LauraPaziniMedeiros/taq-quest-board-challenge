# Quest Board — Backend

Elysia REST API for the Quest Board challenge: an Nx monorepo with Bun as runtime, package manager and test
runner.

## Stack

- [Bun](https://bun.com/) — runtime, package manager, test runner
- [Elysia](https://elysiajs.com/) — HTTP framework
- [Drizzle](https://orm.drizzle.team/) — ORM (PostgreSQL)
- [Zod](https://zod.dev/) — request/response validation
- [Nx](https://nx.dev/) — monorepo task orchestration

## Setup

```bash
docker compose up -d --wait                         # start the dev + test Postgres containers
bun install                                         # install dependencies for every app/package
cp .env.sample .env                                 # root env: database URL
cp apps/rest-server/.env.sample apps/rest-server/.env   # API env: port, logs, docs, CORS
bun run migrate                                     # apply migrations to the dev database
bun run migrate:test                                # apply migrations to the test database
```

The `.env` files are not versioned; the `.env.sample` files next to them are the starting point. `loadEnv`
(in `@repo/env`) reads the root file first, then lets the app's own file override it, and validates the
result against the app's Zod schema (`apps/rest-server/src/env/env-schema.ts`). Tests use the versioned
`test.env` files instead.

Run the server:

```bash
bun run dev
```

The API is served under `/api/v1`. With `OPEN_API_SCHEMA_VISIBLE=true` (the default in `.env`/`test.env`),
the OpenAPI docs are at `/api/v1/docs`.

`ERROR_DETAILS_VISIBLE=true` adds field-level `details` to validation (422) and unknown-route (404) errors.
Keep it off outside dev/test. Unexpected (500) errors never expose details in the response: look them up in
the log by the `uuid` the response carries.

`CORS_ORIGINS` is a comma-separated list of the origins allowed to call the API from a browser. It defaults to
`http://localhost:4000`, the web app's dev server.

## Testing

```bash
bun run test                                                        # every workspace
bunx nx test @repo/rest-server                                      # just rest-server
bunx nx test @repo/rest-server -t "should create quest"             # filter by test name
bunx nx test @repo/rest-server src/api/quests/quests.post.test.ts   # a single file
```

Tests run against the `test` Postgres container (`test.env`), truncated between tests (see
`apps/rest-server/test/`: `RequestMaker`, seeds, checkers).

## Code quality

```bash
bun run lint          # oxlint + oxfmt --check
bun run lint:fix      # oxlint --fix + oxfmt
bun run typecheck     # tsc --noEmit across every workspace
bun run packages:check  # dependency-version consistency (syncpack)
```

## Architecture

Clean Architecture, one feature spanning three layers under `apps/rest-server/src/`:

- **`api/`** — Elysia controllers + Zod payload schemas (presentation)
- **`domain/`** — use cases and business rules, plus pure models in `domain/model/` (application)
- **`data/`** — Drizzle datasources, one file per entity (data)

`api/` and `data/` never import from each other — both depend on `domain/`, never the other way around.

## Quests feature

The board's only feature. `GET /quests` (optional `status` filter, paginated), `GET /quests/:id`,
`POST /quests`, `PATCH /quests/:id` and `DELETE /quests/:id` — see
[`apps/rest-server/src/api/quests/`](apps/rest-server/src/api/quests/).

Quests have an optional, nullable `due_date` column. The API exposes it as `dueDate` in the date-only
`YYYY-MM-DD` format. `POST /quests` accepts an omitted or `null` value, and `PATCH /quests/:id` accepts
`null` to clear an existing due date; invalid dates are rejected with `422`.

## Tags feature

Tags are a global catalog managed by `GET /tags`, `POST /tags` and `DELETE /tags/:id` — see
[`apps/rest-server/src/api/tags/`](apps/rest-server/src/api/tags/). A quest references tags through the
`quest_tag` join table, and every quest response includes its `tags` sorted by display name.

```http
POST /api/v1/tags
Content-Type: application/json

{ "name": "Dragão" }
```

Tag display names are stored exactly as entered after trimming. Identity is case-insensitive: the API
stores a normalized name (`trim().normalize('NFC').toLocaleLowerCase('pt-BR')`) with a unique constraint,
so `POST /tags` returns `409` with code `TAG_02` when the normalized name already exists. Tag names are
limited to 30 characters.

Quest create/update payloads accept an optional `tagIds` array (maximum 10 IDs). Invalid or unknown tag
IDs are rejected with `422` and code `QST_02`. Sending `tagIds: []` to `PATCH /quests/:id` clears the
quest's tags; omitting `tagIds` leaves them unchanged. Deleting a tag from the catalog cascades through
`quest_tag`, removing it from every quest.
