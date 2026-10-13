# Music Collection Manager – Backend

KV Service Engineering WS 2026/2027, Exercise 1 (Group 3). REST backend built with NestJS.

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

## Structure

```
backend/src/
├── common/          # auth guard (X-User-Id + @Roles), decorators, exception filter, pagination
├── users/           # seeded users (read-only, no login/registration)
├── music-items/     # catalogue: tracks, albums, playlists + track lists
├── collections/     # per-user collection entries (reaction, favourite)
├── comments/
├── ratings/         # 1-5 stars, one per user and item
└── seed/            # demo users and music items
```

## Data Model

| Entity            | Fields                                                                                                                       | Notes                                                                       |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `User`            | `id`, `name`, `role` (`ADMIN` \| `USER`)                                                                                     | Seeded, no user management                                                  |
| `MusicItem`       | `id`, `type` (`TRACK` \| `ALBUM` \| `PLAYLIST`), `title`, `artist?`, `genre?`, `releaseYear?`, `durationSeconds?`, `externalUrl?`, `createdAt`, `updatedAt` | `externalUrl` references the actual track (e.g. Spotify/YouTube link)       |
| `MusicItemTrack`  | `containerId` → `MusicItem`, `trackId` → `MusicItem`, `position`                                                             | Ordered track list of an album/playlist; only `TRACK` items can be entries |
| `CollectionEntry` | `id`, `userId`, `musicItemId`, `reaction` (`NONE` \| `LIKE` \| `DISLIKE`), `favourite` (boolean), `addedAt`                   | Unique per (`userId`, `musicItemId`)                                        |
| `Comment`         | `id`, `userId`, `musicItemId`, `text`, `createdAt`                                                                           |                                                                             |
| `Rating`          | `userId`, `musicItemId`, `stars` (1–5), `updatedAt`                                                                          | Unique per (`userId`, `musicItemId`)                                        |

Rules:

- `reaction` defaults to `NONE`, `favourite` to `false`. `LIKE` + favourite and `NONE` + favourite are allowed; `DISLIKE` + favourite is rejected with `400`.
- Deleting a music item also removes it from all collections, track lists, comments and ratings.

## Identifying the Caller

There is no login. Every request sends `X-User-Id` with the id of a seeded user; the role is read from that user's record (not sent by the client). The only exception is `GET /users`, which is public so a client can show a user selection first.

- Missing or unknown `X-User-Id` → `401`
- Valid user without the required role, or acting on another user's collection → `403`

## Endpoints

All paths are relative to `/api/v1`.

### Music items (catalogue)

| Method | Path                | Role  | Success | Notes                                                                 |
| ------ | ------------------- | ----- | ------- | --------------------------------------------------------------------- |
| GET    | `/music-items`      | any   | 200     | Filters `?type=`, `?search=`; pagination `?page=&limit=`              |
| GET    | `/music-items/{id}` | any   | 200     | Includes the track list (album/playlist) and average rating           |
| POST   | `/music-items`      | ADMIN | 201     | Album/playlist body takes an ordered `trackIds` array                 |
| PUT    | `/music-items/{id}` | ADMIN | 200     | Replaces metadata and track list                                      |
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
| GET    | `/users`      | public | 200     |
| GET    | `/users/{id}` | any  | 200     |

## Conventions

- **DTOs:** separate request DTOs (`CreateMusicItemDto`, `UpdateCollectionEntryDto`, ...) validated with class-validator, and response DTOs so entities are never returned directly.
- **Pagination:** list responses use `{ "data": [...], "meta": { "page": 1, "limit": 20, "total": 57 } }`.
- **Errors:** one format for all errors: `{ "statusCode": 404, "error": "Not Found", "message": "...", "path": "...", "timestamp": "..." }`.
- **Status codes:** `400` validation, `401` no/unknown user, `403` forbidden, `404` not found, `409` conflict.
