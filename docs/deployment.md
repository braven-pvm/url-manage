# Deployment

## Services

- Vercel hosts the Next.js application.
- Managed Postgres provides `DATABASE_URL`.
- Clerk provides admin authentication.

## Domains

Configure these domains on the same Vercel project:

- `go.pvm.co.za` for public redirects.
- `admin.pvm.co.za` for the admin console.

The same deployment serves both domains. Admin pages live under `/admin`; public redirect URLs use `https://go.pvm.co.za/<code>`.

Vercel domain assignment and DNS control which hostnames expose the deployment today. `PUBLIC_REDIRECT_HOST` and `ADMIN_HOST` are parsed application metadata values, not host-enforcement controls. The app protects admin access by path: `/admin` routes require Clerk authentication and the admin email allowlist.

## Environment Variables

Set these in Vercel:

- `DATABASE_URL`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in`
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up`
- `ADMIN_EMAILS`
- `DEFAULT_FALLBACK_URL`
- `PUBLIC_REDIRECT_HOST=go.pvm.co.za`
- `ADMIN_HOST=admin.pvm.co.za`
- `IP_HASH_SALT`

Use the same values locally in `.env` when testing database-backed routes.

## Database

Provision a real managed Postgres database first and set `DATABASE_URL` for the environment that will create the initial migration.

If no committed migrations exist yet, create the first migration against that real Postgres connection locally or in an approved migration environment:

```powershell
npm run prisma:migrate -- --name init
```

Commit the generated `prisma/migrations/...` directory.

After committed migrations exist, production deployments can run:

```powershell
npm run prisma:deploy
```

This runs `prisma migrate deploy`, which applies committed migration files from `prisma/migrations`. Deployment alone is not enough before the initial migration exists.

## Clerk

Create a Clerk application for the admin console. Enable email/password login. Add SSO providers only when PVM has the identity provider details ready.

Put internal administrator email addresses in `ADMIN_EMAILS` as a comma-separated allowlist. Admin routes require Clerk authentication and then check the signed-in email against that allowlist.

## Manual Verification

1. Confirm the Vercel project has both `go.pvm.co.za` and `admin.pvm.co.za` assigned.
2. Confirm all required Vercel environment variables are set.
3. Confirm a real Postgres `DATABASE_URL` is provisioned.
4. If this is the first database setup, run `npm run prisma:migrate -- --name init` locally or in an approved migration environment and commit the generated `prisma/migrations/...`.
5. Run `npm run prisma:deploy` against the managed Postgres database after migrations are committed.
6. Sign in to `https://admin.pvm.co.za/admin` with an email listed in `ADMIN_EMAILS`.
7. Create a redirect with code `care-test`.
8. Open `https://go.pvm.co.za/care-test` and confirm it redirects to the configured destination.
9. Open `https://go.pvm.co.za/unknown-test-code` and confirm it redirects to the global fallback URL.
10. Edit the redirect destination in the admin console and confirm the code stays unchanged.
11. Return to the redirect edit page and confirm recent click activity appears.

Local browser verification is limited without real `DATABASE_URL` and Clerk values. Port `3000` may also be occupied by another local repository process; use an alternate port such as:

```powershell
npm run dev -- -p 3003
```
