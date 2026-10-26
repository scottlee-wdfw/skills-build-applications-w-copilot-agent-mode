# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

- Presentation tier decision: Keep React components focused on rendering, loading, empty, and error states. Use the shared API client for every backend request so relative `/api` paths work through Vite locally and in Codespaces.
- Logic tier decision: Keep Express routes thin, validate request IDs and payloads before querying Mongoose, and delegate persistence and aggregation behavior to TypeScript services. Map validation and missing-resource failures to deliberate 4xx responses.
- Data tier decision: Define required Mongoose fields and relationships in the four models, seed representative users, teams, activities, and workouts idempotently, and preserve existing seeded data when rerunning the seed script.
- Activity tracking approach: POST `userId`, `teamId`, `type`, and `minutes`, verify valid IDs and existing references without exposing cast errors, then store references plus computed points and `occurredAt`. List activities as API records without moving presentation concerns into the service layer.
- Team management approach: Validate a non-empty team name, preserve submitted `name` and `mascot`, and store member user references. GET both expose the team data and its resolved members in the contract shape.
- Leaderboard approach: Aggregate activity points by team in the data or service layer, sort descending, attach a 1-based rank, and have the route return only the leaderboard payload.
- Workout suggestions approach: Find the seeded user by email, derive suggestions from recent activities and the user's goal, return the matching first suggestion with a readable reason, and respond with a deliberate 404 when the email is unknown.

## Test plan

Implement the data tier first, then rerun the targeted suites at each boundary so failures remain easy to locate.

1. Run `npm run test:data --prefix octofit-tracker/backend`. Missing required-model fields or seed behavior indicates incomplete data implementation; a passing suite establishes the persistence contract for the API.
2. Run `npm run test:api --prefix octofit-tracker/backend`. Placeholder `501` responses or cast-error failures indicate route validation gaps; empty leaderboard results indicate missing aggregation; wrong workout reasons indicate missing recommendation logic.
3. Run `npm test --prefix octofit-tracker/frontend`. Failures here indicate missing API-driven rendering, loading feedback, empty states, accessible error alerts, or the wrong workout-user request.
4. Run `npm run build --prefix octofit-tracker/backend`. Compilation failures identify TypeScript, Express, or Mongoose types that the runtime contracts did not catch.
5. Run `npm run build --prefix octofit-tracker/frontend`. Build failures identify presentation or shared-client integration problems before the final grading check.
