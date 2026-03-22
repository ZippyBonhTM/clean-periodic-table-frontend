# Admin Panel Feature

## Status

Implemented on the frontend as a guarded internal control surface.

## Objective

Provide a professional ADMIN workspace that:

- stays hidden from non-admin users
- centralizes protected navigation
- exposes security and access status clearly
- prepares common admin workflows without faking unsupported backend mutations

## Current Scope

The frontend currently includes these admin areas:

- Overview
- Users
- Access
- Content

All admin routes are:

- server-guarded
- deny-by-default on auth uncertainty
- noindex
- validated against the auth upstream directly during SSR

## Current Guarantees

- `/[locale]/admin*` requires `ADMIN`
- internal Article routes require `ADMIN` while the Article feature stage is `internal`
- non-admin users receive the shared 404 page
- metadata for internal article previews does not expose preview content publicly

## Current Limitation

The panel does not mutate users yet.

Real user administration still depends on backend endpoints for:

- list users
- role changes
- moderation actions
- audit trail
- bounded pagination and filters

## Frontend Design Rule

The admin panel must never pretend that a mutation is live when the backend contract does not exist.

Professional UI is allowed.
Fake authority is not.
