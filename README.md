# Music Collection Manager – Backend

KV Service Engineering WS 2026/2027, Exercise 1 (Group 3). REST backend built with NestJS.

## Tech Stack

- NestJS (TypeScript)
- TypeORM + SQLite (swappable to PostgreSQL)
- class-validator for DTO validation
- OpenAPI via `@nestjs/swagger`

## Run

```bash
cd backend
npm install
npm run start:dev
```

Swagger UI: http://localhost:3000/api

## Structure

```
backend/src/
├── common/          # roles guard, decorators, exception filter
├── users/           # minimal user entity (no login/registration)
├── music-items/     # tracks, albums, playlists
├── collection/      # per-user collection, like/dislike/favourite
├── comments/
└── ratings/         # 1-5 stars
```

## Endpoints

| Method | Path                                  | Role        |
| ------ | ------------------------------------- | ----------- |
| GET    | `/music-items`                        | any         |
| POST   | `/music-items`                        | ADMIN       |
| PUT    | `/music-items/{id}`                   | ADMIN       |
| DELETE | `/music-items/{id}`                   | ADMIN       |
| GET    | `/collections`                        | any         |
| GET    | `/users/{userId}/collection`          | any         |
| POST   | `/users/{userId}/collection`          | USER (own)  |
| PATCH  | `/users/{userId}/collection/{itemId}` | USER (own)  |
| DELETE | `/users/{userId}/collection/{itemId}` | USER (own)  |
| POST   | `/music-items/{id}/comments`          | any         |
| PUT    | `/music-items/{id}/ratings`           | any         |

Roles are passed via headers `X-User-Id` and `X-User-Role` (`ADMIN` | `USER`).
