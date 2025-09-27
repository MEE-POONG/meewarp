# Repository Guidelines

## Project Structure & Module Organization
- `server/` hosts the Express API. Place models in `server/models/`, routes in `server/routes/`, middleware in `server/middlewares/`, config under `server/config/`, and shared services (payments, leaderboard, logging) inside `server/services/`.
- Write integration tests in `server/tests/` with Jest + Supertest, mirroring the route or service they cover.
- `client/` contains the Vite + React app. Keep reusable UI in `client/src/components/`, pages under `client/src/pages/`, global settings in `client/src/config.ts`, and component tests in `client/src/components/__tests__/`. Test utilities belong in `client/src/test/`.
- CI workflows live in `.github/workflows/`; keep server and client checks green before merging.

## Build, Test, and Development Commands
- `cd server && npm start` – run the API against local `.env` values.
- `cd server && npm test` – execute Jest + Supertest integration tests via MongoDB Memory Server.
- `cd client && npm run dev` – start the Vite dev server with the `/api` proxy.
- `cd client && npm run test:run` – run the Vitest suite once in CI mode.

## Coding Style & Naming Conventions
- Use TypeScript/JavaScript with 2-space indentation and camelCase variables. Name Mongoose models in PascalCase.
- React components live in PascalCase files (`AdminForm.tsx`) and Tailwind classes should follow layout → color → interaction order.
- Follow existing ESLint/Prettier settings; run the appropriate formatter before committing.

## Testing Guidelines
- Backend tests live in `server/tests/*.test.js`; ensure they cover routes, auth flows, and service integrations.
- Frontend tests belong in `client/src/components/__tests__/*.test.tsx` using Vitest.
- Keep coverage meaningful for new logic; run `npm test` or `npm run test:run` before submitting changes.

## Commit & Pull Request Guidelines
- Write imperative commit messages (e.g., “Add warp transaction schema”) and reference tickets when available.
- PRs should outline scope, note config or migration updates, prove test runs, and attach UI screenshots or GIFs for visual changes.

## Security & Configuration Tips
- Never commit real `.env` files; update `.env.example` when configuration changes.
- Rotate `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `ADMIN_JWT_SECRET` before releases and extend auth plus rate limiting for new routes or sockets.
