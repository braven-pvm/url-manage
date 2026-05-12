# PVM URL Redirection System Design

Date: 2026-05-12

## Purpose

PVM needs a controlled URL redirection system for long-lived product packaging links, QR codes, print material, events, and promotions. The system must let admins create stable public URLs, update their destinations over time, and keep a lightweight operational audit trail.

## Scope

V1 provides:

- Public redirects on `go.pvm.co.za`.
- An authenticated admin console on `admin.pvm.co.za` or `urladmin.pvm.co.za`.
- Admin-managed mappings from a short code to a destination URL.
- Manual and auto-generated short codes.
- A configurable global fallback URL for missing or invalid codes.
- Basic click logging for operational tracking.

V1 does not provide:

- QR code generation.
- Campaign analytics, conversion tracking, or UTM reporting.
- Public inactive or error pages.
- Role-based permissions beyond authenticated admin access.
- Link expiry behavior.

Phase 2 can add deeper analytics, exports, campaign grouping, device/location breakdowns, explicit link expiry, and QR code generation if needed.

## Recommended Stack

Use a single Next.js application deployed on Vercel, backed by managed Postgres and managed authentication.

This gives PVM a proven and scalable foundation without custom server operations. It also supports separate custom domains for public redirects and admin access while keeping implementation and deployment simple.

The app serves two hostnames:

- `go.pvm.co.za`: public redirect surface only.
- `admin.pvm.co.za` or `urladmin.pvm.co.za`: authenticated admin console.

## Public Redirect Behavior

A request to `https://go.pvm.co.za/<code>` follows this flow:

1. Normalize and validate `<code>`.
2. Look up the code in the redirect table.
3. If found, create a lightweight click event and redirect to the configured destination URL.
4. If not found, malformed, or otherwise unresolvable, redirect to the configured global fallback URL.

The redirect path should remain intentionally small and fast. Click logging must not prevent the redirect from completing. If logging fails, the user should still be redirected.

V1 treats a redirect as active if it exists. To retire or change a printed URL, an admin updates its destination to the desired replacement URL.

## Admin Console

The admin console is available only to authenticated internal users.

V1 admin capabilities:

- Log in with managed email/password or SSO-style authentication.
- View all redirect records in a searchable list.
- Create a redirect with either a manual code or an auto-generated code.
- Edit a redirect destination, title, description, and notes.
- View total clicks and recent click activity per redirect.
- View and update the global fallback URL.

No role system is required in V1. All authenticated admin users have the same access.

## Data Model

### redirects

Stores the stable public URL mappings.

Fields:

- `id`
- `code`
- `destination_url`
- `title`
- `description`
- `notes`
- `created_at`
- `updated_at`
- `created_by`
- `updated_by`

Rules:

- `code` must be unique.
- `code` should be URL-safe and suitable for print.
- Manual codes are allowed.
- Auto-generated codes must avoid collisions.
- Existing codes should not be reused casually because printed materials may exist for years.

### click_events

Stores lightweight operational tracking.

Fields:

- `id`
- `redirect_id`
- `requested_code`
- `outcome`
- `referrer`
- `user_agent`
- `ip_hash` or truncated IP
- `created_at`

Rules:

- A matched redirect stores `redirect_id`.
- A fallback redirect stores the requested code and a fallback outcome.
- IP data should be privacy-conscious and only retained at the minimum fidelity needed for troubleshooting.

### settings

Stores system-level configuration.

Fields:

- `key`
- `value`
- `updated_at`
- `updated_by`

Required setting:

- `global_fallback_url`

## Security

Admin routes require authentication. Public redirect routes do not require authentication.

Destination URLs must be validated before saving. V1 should only allow absolute `http` and `https` URLs.

The admin console must protect against accidental open-ended behavior:

- Reject invalid URLs.
- Reject duplicate short codes.
- Normalize codes consistently.
- Keep public fallback behavior deterministic.

## Reliability

Printed packaging and QR URLs may live for years, so stability matters more than feature breadth.

Important reliability properties:

- Redirect lookup must be simple and fast.
- Missing records must always resolve to the global fallback.
- Logging failures must not block redirects.
- Database migrations should preserve existing codes.
- Admin edits should update destinations without changing public codes.

## Testing

V1 should include focused automated tests for:

- Redirect lookup success.
- Missing or malformed code fallback.
- Destination URL validation.
- Short code uniqueness.
- Manual and auto-generated code creation.
- Admin route protection.
- Redirect edit behavior.
- Click logging best-effort behavior.

Manual browser verification should cover:

- Admin login.
- Redirect creation.
- Redirect editing.
- Public redirect from `go.pvm.co.za/<code>`.
- Unknown code redirecting to the fallback URL.

## Open Deployment Decisions

The final implementation plan should pick exact providers for:

- Managed Postgres.
- Managed authentication.
- Domain routing for `go.pvm.co.za`.
- Domain routing for `admin.pvm.co.za` or `urladmin.pvm.co.za`.

The recommended default is Vercel-hosted Next.js with managed Postgres and managed auth unless an existing PVM infrastructure constraint appears later.
