# Article System Feature Specification

## Status

Planned Feature — Initial System Definition

This document defines the architecture, constraints, responsibilities, security rules, and operational workflow required to implement the Article Editor and Feed System.

This feature is intentionally designed to be **scalable**, **secure**, and **compatible with low-cost infrastructure**, specifically:

* Frontend: Vercel (Free / Hobby)
* Backend + Auth: Railway (low-cost plan)
* Database: PostgreSQL
* Media Storage: Object Storage (required)

This system must **not be implemented in an ad-hoc way**.
All work must follow this specification.

---

# 1. Objective

Implement a scalable article publishing system that supports:

* Markdown-based article editing
* Image uploads
* Public and private visibility
* Hashtags
* Infinite scrolling feed
* Search capabilities
* Secure content handling
* Production-safe architecture

This system must be designed as a **content discovery platform** with social-style feed behavior.

However, this is **not a full social network**.

---

# 2. Scope

## Included in MVP

The following features **must** be implemented.

### Article Editor

Support:

* Markdown editing
* Live preview
* Image uploads
* Hashtags
* Draft saving
* Publish/unpublish
* Public/private visibility

---

### Article Storage

Each article must include a structure equivalent to:

```
type Article = {
  id: string
  author_id: string

  title: string
  slug: string
  excerpt: string

  markdown_source: string

  visibility: "public" | "private"
  status: "draft" | "published" | "archived"

  cover_image: string | null
  hashtags: string[]

  created_at: string
  updated_at: string
  published_at: string | null
}
```

---

### Feed System

Support:

* Infinite scroll
* Cursor-based pagination
* Hashtag filtering
* Text search
* Sorting by relevance
* Public article discovery

---

### Search

Support:

* Title search
* Excerpt search
* Markdown body search
* Hashtag search

Search must initially use:

**PostgreSQL Full Text Search**

External search engines are **not allowed** in MVP.

---

## Explicitly NOT Included in MVP

The following **must not** be implemented initially:

* Article certification
* AI validation
* Comments system
* Reactions system
* Notifications
* Monetization
* ML-based ranking
* Real-time collaboration
* External embed rendering
* Import article from URL

These features may be added later.

---

# 3. Infrastructure Constraints

This system must work reliably under the following constraints.

---

## Frontend

Hosted on:

**Vercel (Free or Hobby)**

Known constraints:

* Limited function runtime
* Limited logging retention
* Limited image optimization usage
* No WebSocket server hosting

Therefore:

* Frontend must remain lightweight
* No heavy computation is allowed
* Prefer cached responses
* Prefer static rendering when possible

---

## Backend

Hosted on:

**Railway**

Responsibilities:

* API
* Auth
* Article storage
* Upload management
* Feed generation
* Search queries

Backend must remain:

* Stateless where possible
* Horizontally scalable
* Easy to split into services later

---

## Storage (Mandatory)

Images must be stored in:

**Object Storage**

Images must **never** be stored in:

* Local disk
* Container filesystem
* Database blobs

Required:

* Signed upload URLs
* Controlled file validation
* Server-side ownership checks

---

# 4. Required Architecture

This feature is expected to evolve into multiple services.

It must **not** remain a monolithic folder forever.

---

## Required Repository Strategy

This system will likely require:

### Repository 1 — frontend-web

Responsibilities:

* UI
* Editor
* Feed
* Article viewer
* Markdown preview

Hosted on:

**Vercel**

---

### Repository 2 — backend-api

Responsibilities:

* Article CRUD
* Feed queries
* Search
* Authorization
* Upload management

Hosted on:

**Railway**

---

### Repository 3 — article-worker (recommended)

Responsibilities:

* Async jobs
* Media processing
* Feed scoring
* Metrics aggregation

Optional in MVP but recommended later.

---

## GitHub Organization Requirement

This project should be moved into:

**A professional GitHub Organization**

Not personal-only repositories.

Example structure:

```
github.com/<org-name>/
  frontend-web
  backend-api
  article-worker
  docs
```

This is strongly recommended for:

* Maintainability
* Security
* Collaboration
* CI/CD scaling
* Long-term growth

If necessary:

* Create new repositories
* Create GitHub Projects
* Structure milestones professionally

---

# 5. Feed Architecture

The feed must **not** rely on OFFSET pagination.

OFFSET pagination becomes slow at scale.

Use:

**Cursor-based pagination**

---

## Feed Ranking (Initial)

Feed relevance score should use:

* Recency
* Engagement
* Hashtag match
* Author affinity (optional)

Example:

```
score =
  recency_weight +
  engagement_weight +
  hashtag_affinity
```

Ranking must remain:

* Deterministic
* Explainable
* Cheap

No ML required in MVP.

---

# 6. Security Requirements

Security is **mandatory**.

Not optional.

---

## Markdown Security

Markdown rendering must be:

**Strictly sanitized**

Allowed:

* Headings
* Paragraphs
* Lists
* Links
* Images
* Code blocks

Forbidden:

* script
* iframe
* inline JS
* raw HTML

Recommended MVP rule:

**Disable raw HTML**

---

## Image Upload Security

Uploads must:

* Use signed URLs
* Validate MIME type
* Validate extension
* Enforce size limits
* Generate internal filenames

Never:

* Fetch remote URLs
* Proxy unknown URLs

This prevents:

**SSRF attacks**

---

## Access Control

Private articles must:

* Require authentication
* Require server validation

Never:

Trust frontend permission logic.

---

## Rate Limiting

Required for:

* Article creation
* Uploads
* Feed
* Search

This prevents:

* Abuse
* DoS
* Resource exhaustion

---

# 7. Database Design Requirements

Database:

**PostgreSQL**

---

## Required Tables

```
users
articles
hashtags
article_hashtags
article_stats
```

---

## Required Indexes

```
articles (published_at)
articles (visibility)
articles (author_id)

hashtags (name)

article_hashtags (hashtag_id)
```

---

## Full Text Search

Use:

**PostgreSQL FTS**

Do not introduce external search engines in MVP.

---

# 8. Observability Requirements

Logging must include:

* API errors
* Upload errors
* Feed errors
* Authorization failures

Metrics must include:

* article views
* feed load time
* search latency
* upload failures

---

# 9. Critical Mistakes That MUST NOT Be Made

These are prohibited mistakes.

---

## Architecture Mistakes

Do NOT:

* Use OFFSET pagination
* Store images locally
* Store images in database
* Process images synchronously
* Use one giant API route

---

## Security Mistakes

Do NOT:

* Render unsanitized Markdown
* Fetch remote images
* Trust frontend validation
* Allow raw HTML injection

---

## Database Mistakes

Do NOT:

* Query without indexes
* Use SELECT * in feed queries
* Use OFFSET pagination

---

# 10. Implementation Phases

This system must be built in phases.

Not all at once.

---

## Phase 1 — Core MVP

Required:

* Editor
* Upload
* Storage
* Feed
* Search
* Hashtags

---

## Phase 2 — Improved Feed

Add:

* Engagement metrics
* Ranking
* Caching

---

## Phase 3 — Scaling

Add:

* Worker system
* Feed aggregation
* Optimization

---

# 11. Mandatory Reporting Workflow

Every implementation step **must be reported**.

No silent changes allowed.

---

## Before Implementing

Developer must report:

```
Task:
What will be done.

Reason:
Why this change is necessary.

Expected Result:
What outcome is expected.

Risks:
Possible side effects.

Dependencies:
What this depends on.
```

---

## After Implementing

Developer must report:

```
Changes Made:
What was changed.

Files Modified:
List of files touched.

New Components:
What was created.

Why This Approach Was Chosen:
Why this path was selected.

Current System State:
What now works.

Known Limitations:
What still needs work.

Next Recommended Step:
What should be done next.
```

---

# 12. Final System Design Philosophy

This system must be:

Secure by default
Scalable by design
Simple at first
Expandable later

Not:

Overengineered early
Feature-heavy prematurely
Security-neglectful

---

# End of Document