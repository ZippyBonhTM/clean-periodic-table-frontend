# Article Feed Design

## Status

Required — Core Feed Architecture Definition

This document defines how the Article Feed must be designed, queried, ranked, paginated, cached, and scaled.

The feed is the **highest traffic component** of the Article System.

Poor feed design leads to:

* Slow performance
* High database cost
* Increased infrastructure cost
* Poor user experience
* System instability

This document prevents those failures.

---

# 1. Feed Philosophy

The feed must be:

* Fast
* Predictable
* Scalable
* Cacheable
* Cheap to query

The feed must assume:

* Many reads
* Fewer writes
* Continuous scrolling behavior

Feed design must prioritize:

**Read performance over write complexity**

---

# 2. Feed Types

The system must support at least the following feed types.

---

## Global Feed

Shows:

Public published articles.

Sorted by:

Relevance score.

Fallback sorting:

Published date (descending).

---

## Hashtag Feed

Shows:

Articles filtered by hashtag.

Used for:

* Discovery
* Topic browsing

Sorting:

Relevance or recency.

---

## User Feed

Shows:

Articles created by a specific author.

Sorting:

Published date descending.

---

## Private Feed

Shows:

User's private articles.

Requires:

Authentication.

Must never:

Expose private content to unauthorized users.

---

# 3. Pagination Model

Pagination must use:

**Cursor-based pagination**

Offset pagination is forbidden.

---

## Why OFFSET is Forbidden

OFFSET causes:

* Slow queries at scale
* Increasing latency
* High database load

OFFSET queries become slower with larger datasets.

Cursor pagination remains stable.

---

## Cursor-Based Pagination Model

Pagination must use:

Stable cursors.

Example cursor:

published_at + article_id

This ensures:

* Deterministic ordering
* No duplicate results
* No missing results

---

## Example Cursor Structure

Cursor should encode:

* published_at
* article_id

Encoded as:

Opaque string.

Never expose raw database values directly.

---

# 4. Feed Query Strategy

Feed queries must be:

* Indexed
* Minimal
* Predictable

---

## Required Feed Fields

Feed must only return:

* id
* title
* slug
* excerpt
* cover_image
* hashtags
* author_id
* published_at
* relevance_score

Never return:

Full markdown content in feed queries.

Markdown must be fetched only on:

Article detail view.

---

## Feed Query Rules

Do not:

Use SELECT *

Always:

Select only required fields.

This reduces:

* Memory usage
* Network usage
* CPU usage

---

# 5. Ranking Model

Ranking determines feed relevance.

Ranking must begin simple.

---

## Initial Ranking Inputs

Ranking score should include:

* Recency
* Engagement
* Hashtag affinity

---

## Recency Score

Recent content should appear higher.

Recency weight decays over time.

Example concept:

Newer articles rank higher than older ones.

---

## Engagement Score

Engagement signals include:

* Views
* Saves
* Click-throughs

These values must be aggregated.

Never recompute raw engagement per request.

---

## Hashtag Affinity

Articles matching selected hashtags receive:

Score boost.

---

## Ranking Strategy Rule

Ranking must remain:

Deterministic.

No ML required.

No black-box logic.

---

# 6. Engagement Metrics Model

Engagement tracking must be:

Lightweight.

---

## Required Metrics

Track:

* article_view_count
* article_open_count
* article_save_count

Optional:

* reading_duration

---

## Write Strategy

Engagement updates must be:

Asynchronous.

Never update counters during feed reads.

Use:

Queue or background worker.

---

# 7. Feed Caching Strategy

Caching is mandatory for scalability.

Without caching:

Costs increase quickly.

---

## Cache Targets

Cache:

* Feed pages
* Hashtag results
* Popular content

---

## Cache Duration

Typical ranges:

* Feed cache: short-lived
* Hashtag cache: moderate-lived
* Popular content: longer-lived

Cache duration must balance:

Freshness vs performance.

---

## Cache Invalidation

Cache must be invalidated when:

* New article published
* Article updated
* Article visibility changes

Failure to invalidate causes:

Stale feeds.

---

# 8. Feed Read Optimization

Feed reads must be:

Cheap.

Predictable.

---

## Required Indexes

Must exist on:

* published_at
* visibility
* relevance_score
* hashtag mapping tables

Without indexes:

Feed becomes slow.

---

## Query Stability Rule

Feed queries must:

Remain stable across data growth.

Performance must not degrade linearly.

---

# 9. Feed Write Optimization

Writes must be:

Less frequent than reads.

---

## Write Path Requirements

On article publish:

Update:

* article record
* hashtag mapping
* ranking metadata

Never:

Recompute full ranking on publish.

Use:

Deferred computation when necessary.

---

# 10. Hashtag System Design

Hashtags are core to discovery.

---

## Hashtag Storage

Hashtags must be:

Stored separately.

Never embedded only in text.

Use:

Mapping table.

---

## Hashtag Query Strategy

Hashtag queries must:

Use indexed joins.

Never scan full tables.

---

## Hashtag Limits

Recommended:

Max hashtags per article:

10

Too many hashtags reduce:

Query efficiency.

---

# 11. Infinite Scroll Design

Infinite scroll is primary UI interaction.

---

## Required Behavior

Scroll must:

Load next page using cursor.

Never reload full dataset.

---

## Load Size

Recommended:

Small page sizes.

Typical values:

10–30 items.

Large pages increase:

Latency and memory usage.

---

# 12. Feed Abuse Prevention

Feeds are high-traffic endpoints.

Must be protected.

---

## Rate Limits Required

Apply limits to:

* Feed loads
* Hashtag searches
* Pagination requests

Prevents:

Bot scraping.

---

## Scraping Protection

Optional:

Introduce:

* Request throttling
* Behavioral detection

---

# 13. Feed Failure Handling

Feed failures must degrade safely.

---

## Failure Behavior

If ranking fails:

Fallback to:

Chronological order.

Never:

Return server error due to ranking failure.

---

# 14. Performance Monitoring

Feed performance must be measured.

---

## Required Metrics

Track:

* feed_query_latency
* feed_cache_hit_rate
* feed_error_rate
* database_query_time

Without metrics:

Performance cannot be improved.

---

# 15. Scaling Strategy

Feed must scale gradually.

Not prematurely.

---

## Phase 1 Scaling

Use:

Single database instance.

Optimize:

Indexes.

---

## Phase 2 Scaling

Introduce:

Read replicas.

Optional:

Worker services.

---

## Phase 3 Scaling

Introduce:

Advanced caching.

Possible:

Dedicated feed service.

---

# 16. Critical Mistakes That Must Never Be Made

These mistakes are forbidden.

---

## Feed Mistakes

Do not:

* Use OFFSET pagination
* Load full content in feed
* Skip indexes
* Recalculate ranking on every request
* Allow unbounded queries

---

## Performance Mistakes

Do not:

* Fetch unnecessary fields
* Return large datasets
* Ignore slow query logs

---

## Architecture Mistakes

Do not:

* Hardcode feed logic in frontend
* Duplicate ranking logic across services
* Ignore caching strategy

---

# 17. Feed Testing Requirements

Feed logic must be tested.

---

## Required Tests

Test:

* Cursor pagination
* Hashtag filtering
* Ranking stability
* Cache behavior
* Private visibility enforcement

---

# 18. Feed Design Philosophy

Feed design must be:

Efficient
Stable
Predictable
Secure

Not:

Overcomplicated
Heavy
Unbounded

---

# End of Document
