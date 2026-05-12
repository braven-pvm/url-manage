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

Run production migrations during deployment:

```powershell
npm run prisma:deploy
```

This runs `prisma migrate deploy`, which requires committed migration files in `prisma/migrations`. Once a real managed Postgres database is provisioned, create the first migration against a real Postgres connection if no migrations exist yet:

```powershell
npm run prisma:migrate -- --name init
```

Commit the generated migration before relying on `npm run prisma:deploy` in Vercel.

## Clerk

Create a Clerk application for the admin console. Enable email/password login. Add SSO providers only when PVM has the identity provider details ready.

Put internal administrator email addresses in `ADMIN_EMAILS` as a comma-separated allowlist. Admin routes require Clerk authentication and then check the signed-in email against that allowlist.

## Manual Verification

1. Confirm the Vercel project has both `go.pvm.co.za` and `admin.pvm.co.za` assigned.
2. Confirm all required Vercel environment variables are set.
3. Run `npm run prisma:deploy` against the managed Postgres database.
4. Sign in to `https://admin.pvm.co.za/admin` with an email listed in `ADMIN_EMAILS`.
5. Create a redirect with code `care-test`.
6. Open `https://go.pvm.co.za/care-test` and confirm it redirects to the configured destination.
7. Open `https://go.pvm.co.za/unknown-test-code` and confirm it redirects to the global fallback URL.
8. Edit the redirect destination in the admin console and confirm the code stays unchanged.
9. Return to the redirect edit page and confirm recent click activity appears.

Local browser verification is limited without real `DATABASE_URL` and Clerk values. Port `3000` may also be occupied by another local repository process; use an alternate port such as:

```powershell
npm run dev -- -p 3003
```
