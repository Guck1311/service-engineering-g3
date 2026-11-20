# Music Collection Manager

KV Service Engineering WS 2026/2027, Group 3.

- **Exercise 1 - Backend:** REST API built with NestJS (this README).
- **Exercise 2 - Frontend:** Vue.js single page application in [`frontend/`](frontend/), see [Frontend](#frontend) and the documentation in [`docs/exercise-2-frontend.md`](docs/exercise-2-frontend.md).

## Requirements (from the assignment sheet)

- A music item is a single **track**, an **album**, or a **playlist** of arbitrary length. Only metadata is stored; tracks are referenced, not uploaded.
- **Admin** adds, updates and removes music items in the shared collection (the catalogue).
- **User** adds items from the catalogue to their personal collection, marks them like/dislike/favourite, and removes them from their list.
- Overview of the music items of all users and of one user.
- Comments and 5-star ratings on music items.
- Not in scope: registration, login, user management, UI.

## Tech Stack

- NestJS (TypeScript)
- TypeORM + SQLite (swappable to PostgreSQL)
- class-validator / class-transformer for DTO validation
- OpenAPI via `@nestjs/swagger`

## Run

```bash
cd backend
npm install
npm run start:dev
```

- API base path: `http://localhost:3000/api/v1`
- Swagger UI: `http://localhost:3000/api/docs` (click "Authorize" and enter a user id)
- The SQLite database is created as `backend/music.sqlite` (override with `DB_PATH`) and seeded with demo data on first start: users `1` = Admin, `2` = Anna, `3` = Ben. Delete the file to reset.

```bash
npm test          # unit tests
npm run test:e2e  # API tests against an in-memory database
```

If the backend fails to start with `UNIQUE constraint failed: temporary_music_item_track…`, the local database still has an older schema: delete `backend/music.sqlite` and start again.

## Frontend

Vue 3 + Vite + TypeScript, Vue Router, Pinia, Bootstrap 5 (SCSS theme, light/dark mode), axios with types generated from the backend's OpenAPI spec. The full documentation, structured by the presentation topics, is in [`docs/exercise-2-frontend.md`](docs/exercise-2-frontend.md).

```bash
cd backend && npm run start:dev    # the frontend needs the backend on port 3000
cd frontend
npm install
npm run dev                        # http://localhost:5173
```

There is no login: pick the user (Admin, Anna, Ben) in the navbar. Admin pages and buttons appear only for the admin.

| Command | Purpose |
| --- | --- |
| `npm run dev` | dev server with hot module replacement |
| `npm run build` | type check + production build into `dist/` |
| `npm run test:unit` | Vitest (watch mode; `-- --run` for a single run) |
| `npm run lint` / `npm run format` | oxlint + ESLint / Prettier (fixing) |
| `npm run api:types` | regenerate `src/api/schema.d.ts` from the running backend's OpenAPI spec |
| `npm run storybook` | component catalogue on http://localhost:6006: every component and page in every state, on a fake backend (no backend needed) |
| `npm run build-storybook` | static Storybook build into `storybook-static/` |

The backend URL is set in `frontend/.env` (`VITE_API_URL`); override it locally in `frontend/.env.local`.

## Structure

```
backend/src/
├── common/          # auth guard (X-User-Id + @Roles), decorators, exception filter, pagination
├── users/           # seeded users (read-only, no login/registration)
├── music-items/     # catalogue: tracks, albums, playlists
├── collections/     # per-user collection entries (reaction, favourite)
├── comments/
├── ratings/         # 1-5 stars, one per user and item
└── seed/            # demo users and music items
```

## Data Model

| Entity            | Fields                                                                                                                       | Notes                                                                       |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `User`            | `id`, `name`, `role` (`ADMIN` \| `USER`)                                                                                     | Seeded, no user management                                                  |
| `MusicItem`       | `id`, `type` (`TRACK` \| `ALBUM` \| `PLAYLIST`), `title`, `artist?`, `genre?`, `releaseYear?`, `durationSeconds?`, `trackCount?`, `externalUrl?`, `createdAt`, `updatedAt` | `externalUrl` references the actual music (e.g. Spotify/YouTube link); albums and playlists store `trackCount` and their total `durationSeconds` |
| `CollectionEntry` | `id`, `userId`, `musicItemId`, `reaction` (`NONE` \| `LIKE` \| `DISLIKE`), `favourite` (boolean), `addedAt`                   | Unique per (`userId`, `musicItemId`)                                        |
| `Comment`         | `id`, `userId`, `musicItemId`, `text`, `createdAt`                                                                           |                                                                             |
| `Rating`          | `userId`, `musicItemId`, `stars` (1-5), `updatedAt`                                                                          | Unique per (`userId`, `musicItemId`)                                        |

Rules:

- `reaction` defaults to `NONE`, `favourite` to `false`. `LIKE` + favourite and `NONE` + favourite are allowed; `DISLIKE` + favourite is rejected with `400`.
- Deleting a music item also removes it from all collections, comments and ratings.
- Albums and playlists do not link to individual tracks; the tracks themselves are only referenced via `externalUrl`.

## Identifying the Caller

There is no login. Every request sends `X-User-Id` with the id of a seeded user; the role is read from that user's record (not sent by the client).

- Missing or unknown `X-User-Id` → `401`
- Valid user without the required role, or acting on another user's collection → `403`

## Endpoints

All paths are relative to `/api/v1`.

### Music items (catalogue)

| Method | Path                | Role  | Success | Notes                                                                 |
| ------ | ------------------- | ----- | ------- | --------------------------------------------------------------------- |
| GET    | `/music-items`      | any   | 200     | Filters `?type=`, `?search=`; pagination `?page=&limit=`              |
| GET    | `/music-items/{id}` | any   | 200     | Includes the average rating and number of ratings                     |
| POST   | `/music-items`      | ADMIN | 201     | Albums/playlists may set `trackCount` and total `durationSeconds`     |
| PUT    | `/music-items/{id}` | ADMIN | 200     | Replaces the metadata; the type cannot change                         |
| DELETE | `/music-items/{id}` | ADMIN | 204     |                                                                       |

### Collections

| Method | Path                                  | Role       | Success | Notes                                                   |
| ------ | ------------------------------------- | ---------- | ------- | ------------------------------------------------------- |
| GET    | `/collections`                        | any        | 200     | Collections of all users; paginated                     |
| GET    | `/users/{userId}/collection`          | any        | 200     | Filters `?reaction=`, `?favourite=`; paginated          |
| POST   | `/users/{userId}/collection`          | USER (own) | 201     | Body `{ "musicItemId": 1 }`; `409` if already added     |
| PATCH  | `/users/{userId}/collection/{itemId}` | USER (own) | 200     | Body `{ "reaction": "LIKE", "favourite": true }`, both optional |
| DELETE | `/users/{userId}/collection/{itemId}` | USER (own) | 204     |                                                         |

### Comments and ratings

| Method | Path                                  | Role      | Success   | Notes                                       |
| ------ | ------------------------------------- | --------- | --------- | ------------------------------------------- |
| GET    | `/music-items/{id}/comments`          | any       | 200       | Paginated, newest first                     |
| POST   | `/music-items/{id}/comments`          | any       | 201       | Body `{ "text": "..." }`                    |
| GET    | `/music-items/{id}/ratings`           | any       | 200       | `{ average, count, ratings[] }`             |
| PUT    | `/music-items/{id}/ratings/{userId}`  | any (own) | 200 / 201 | Body `{ "stars": 4 }`; creates or replaces  |

### Users (read-only)

| Method | Path          | Role | Success |
| ------ | ------------- | ---- | ------- |
| GET    | `/users`      | any  | 200     |
| GET    | `/users/{id}` | any  | 200     |

## Conventions

- **DTOs:** separate request DTOs (`CreateMusicItemDto`, `UpdateCollectionEntryDto`, ...) validated with class-validator, and response DTOs so entities are never returned directly.
- **Pagination:** list responses use `{ "data": [...], "meta": { "page": 1, "limit": 20, "total": 57 } }`.
- **Errors:** one format for all errors: `{ "statusCode": 404, "error": "Not Found", "message": "...", "path": "...", "timestamp": "..." }`.
- **Status codes:** `400` validation, `401` no/unknown user, `403` forbidden, `404` not found, `409` conflict.

## Deployment

Every push to `master` updates the live app:

- **Backend → Render**, configured in [`render.yaml`](render.yaml). The free plan sleeps when idle (the first request then takes ~30 s), and the SQLite database is reset to the demo data on every deploy.
- **Frontend → GitHub Pages**, built by [`.github/workflows/deploy-frontend.yml`](.github/workflows/deploy-frontend.yml) against the backend URL in the repository variable `API_URL`. It can also be started manually in the Actions tab. The Storybook is published next to the app under `/storybook/`.

One-time setup:

1. **Render:** New → Blueprint → select this repository. Render reads `render.yaml` and creates `music-collection-backend`. Note its URL, e.g. `https://music-collection-backend.onrender.com`.
2. **Repository variable:** Settings → Secrets and variables → Actions → Variables → `API_URL` = `<Render URL>/api/v1`.
3. **GitHub Pages:** Settings → Pages → Source: **GitHub Actions**.

The app is then at `https://<owner>.github.io/<repository>/`.
