# AGENTS.md

## Global Development Rules

Before performing any implementation, modification, or architectural change in this repository, the agent must:

1. Read this `AGENTS.md` file completely.
2. Identify which **feature domain** the task belongs to.
3. Load only the required context files for that domain.
4. Preserve all currently working behavior.
5. Avoid large refactors unless explicitly required.
6. Implement changes incrementally.
7. Report all actions before and after execution.

The system is organized into **feature domains**.
Each domain has its own required documentation context.

---

# Core Execution Principles

These rules apply to **all domains**.

## Preserve Working Behavior

Never break existing working features.

Before modifying anything:

* Understand current behavior.
* Validate existing integrations.
* Avoid unnecessary rewrites.

---

## Incremental Implementation

Changes must be:

* Small
* Controlled
* Observable

Never:

* Rewrite entire modules without strong justification.
* Introduce large structural changes without reporting.

---

## Mandatory Reporting Workflow

Before implementing any meaningful change, the agent must report:

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

---

After implementing, the agent must report:

Changes Made:
What was changed.

Files Modified:
List of files touched.

New Components:
What was created.

Why This Approach Was Chosen:
Why this implementation path was selected.

Current System State:
What now works.

Known Limitations:
What still needs work.

Next Recommended Step:
What should be done next.

---

# Domain: Chemistry System

## Chemistry Context

For any chemistry-related feature in this repository, use these files as required project context before making changes:

* `docs/chemical-system-context.md`
* `docs/chemical-system-architecture.md`

This applies to work involving, for example:

* molecule editing
* molecular formulas
* equation parsing
* reaction balancing
* chemistry plausibility analysis
* client/backend chemistry integration
* future Chemical Engine integration

---

## Chemistry Priority Rules

When working on chemistry-related features:

1. Read `docs/chemical-system-context.md` for operational rules.
2. Read `docs/chemical-system-architecture.md` for structural design.
3. Preserve current chemistry behavior.
4. Keep the client-first fallback model intact.
5. Never break chemical parsing compatibility.

---

# Domain: Article System

## Article Context

For any article-related feature in this repository, the following documents must be used as required project context before making changes:

* `docs/article-system-feature.md`
* `docs/article-security-model.md`
* `docs/article-feed-design.md`
* `docs/article-database-schema.md`
* `docs/article-editor-architecture.md`
* `docs/article-api-design.md`
* `docs/article-storage-and-media-architecture.md`
* `docs/article-worker-and-background-jobs.md`

These files define the official architecture of the Article System.

---

## Article Feature Scope

This domain applies to work involving:

* article editor
* markdown rendering
* article publishing
* draft management
* hashtag handling
* feed generation
* search behavior
* image uploads
* media storage
* background jobs
* ranking logic
* visibility controls

---

## Article Priority Rules

When working on article-related features:

1. Read `docs/article-system-feature.md` first.
2. Read only the additional documents necessary for the specific task.
3. Preserve current site behavior.
4. Integrate incrementally into the existing architecture.
5. Avoid unnecessary rewrites.
6. Reuse existing components when possible.
7. Keep security constraints enforced at all times.

---

## Article Safety Rules

The agent must never:

* Allow raw HTML rendering in Markdown (MVP stage).
* Fetch remote images from user-provided URLs.
* Store uploaded files locally.
* Use OFFSET pagination in feed queries.
* Trust client-side authorization.
* Expose private articles publicly.
* Introduce unbounded queries.
* Introduce breaking schema changes without migration.

---

# Domain Detection Rules

Before executing any task, determine which domain applies.

If the task involves:

Chemistry logic → Use Chemistry Domain
Article publishing → Use Article Domain

If the task involves both:

Load both domain contexts.

Never load unrelated domains unnecessarily.

---

# Repository Awareness Rules

Before making changes, the agent must:

1. Inspect the existing repository structure.
2. Identify existing modules.
3. Detect reusable components.
4. Avoid duplication.
5. Avoid creating unnecessary new services.

If a new repository becomes necessary:

* Justify the decision first.
* Explain why separation is required.
* Provide migration plan.

---

# Architecture Preservation Rules

Never restructure the project unless:

* Required for scalability
* Required for maintainability
* Approved by report workflow

Major refactors must:

Be justified.

---

# Database Safety Rules

Before modifying database schema:

* Confirm existing schema compatibility.
* Provide migration plan.
* Avoid destructive changes.

Never:

Drop tables without justification.

Never:

Modify production schema without migration.

---

# Performance Awareness Rules

The agent must always consider:

* Query performance
* Memory usage
* Network usage
* Storage cost

Avoid:

Heavy queries
Unbounded loops
Full dataset scans

---

# Security Awareness Rules

Security rules are mandatory.

Always enforce:

* Input validation
* Authentication
* Authorization
* Rate limiting
* Upload restrictions

Never:

Trust client-side logic.

Never:

Expose internal system details.

---

# Testing Awareness Rules

Before completing a task:

The agent must verify:

* Feature works correctly
* No regression introduced
* No security issue introduced

Testing is required.

Not optional.

---

# Documentation Awareness Rules

Every major change must:

Update documentation.

Never:

Leave architecture undocumented.

---

# Final Execution Directive

All work must be:

* Controlled
* Explained
* Justified
* Verified

No silent changes.

No hidden modifications.

No unreported architecture changes.

Every step must be observable.

---

# End of File