# Admin Panel Feature

## Status

Implemented on the frontend as a guarded internal control surface with protected admin API wiring.

## Objective

Provide a professional ADMIN workspace that:

- stays hidden from non-admin users
- centralizes protected navigation
- exposes security and access status clearly
- prepares common admin workflows without faking unsupported backend mutations

## Current Scope

The frontend currently includes these admin areas:

- Overview
- Users directory with URL-synced filters
- User detail with guarded role/moderation/session actions
- Audit trail with URL-synced filters
- Access
- Content

All admin routes are:

- server-guarded
- deny-by-default on auth uncertainty
- noindex
- validated against the auth upstream directly during SSR
- backed by a whitelisted `/api/admin/*` proxy for privileged account operations

## Current Guarantees

- `/[locale]/admin*` requires `ADMIN`
- internal Article routes require `ADMIN` while the Article feature stage is `internal`
- non-admin users receive the shared 404 page
- metadata for internal article previews does not expose preview content publicly

## Current Limitation

The frontend now contains the user directory, protected audit trail, and guarded mutation forms.
However, real authority still depends on backend enforcement for:

- bounded directory and audit queries
- role changes
- moderation actions
- session revocation
- last-admin protection
- self-protection rules
- append-only audit records
- rate limiting on privileged actions

## Frontend Design Rule

The admin panel must never pretend that a mutation is live when the backend contract does not exist.

Professional UI is allowed.
Fake authority is not.
