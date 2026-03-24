# Article Database Schema

## Status

Required — Core Database Definition

This document defines the **database schema**, relationships, indexing strategy, and constraints required for the Article System.

This schema is designed to support:

* Article publishing
* Hashtag discovery
* Feed performance
* Search performance
* Access control
* Scalable reads
* Low-cost infrastructure

The database must be optimized for:

**Read-heavy workloads**

Not write-heavy workloads.

---

# 1. Database Philosophy

The database must be:

* Predictable
* Indexed
* Structured
* Efficient
* Migration-friendly

The database must assume:

* Frequent feed reads
* Moderate article writes
* Increasing dataset size over time

Performance must remain stable as the dataset grows.

---

# 2. Primary Entities

The system requires the following core entities:

* Users
* Articles
* Hashtags
* ArticleHashtags
* ArticleStats

These tables are mandatory.

---

# 3. Users Table

This table may already exist in the authentication system.

If so, it must remain compatible.

---

## Table: users

Required fields:

* id (UUID, Primary Key)
* email (Unique)
* created_at (Timestamp)

Optional fields:

* username
* profile_image
* display_name

---

## Requirements

User IDs must:

* Use UUID
* Never use incremental IDs

Reason:

Prevents enumeration attacks.

---

# 4. Articles Table

This is the most important table.

It stores article metadata and content.

---

## Table: articles

Required fields:

* id (UUID, Primary Key)

* author_id (UUID, Foreign Key → users.id)

* title (Text)

* slug (Text, Unique)

* excerpt (Text)

* markdown_source (Text)

* visibility (Enum: public, private)

* status (Enum: draft, published, archived)

* cover_image (Text, Nullable)

* created_at (Timestamp)

* updated_at (Timestamp)

* published_at (Timestamp, Nullable)

---

## Required Constraints

Slug must be:

Unique.

Visibility must be:

Validated.

Status must be:

Validated.

---

## Required Indexes

Must include:

Index on:

published_at

Index on:

visibility

Index on:

author_id

Index on:

status

---

## Optional Performance Index

Recommended:

Composite index:

visibility + published_at

This speeds up:

Feed queries.

---

# 5. Hashtags Table

Stores unique hashtag definitions.

---

## Table: hashtags

Required fields:

* id (UUID, Primary Key)
* name (Text, Unique)
* created_at (Timestamp)

---

## Requirements

Hashtag names must:

Be normalized.

Recommended:

Lowercase only.

Remove duplicates.

---

## Required Indexes

Unique index on:

name

---

# 6. ArticleHashtags Mapping Table

Defines many-to-many relationship.

---

## Table: article_hashtags

Required fields:

* article_id (UUID, Foreign Key → articles.id)
* hashtag_id (UUID, Foreign Key → hashtags.id)

---

## Required Constraints

Composite Primary Key:

article_id + hashtag_id

This prevents:

Duplicate mappings.

---

## Required Indexes

Index on:

hashtag_id

Index on:

article_id

---

# 7. ArticleSaves Mapping Table

Defines which user saved which article.

---

## Table: article_saves

Required fields:

* user_id (UUID)
* article_id (UUID, Foreign Key -> articles.id)
* created_at (Timestamp)

---

## Required Constraints

Composite Unique Key:

user_id + article_id

This prevents:

Duplicate saves.

---

## Required Indexes

Index on:

user_id

Index on:

article_id

---

# 8. ArticleStats Table

Stores aggregated metrics.

Must be lightweight.

---

## Table: article_stats

Required fields:

* article_id (UUID, Primary Key)

* view_count (Integer)

* open_count (Integer)

* save_count (Integer)

* last_updated (Timestamp)

---

## Requirements

Counters must:

Be aggregated.

Never computed dynamically per request.

---

# 9. Slug Design Rules

Slug is used for article URLs.

Slug must:

Be human-readable.

Example:

introduction-to-chemistry

---

## Slug Constraints

Slug must:

Be unique.

Slug must:

Be indexed.

---

## Slug Security Rule

Never:

Expose internal IDs in URLs.

Always use:

Slug-based routing.

---

# 10. Full Text Search Design

Search must use:

PostgreSQL Full Text Search.

Not external search engines.

---

## Search Fields

Search must include:

* title
* excerpt
* markdown_source

---

## Required Index

Use:

Full-text index on search fields.

This enables:

Fast search queries.

---

# 10. Visibility Model

Visibility determines article access.

---

## Visibility Values

Allowed:

public
private

---

## Query Rule

Public feed queries must:

Only return:

visibility = public

Private queries must:

Filter by:

author_id

---

# 11. Draft Handling

Drafts must be stored.

But must not:

Appear in public feeds.

---

## Draft Rule

Only:

status = published

May appear in public feed.

---

# 12. Timestamp Rules

Timestamps must be:

Reliable.

---

## Required Timestamps

Every article must track:

* created_at
* updated_at
* published_at

---

## Timestamp Usage

published_at determines:

Feed ordering.

---

# 13. Data Integrity Rules

Data must remain consistent.

---

## Required Foreign Keys

Must enforce:

articles.author_id → users.id

article_hashtags.article_id → articles.id

article_hashtags.hashtag_id → hashtags.id

article_stats.article_id → articles.id

---

## Cascade Rules

Recommended:

Delete article → delete related mappings.

Prevents:

Orphan records.

---

# 14. Migration Strategy

Database changes must:

Use migrations.

Never:

Modify schema manually.

---

## Migration Requirements

Every schema change must include:

* Forward migration
* Rollback migration

---

## Versioning

Migrations must:

Be versioned.

Ordered.

---

# 15. Index Optimization Strategy

Indexes are critical.

Without indexes:

Performance collapses.

---

## Required Monitoring

Monitor:

Slow queries.

If slow queries appear:

Add indexes.

---

## Index Safety Rule

Never:

Add unnecessary indexes.

Too many indexes slow writes.

Balance is required.

---

# 16. Feed Optimization Queries

Feed queries must:

Use indexed filters.

Never:

Scan entire tables.

---

## Required Feed Filter

Must include:

visibility = public
status = published

---

# 17. Storage Considerations

Markdown content can grow.

Plan accordingly.

---

## Content Size Limits

Recommended:

Max article size defined.

Example:

100KB–500KB Markdown.

Very large content increases:

Memory usage.

---

# 18. Backup Requirements

Database backups are mandatory.

---

## Backup Rules

Backups must:

Run automatically.

Be encrypted.

Be recoverable.

---

## Recovery Testing

Backup recovery must be:

Tested periodically.

Backups are useless if unrecoverable.

---

# 19. Critical Mistakes That Must Never Happen

These mistakes are forbidden.

---

## Schema Mistakes

Do not:

Use auto-increment IDs
Store hashtags as text blobs
Skip foreign keys
Store images in database

---

## Query Mistakes

Do not:

Use SELECT *
Skip indexes
Load large markdown in feed

---

## Migration Mistakes

Do not:

Modify schema manually
Skip migration files
Apply untested migrations

---

# 20. Database Design Philosophy

Database design must be:

Structured
Indexed
Predictable
Stable

Not:

Chaotic
Ad-hoc
Uncontrolled

---

# End of Document
