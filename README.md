# Music Collection Manager – Backend

KV Service Engineering WS 2026/2027, Exercise 1 (Group 3)
Backend with database connection and REST API, built with **NestJS**.

Users manage a personal music collection (single tracks, albums, playlists). Only metadata is stored; tracks are referenced via URL.

## Tech Stack

| Area            | Choice                                   |
| --------------- | ---------------------------------------- |
| Framework       | NestJS (TypeScript)                      |
| ORM             | TypeORM                                  |
| Database        | SQLite (dev), swappable to PostgreSQL    |
| Validation      | class-validator / class-transformer      |
| API docs        | OpenAPI via `@nestjs/swagger`            |

## Getting Started

```bash
cd backend
npm install
npm run start:dev
```

- API: http://localhost:3000
- Swagger UI: http://localhost:3000/api

## Project Structure

```
service-engineering-g3/
├── README.md
└── backend/
    ├── src/
    │   ├── main.ts                  # bootstrap, Swagger setup, global ValidationPipe
    │   ├── app.module.ts            # root module, TypeORM config
    │   ├── common/
    │   │   ├── guards/              # RolesGuard (ADMIN / USER)
    │   │   ├── decorators/          # @Roles(), @CurrentUser()
    │   │   └── filters/             # exception filter for uniform error format
    │   ├── users/                   # minimal user entity + seed data (no registration/login)
    │   │   ├── entities/
    │   │   └── users.module.ts
    │   ├── music-items/             # catalogue of tracks, albums, playlists
    │   │   ├── dto/
    │   │   ├── entities/
    │   │   ├── music-items.controller.ts
    │   │   ├── music-items.service.ts
    │   │   └── music-items.module.ts
    │   ├── collection/              # per-user collection + like/dislike/favourite
    │   │   ├── dto/
    │   │   ├── entities/
    │   │   ├── collection.controller.ts
    │   │   ├── collection.service.ts
    │   │   └── collection.module.ts
    │   ├── comments/                # comments on music items
    │   │   ├── dto/
    │   │   ├── entities/
    │   │   ├── comments.controller.ts
    │   │   ├── comments.service.ts
    │   │   └── comments.module.ts
    │   └── ratings/                 # 1–5 star ratings
    │       ├── dto/
    │       ├── entities/
    │       ├── ratings.controller.ts
    │       ├── ratings.service.ts
    │       └── ratings.module.ts
    ├── test/                        # e2e tests
    ├── package.json
    └── tsconfig.json
```

Each feature folder can be scaffolded with `nest g resource <name>`.

## Data Model

| Entity            | Fields                                                                                         |
| ----------------- | ---------------------------------------------------------------------------------------------- |
| `User`            | `id`, `name`, `role` (`ADMIN` \| `USER`)                                                       |
| `MusicItem`       | `id`, `type` (`TRACK` \| `ALBUM` \| `PLAYLIST`), `title`, `artist`, `url`, `createdAt`         |
| `MusicItemTrack`  | `playlistOrAlbumId`, `trackId`, `position` (self-reference: albums/playlists contain tracks)   |
| `CollectionEntry` | `id`, `userId`, `musicItemId`, `status` (`LIKE` \| `DISLIKE` \| `FAVOURITE` \| `NONE`)         |
| `Comment`         | `id`, `userId`, `musicItemId`, `text`, `createdAt`                                             |
| `Rating`          | `id`, `userId`, `musicItemId`, `stars` (1–5), unique per (`userId`, `musicItemId`)             |

## Roles

Registration and login are out of scope. The current user is identified through request headers:

- `X-User-Id`: id of a seeded user
- `X-User-Role`: `ADMIN` or `USER`

| Role  | Permissions                                                                                  |
| ----- | -------------------------------------------------------------------------------------------- |
| ADMIN | Create, update, delete any music item                                                        |
| USER  | Add music to own collection, set like/dislike/favourite, remove from own list, comment, rate |

## REST Endpoints

| Method | Path                                      | Description                              | Role        |
| ------ | ----------------------------------------- | ---------------------------------------- | ----------- |
| GET    | `/music-items`                            | List all music items                     | any         |
| GET    | `/music-items/{id}`                       | Get one music item                       | any         |
| POST   | `/music-items`                            | Create a music item                      | ADMIN       |
| PUT    | `/music-items/{id}`                       | Update a music item                      | ADMIN       |
| DELETE | `/music-items/{id}`                       | Delete a music item                      | ADMIN       |
| GET    | `/collections`                            | Overview of all users' collections       | any         |
| GET    | `/users/{userId}/collection`              | Collection of one user                   | any         |
| POST   | `/users/{userId}/collection`              | Add a music item to own collection       | USER (own)  |
| PATCH  | `/users/{userId}/collection/{itemId}`     | Set like / dislike / favourite           | USER (own)  |
| DELETE | `/users/{userId}/collection/{itemId}`     | Remove from own collection               | USER (own)  |
| GET    | `/music-items/{id}/comments`              | List comments                            | any         |
| POST   | `/music-items/{id}/comments`              | Add a comment                            | any         |
| PUT    | `/music-items/{id}/ratings`               | Set own 1–5 star rating                  | any         |
| GET    | `/music-items/{id}/ratings`               | Rating summary (average, count)          | any         |

API design follows the Swagger best practices: plural nouns, HTTP verbs for actions, proper status codes (`201`, `204`, `400`, `403`, `404`, `409`), and filtering/pagination via query parameters (e.g. `?type=ALBUM&page=1&limit=20`).

## DTO Examples

```json
// POST /music-items
{
  "type": "ALBUM",
  "title": "Abbey Road",
  "artist": "The Beatles",
  "url": "https://example.com/abbey-road",
  "trackIds": [1, 2, 3]
}

// PATCH /users/1/collection/5
{ "status": "FAVOURITE" }

// PUT /music-items/5/ratings
{ "stars": 4 }

// POST /music-items/5/comments
{ "text": "Great album." }
```

## Team

Group 3 – Service Engineering WS 2026/2027
