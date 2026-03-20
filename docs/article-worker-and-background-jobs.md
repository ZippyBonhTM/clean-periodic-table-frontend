# Article Worker and Background Jobs

## Status

Required — Background Processing Definition

This document defines the architecture and responsibilities of the worker system responsible for asynchronous and scheduled tasks.

Workers are required to:

* Prevent slow API responses
* Reduce infrastructure cost
* Maintain feed consistency
* Process heavy tasks safely
* Handle delayed operations

Without background workers, the system will:

* Become slow
* Become expensive
* Become unstable

This document defines how background processing must work.

---

# 1. Worker Philosophy

Workers must handle:

Tasks that are:

* Slow
* Repetitive
* Resource-heavy
* Non-interactive

Workers must not handle:

User-facing HTTP requests.

Workers must operate:

Independently from API runtime.

---

# 2. Worker Responsibilities

The worker system must handle:

* Image optimization
* Engagement aggregation
* Feed ranking updates
* Media cleanup
* Scheduled maintenance
* Data consistency tasks

These responsibilities are mandatory.

---

# 3. Worker Architecture

Workers must run:

Separately from API services.

Recommended structure:

Separate repository:

article-worker

Worker service must be:

Stateless.

Scalable.

Restart-safe.

---

## Worker Communication Model

Workers must communicate using:

Job queues.

Never:

Direct synchronous calls.

---

## Queue-Based Model

Required flow:

API → Queue → Worker → Database

This ensures:

* Decoupling
* Reliability
* Retry safety

---

# 4. Job Queue Requirements

Job queues are mandatory.

Without queues:

Workers become unreliable.

---

## Required Queue Features

Queue must support:

* Delayed jobs
* Retry logic
* Failure handling
* Job prioritization

Recommended queue types:

* Redis-based queues
* Message queues
* Background job frameworks

---

# 5. Image Processing Jobs

Image optimization must be asynchronous.

Never:

Process images during upload request.

---

## Image Optimization Tasks

Worker must:

* Resize large images
* Normalize format
* Remove metadata
* Generate optimized versions

Optional:

Generate thumbnails.

---

## Image Processing Workflow

Step 1:

Upload confirmed.

Step 2:

Job created.

Step 3:

Worker processes image.

Step 4:

Optimized image saved.

---

# 6. Engagement Aggregation Jobs

Engagement metrics must be aggregated.

Never computed on demand.

---

## Engagement Sources

Track:

* Views
* Opens
* Saves

---

## Aggregation Model

Events must:

Be collected.

Stored temporarily.

Aggregated periodically.

---

## Aggregation Frequency

Recommended:

Every few minutes.

Avoid:

Real-time heavy aggregation.

---

# 7. Feed Ranking Jobs

Feed ranking must be updated asynchronously.

---

## Ranking Update Triggers

Triggered when:

* New article published
* Engagement changes
* Scheduled recalculation occurs

---

## Ranking Workflow

Step 1:

Ranking job queued.

Step 2:

Worker calculates relevance score.

Step 3:

Database updated.

---

## Ranking Frequency

Recommended:

Batch-based updates.

Avoid:

Real-time ranking recalculation per request.

---

# 8. Media Cleanup Jobs

Unused media must be removed.

Otherwise:

Storage grows indefinitely.

---

## Cleanup Triggers

Cleanup must run when:

* Article deleted
* Image removed
* Scheduled cleanup cycle runs

---

## Cleanup Frequency

Recommended:

Daily cleanup.

---

# 9. Scheduled Maintenance Jobs

System health requires periodic maintenance.

---

## Required Maintenance Tasks

Must include:

* Cleanup orphan records
* Update stale metrics
* Validate data consistency
* Remove expired temporary files

---

## Scheduling Strategy

Jobs must be scheduled.

Recommended:

Cron-style scheduling.

---

# 10. Retry Strategy

Jobs may fail.

Retry logic is mandatory.

---

## Retry Rules

Retry failed jobs:

Automatically.

Use:

Exponential backoff.

---

## Failure Threshold

After repeated failures:

Mark job as failed.

Log failure.

Notify administrators.

---

# 11. Idempotency Requirements

Workers must support:

Idempotent operations.

---

## Idempotency Definition

Running the same job multiple times must:

Not corrupt data.

Not duplicate work.

---

## Idempotency Strategy

Use:

Unique job identifiers.

---

# 12. Error Handling Strategy

Worker failures must be handled safely.

---

## Required Behavior

On failure:

* Log error
* Retry job
* Mark failure state

Never:

Silently discard failures.

---

# 13. Logging Requirements

Workers must log:

* Job start
* Job success
* Job failure
* Retry attempts

Logs must include:

Job identifiers.

---

# 14. Monitoring Requirements

Workers must be monitored.

Without monitoring:

Failures go unnoticed.

---

## Required Metrics

Track:

* Jobs processed
* Job failure rate
* Queue length
* Processing time

---

# 15. Worker Scaling Strategy

Workers must scale gradually.

---

## Phase 1 Scaling

Single worker instance.

Low job volume.

---

## Phase 2 Scaling

Multiple worker instances.

Higher load.

---

## Phase 3 Scaling

Dedicated job services.

Distributed processing.

---

# 16. Performance Safety Rules

Worker tasks must:

Avoid blocking operations.

Avoid excessive memory use.

Avoid long-running tasks without checkpoints.

---

## Memory Safety

Workers must:

Release unused memory.

Restart safely.

---

# 17. Critical Mistakes That Must Never Happen

These mistakes are forbidden.

---

## Worker Mistakes

Do not:

Run heavy tasks inside API requests
Skip retry logic
Ignore failed jobs
Process images synchronously

---

## Queue Mistakes

Do not:

Lose jobs
Skip persistence
Ignore retry failures

---

## Performance Mistakes

Do not:

Run unbounded jobs
Process large batches without limits

---

# 18. Worker Testing Requirements

Workers must be tested.

---

## Required Tests

Test:

Job retries
Failure recovery
Data consistency
Cleanup logic
Ranking updates

---

# 19. Worker Security Requirements

Workers must follow security rules.

---

## Security Rules

Workers must:

Validate input.

Never trust:

Queued payload blindly.

---

## Sensitive Data Rule

Do not log:

Sensitive tokens.

---

# 20. Worker Design Philosophy

Workers must be:

Reliable
Recoverable
Observable
Efficient

Not:

Fragile
Implicit
Unmonitored

---

# End of Document
