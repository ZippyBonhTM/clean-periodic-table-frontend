# Chemical System Context

## Purpose

This file is the default context reference for chemistry-related features in this frontend.

Use it when implementing or refactoring:
- molecule editing
- formula handling
- equation parsing
- balancing
- plausibility analysis
- client/backend chemistry integration

This document is intentionally shorter and more operational than `docs/chemical-system-architecture.md`.

## Non-Negotiable Rules

- The client is the primary execution environment for chemistry calculations.
- The backend is complementary and must not become a mandatory runtime dependency for core chemistry flows.
- Balance solving, chemistry rules, parsing, and persistence must stay separated.
- Existing working molecule editor behavior must not be broken.
- Existing molecule persistence flows must not be broken.
- The system must keep working even if the future backend Chemical Engine is unavailable.

## Current Guarantees We Preserve

The frontend already has:
- graph-based molecule editing through atoms and bonds
- client-side molecular formula generation
- client-side composition and summary generation
- supported systematic naming generation for part of the molecule domain
- PubChem import into the molecule editor
- integration with backend persistence for user molecules

These guarantees are part of the baseline. New work should extend them, not reset them.

## Source of Truth by Responsibility

### Client

The client is responsible for:
- parsing formulas
- parsing equations
- building structured internal chemistry models
- balance solving
- coefficient normalization
- lightweight chemistry heuristics
- editor-driven molecule graph operations
- local summary generation

### Backend

The backend is responsible for:
- user molecule persistence
- element database delivery
- auth integration through the existing BFF flow
- optional chemistry enrichment in the future

### Future Chemical Engine

The future Chemical Engine:
- belongs in the backend repository
- is optional
- must enrich or validate, not replace the client-first flow
- must be organized with Clean Architecture

## Separation of Concerns

Keep these concerns independent:

- formula parser
- equation parser
- molecule graph editing
- balance solver
- chemistry rule engine
- persistence
- remote enrichment

Do not mix them in one module just because they are all “chemistry”.

## Existing Frontend Areas to Respect

### Molecule domain

Main current domain base:
- `src/shared/utils/moleculeEditor.ts`
- `src/shared/utils/moleculeGraph*.ts`
- `src/shared/utils/moleculeLayout*.ts`
- `src/shared/utils/moleculeNomenclature*.ts`
- `src/shared/utils/moleculeValence.ts`

These modules already separate important concerns and should evolve incrementally.

### Editor UI

Main UI orchestration lives in:
- `src/components/organisms/molecular-editor`

This layer should stay focused on:
- rendering
- interactions
- local session state
- save/import workflows

It should not absorb heavy chemistry engine logic.

### External import

PubChem import currently lives in:
- `src/shared/api/pubchemApi*.ts`
- `src/components/organisms/molecular-editor/useMoleculeImportWorkflow.ts`

This is part of the client-first strategy and should remain optional and resilient.

## Performance Priorities

- Keep chemistry code deterministic and lightweight on the client.
- Avoid heavy dependencies for balance solving unless there is a strong justification.
- Recompute chemistry summaries only when data actually changes.
- Keep editor mutation flows fast.
- Prefer small composable modules over broad multipurpose chemistry files.

## What Not To Do

- Do not move balancing to the backend as the primary path.
- Do not introduce a giant compound database as a requirement.
- Do not make the frontend depend on the future Chemical Engine for core functionality.
- Do not mix solver math with heuristics and UI notices in the same module.
- Do not rewrite stable molecule graph logic without a concrete need.

## Recommended Direction for New Chemistry Work

When adding chemistry-related features, prefer this order:

1. Define structured domain types
2. Add parsing
3. Add solving or analysis
4. Add normalization
5. Add lightweight heuristics
6. Add optional backend enrichment

If there is a choice between convenience and separation, prefer separation.

## Translation and Messages

When chemistry features expose text:
- UI labels should live in a translation-friendly catalog
- domain errors should not be hard-coded deep inside logic modules forever
- generated chemistry names may need language-aware rules later

This means chemistry code should increasingly return structured results, not only raw display strings.

## Working Rule for Future Changes

For chemistry-related features in this system:
- preserve current behavior first
- refactor in small readable steps
- keep client fallback always available
- treat backend chemistry as enrichment, never as the only path

For structural details and roadmap, see:
- `docs/chemical-system-architecture.md`
