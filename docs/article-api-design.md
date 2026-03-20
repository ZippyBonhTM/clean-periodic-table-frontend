# Article API Design

## Status

Required — Core API Contract Definition

This document defines the HTTP API structure required for the Article System.

This API must support:

* Article creation
* Article editing
* Draft management
* Publishing workflow
* Feed retrieval
* Hashtag filtering
* Search operations
* Image uploads
* Visibility control

This API is the **primary interface** between:

* Frontend (Vercel)
* Backend (Railway)
* Storage system

All services must follow this contract.

---

# 1. API Design Philosophy

The API must be:

* Predictable
* Versioned
* Stateless
* Secure
* Rate-limited
* Explicit

Every request must:

Be authenticated when required.

Never rely on:

Frontend trust.

---

# 2. Base API Structure

All endpoints must use:

/api/v1/

Example:

/api/v1/articles
/api/v1/feed
/api/v1/uploads

API versioning is mandatory.

Future versions must not break existing clients.

---

# 3. Authentication Model

Authentication must be:

Token-based or session-based.

Every protected endpoint must:

Validate authentication.

---

## Required Authentication Header

Authorization: Bearer <token>

---

## Authentication Required For

* Creating articles
* Editing articles
* Uploading images
* Accessing private content
* Managing drafts

Public feed access may:

Allow anonymous users.

---

# 4. Article Endpoints

These endpoints control article lifecycle.

---

## Create Article Draft

POST
/api/v1/articles

Creates a new draft.

Required input:

* title
* markdown_source
* visibility
* hashtags

Response must include:

* article_id
* slug
* status

Default status:

draft

---

## Update Article

PUT
/api/v1/articles/{article_id}

Updates article content.

Allowed fields:

* title
* markdown_source
* excerpt
* visibility
* hashtags
* cover_image

Must verify:

Ownership.

---

## Get Article

GET
/api/v1/articles/{slug}

Returns article content.

Must enforce:

Visibility rules.

Public articles:

Accessible without login.

Private articles:

Require authentication.

---

## Delete Article

DELETE
/api/v1/articles/{article_id}

Must verify:

Ownership.

Recommended behavior:

Soft delete.

Never permanently delete immediately.

---

## Publish Article

POST
/api/v1/articles/{article_id}/publish

Changes:

status → published
published_at → current timestamp

Must validate:

Content completeness.

---

## Unpublish Article

POST
/api/v1/articles/{article_id}/unpublish

Changes:

status → draft
or
status → archived

---

# 5. Feed Endpoints

Feed endpoints are high-traffic.

Must be optimized.

---

## Get Global Feed

GET
/api/v1/feed

Query parameters:

cursor
limit

Returns:

Paginated article list.

Must:

Use cursor-based pagination.

Never use OFFSET.

---

## Get Hashtag Feed

GET
/api/v1/feed/hashtag/{hashtag}

Returns:

Articles matching hashtag.

Supports:

Cursor pagination.

---

## Get User Feed

GET
/api/v1/users/{user_id}/articles

Returns:

Articles created by user.

Must enforce:

Visibility rules.

---

## Get Private Feed

GET
/api/v1/me/articles

Requires:

Authentication.

Returns:

User private articles.

---

# 6. Search Endpoints

Search must use:

PostgreSQL Full Text Search.

---

## Search Articles

GET
/api/v1/search

Query parameters:

q
cursor
limit

Search fields:

* title
* excerpt
* markdown

Must:

Be rate-limited.

---

# 7. Upload Endpoints

Uploads must use:

Signed URL strategy.

Backend must not proxy files.

---

## Request Upload Token

POST
/api/v1/uploads

Returns:

Signed upload URL.

Response must include:

* upload_url
* file_url

Client uploads directly to storage.

---

## Upload Metadata Confirmation

POST
/api/v1/uploads/confirm

Registers:

Uploaded file.

Validates:

Ownership.

---

# 8. Hashtag Endpoints

Hashtag discovery improves UX.

---

## Get Hashtag Suggestions

GET
/api/v1/hashtags

Query parameters:

q

Returns:

Matching hashtags.

Supports:

Autocomplete UI.

---

# 9. Engagement Endpoints

Tracks usage metrics.

Must be lightweight.

---

## Record Article View

POST
/api/v1/articles/{article_id}/view

Must:

Be asynchronous.

Must not:

Block feed.

---

## Save Article

POST
/api/v1/articles/{article_id}/save

Records:

User save action.

---

# 10. Error Handling Model

Errors must be:

Consistent.

---

## Error Response Structure

Response must include:

* error_code
* message
* request_id

Example structure:

error_code: ARTICLE_NOT_FOUND
message: Requested article does not exist
request_id: unique-id

---

## Forbidden Error Behavior

Never expose:

* Stack traces
* Internal paths
* Database queries

---

# 11. Rate Limiting Strategy

Rate limiting is mandatory.

---

## Required Rate Limits

Apply limits to:

* Article creation
* Upload requests
* Feed requests
* Search requests
* Authentication attempts

Prevents:

Abuse
Scraping
Resource exhaustion

---

# 12. API Security Rules

Security must be enforced.

---

## Required Security Measures

Every request must:

* Validate authentication
* Validate ownership
* Validate input

Never trust:

Client-side validation.

---

## Input Validation Rules

Validate:

* String lengths
* Hashtag limits
* Markdown size
* File metadata

Reject:

Malformed input.

---

# 13. Response Optimization Rules

Responses must be:

Minimal.

---

## Feed Response Rules

Feed responses must not include:

Full Markdown content.

Only include:

Preview fields.

Markdown must only be fetched:

In article detail endpoint.

---

# 14. API Logging Requirements

Logging must include:

* Request ID
* Endpoint
* Response status
* Duration

Never log:

Sensitive tokens.

---

# 15. API Versioning Rules

API must:

Be versioned.

Version format:

v1
v2
v3

New versions must:

Remain backward-compatible.

---

# 16. Critical Mistakes That Must Never Be Made

These mistakes are forbidden.

---

## API Mistakes

Do not:

Create unversioned APIs
Expose private content
Skip authentication checks
Allow unrestricted uploads

---

## Performance Mistakes

Do not:

Return large payloads
Load full markdown in feed
Allow unlimited queries

---

## Security Mistakes

Do not:

Accept arbitrary URLs
Skip validation
Trust frontend logic

---

# 17. API Testing Requirements

API must be tested.

---

## Required Tests

Test:

Authentication
Authorization
Upload workflow
Feed pagination
Search behavior
Error handling

---

# 18. API Design Philosophy

The API must be:

Stable
Secure
Predictable
Efficient

Not:

Implicit
Fragile
Unbounded

---

# End of Document
