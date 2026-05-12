# PVM URL

Controlled URL redirection system for PVM print, QR, product packaging, event, and promotion links.

The app serves public redirects such as `https://go.pvm.co.za/<code>` and an authenticated admin console under `/admin` on `admin.pvm.co.za`. It is built with Next.js App Router, Prisma/Postgres, Clerk, and Vercel.

Vercel domain assignment and DNS control which hostnames expose the deployment today. `PUBLIC_REDIRECT_HOST` and `ADMIN_HOST` are parsed config metadata values, not host-enforcement controls; admin protection is path-based through Clerk/proxy on `/admin`.

## Development

```powershell
npm install
copy .env.example .env
npm run prisma:generate
npm run dev
```

Use a different local port if `3000` is already occupied:

```powershell
npm run dev -- -p 3003
```

Set real values in `.env` before running database-backed routes or admin pages. The app needs a real Postgres `DATABASE_URL`, Clerk keys, `ADMIN_EMAILS`, `DEFAULT_FALLBACK_URL`, host settings, and `IP_HASH_SALT`.

## Commands

```powershell
npm run dev
npm run build
npm run start
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run prisma:generate
npm run prisma:migrate
npm run prisma:deploy
```

`npm run start` serves the production build and requires `npm run build` first.

## Checks

Run these before shipping:

```powershell
npm run typecheck
npm run test
npm run build
npm run lint
npm audit --omit=dev
npx playwright test --list
```

`npm run test:e2e` currently runs an auth smoke test only; it does not cover the full redirect creation, editing, and public redirect workflow. It starts the Next.js dev server from `playwright.config.ts` and expects the configured local app to work. It may be blocked locally if port `3000` is occupied or if real Clerk/Postgres environment values are unavailable.

## Docs

- Design: `docs/superpowers/specs/2026-05-12-pvm-url-redirection-system-design.md`
- Implementation plan: `docs/superpowers/plans/2026-05-12-pvm-url-redirection-system.md`
- Deployment: `docs/deployment.md`
