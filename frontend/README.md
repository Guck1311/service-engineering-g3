# Music Collection Manager – Frontend

KV Service Engineering WS 2026/2027, Exercise 2 (Group 3). Single Page Application for the NestJS backend, built with Vue 3, TypeScript, Bootstrap 5 and SCSS.

## Run

Start the backend first (`cd backend && npm run start:dev`), then:

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. The Vite dev server forwards `/api` to the backend on port 3000, so no CORS setup is needed. Pick a user in the navbar ("Acting as"): **Admin** maintains the catalogue, **Anna** and **Ben** have personal collections.

```bash
npm run test:unit -- --run   # unit and component tests (Vitest + Vue Test Utils)
npm run lint                 # oxlint + ESLint
npm run build                # type check + production build
```

## Tech Stack

- Vue 3 with `<script setup>` and the Composition API
- TypeScript (`vue-tsc` for `.vue` files)
- Vue Router 5 for routing and role-based navigation guards
- Pinia 4 for global state
- Bootstrap 5.3 (compiled from SCSS) and Bootstrap Icons
- Vite 8, Vitest 4

## Structure

```
src/
├── api/            # HTTP client (fetch wrapper, ApiError) and DTO types
├── services/       # one object per backend resource, e.g. musicItemsService
├── stores/         # Pinia: session (current user), collection, notifications
├── composables/    # useAsync: loading/error/data state for service calls
├── router/         # routes, role guard, page titles
├── views/          # one component per page (route)
├── components/     # reusable UI parts (cards, stars, forms, toasts, ...)
├── styles/         # Bootstrap variable overrides + global SCSS
└── utils/          # formatting helpers
```

## Pages

| Route                   | View                  | Who      | Content                                                     |
| ----------------------- | --------------------- | -------- | ----------------------------------------------------------- |
| `/`                     | `CatalogueView`       | everyone | Catalogue with search, type filter, pagination (in the URL) |
| `/items/:id`            | `MusicItemDetailView` | everyone | Details, track list, own marks, ratings, comments           |
| `/collection`           | `MyCollectionView`    | USER     | Own collection with like/dislike/favourite and filters      |
| `/collections`          | `AllCollectionsView`  | everyone | Collections of all users or one user                        |
| `/admin/items/new`      | `MusicItemEditView`   | ADMIN    | Create a track, album or playlist                           |
| `/admin/items/:id/edit` | `MusicItemEditView`   | ADMIN    | Edit an item and its track list                             |
| anything else           | `NotFoundView`        | everyone | 404 page                                                    |

## How the Exercise 2 Topics Map to the Code

| Topic                          | Where                                                                                                                                                          |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Component model and life cycle | Single-file components with `defineProps`/`defineEmits`/`defineModel`, slots (`MusicItemCard`), `onMounted`/`onBeforeUnmount`, `watch(..., {immediate: true})` |
| State management               | Local `ref`/`computed` in components; Pinia stores for shared state (`stores/`)                                                                                |
| Styling                        | Bootstrap SCSS with overridden variables (`styles/_variables.scss`), scoped `<style lang="scss">` with nesting and `@each` (`MusicTypeBadge`)                  |
| Routing and navigation         | `router/index.ts`: lazy-loaded routes, route params as props, `meta.roles` + `beforeEach` guard, query-string state in `CatalogueView`                         |
| Separating logic from UI       | `services/` for REST calls, `stores/` for shared logic, `composables/useAsync`                                                                                 |
| Communication with the backend | `api/http.ts`: typed `fetch` wrapper, `X-User-Id` header, JSON bodies, Vite proxy                                                                              |
| Error handling                 | `ApiError`, `ErrorAlert` with retry, toasts (`notifications` store), `app.config.errorHandler`, `router.onError`, 404 route                                    |
