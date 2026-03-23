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
- resolved through an admin authorization bridge on the frontend
- backed by a whitelisted `/api/admin/*` proxy for privileged account operations

## Current Migration Mode

The admin frontend now supports an incremental migration path:

- `ADMIN_AUTHZ_SOURCE=legacy-auth`: keep current compatibility and resolve admin authority from the auth service
- `ADMIN_AUTHZ_SOURCE=backend`: resolve admin authority from the product backend only
- `ADMIN_AUTHZ_SOURCE=auto`: prefer the product backend and fall back to the legacy auth source only when the backend authority is unavailable, not when it explicitly denies access

The default remains `legacy-auth` to avoid downtime while the backend admin contract is being implemented.

The user-menu shortcut to `/admin` now follows the same product-backed authority through `/api/admin/session`, with client-side caching used only as a display optimization.
The auth profile shown in the header is informational only and must not be treated as the source of product admin authority.

## Current Guarantees

- `/[locale]/admin*` requires `ADMIN`
- internal Article routes require `ADMIN` while the Article feature stage is `internal`
- non-admin users receive the shared 404 page
- metadata for internal article previews does not expose preview content publicly

## User Directory Semantics

The admin user directory is product-backed.

- it lists accounts already synchronized into `product_users`
- it can trigger a bounded legacy sync that imports auth identities into `product_users`
- it can show an account version marker (`legacy` vs `product-v1`)
- `legacy` currently means the product account was created through the auth bridge during migration
- auth-only identities that have never touched the protected product backend do not appear in the directory yet
- the guarded sync action now covers the first migration path for those auth-only identities, while a future federated contract remains optional

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
