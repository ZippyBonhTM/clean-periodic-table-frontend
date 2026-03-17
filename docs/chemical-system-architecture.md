# Chemical System Architecture

## Purpose

This project already has a working molecule editor and client-side molecule summary pipeline. The goal is to evolve it into a broader chemistry system without breaking the current flows.

Core constraints:
- The client remains the primary execution environment for chemistry calculations.
- The backend remains a BFF plus persistence layer.
- A future Chemical Engine in the backend is optional and must never block the client flow.
- Balance solving, chemistry rules, parsing, and persistence stay clearly separated.

## Current Frontend Guarantees

The frontend already provides:
- graph-based molecule editing
- molecular formula generation
- composition summary generation
- molecule summary generation
- systematic naming for a supported subset of molecules
- PubChem import into the molecule editor
- saved molecule CRUD through the backend BFF

These guarantees should be preserved while new capabilities are added.

## Current Frontend Module Map

### Molecule domain

Existing molecule domain logic lives mainly in `src/shared/utils`:
- `moleculeEditor.ts`
- `moleculeEditor.types.ts`
- `moleculeEditorAtomActions.ts`
- `moleculeEditorBondActions.ts`
- `moleculeGraph*.ts`
- `moleculeLayout*.ts`
- `moleculeNomenclature*.ts`
- `moleculeValence.ts`

This is already a good base for future chemistry capabilities because it separates:
- graph normalization
- graph lookup
- layout
- valence heuristics
- nomenclature
- editor-specific mutation operations

### Molecular editor UI

Editor orchestration lives in `src/components/organisms/molecular-editor`.
That layer should keep focusing on:
- rendering
- interaction
- local editor session state
- import/save workflows

It should not absorb heavy chemistry logic beyond what is needed for the editor itself.

### Import pipeline

External compound import is currently client-side and centered in:
- `src/shared/api/pubchemApi.ts`
- `src/shared/api/pubchemApiSearch.ts`
- `src/shared/api/pubchemApiMolecule.ts`
- `src/components/organisms/molecular-editor/useMoleculeImportWorkflow.ts`

This aligns with the client-first principle and should remain optional and non-blocking.

## Target Chemistry Pipeline on the Client

The client-side chemistry pipeline should evolve toward this shape:

1. Input
2. Parser
3. Internal model
4. Solver
5. Normalizer
6. Lightweight rule engine
7. Output

The important separation is:
- parsing is not solving
- solving is not chemistry validation
- chemistry validation is not persistence

## Recommended Client Module Evolution

To keep the code readable as the chemistry surface grows, future client work should move toward dedicated domains under `src/shared`.

Recommended future module groups:
- `src/shared/chemistry/formula/`
- `src/shared/chemistry/equation/`
- `src/shared/chemistry/solver/`
- `src/shared/chemistry/rules/`
- `src/shared/chemistry/reaction/`
- `src/shared/chemistry/analysis/`

Suggested responsibilities:
- `formula/`: parse chemical formulas and produce element counts
- `equation/`: parse left/right reaction sides into structured equations
- `solver/`: matrix-based balancing, normalization, coefficient simplification
- `rules/`: lightweight heuristics using element metadata
- `reaction/`: reaction domain types and shared contracts
- `analysis/`: plausibility scoring, reaction tagging, optional enrichment

## What Stays in the Existing Molecule Domain

The current molecule graph/editor domain should remain responsible for:
- atom and bond graph operations
- molecule normalization
- molecule summary generation
- formula generation for explicit graph models
- layout for visualization
- subset nomenclature support
- valence heuristics for editing

That domain is already useful and should not be rewritten just to fit future reaction support.

## Future Client Work: Recommended Order

### Phase A
- keep the current molecule editor stable
- keep summary and formula generation client-side
- keep PubChem import client-side

### Phase B
- add formula parsing for raw chemical formulas such as `H2SO4`
- add equation parsing for expressions such as `H2 + O2 -> H2O`
- introduce reaction domain types that are independent from the molecule editor graph model

### Phase C
- add a client-side matrix solver for balancing
- add coefficient normalization and deterministic output formatting
- add lightweight rule-engine heuristics using existing element metadata

### Phase D
- optionally call a backend Chemical Engine for enrichment
- merge engine output into the client result when available
- keep local fallback as the default guarantee

## Backend Chemical Engine Contract

The backend Chemical Engine belongs in the backend repository, not here, but the client should be designed for it.

Expected backend structure:
- `domain/chemical`
- `application/chemical`
- `infrastructure/chemical`
- `interfaces/http`

Expected client contract with that engine:
- client computes locally first
- client may optionally send structured input to the engine
- engine returns validation or enrichment only
- client stays functional when the engine is unavailable

## Performance Rules

The frontend must keep these priorities:
- avoid heavy chemistry dependencies in the client bundle
- keep parsers deterministic and small
- avoid recomputing summaries and formula data unnecessarily
- keep editor mutations fast
- treat backend chemistry as optional enrichment, never as a runtime dependency for basic functionality

## Translation and UI Text

When UI translation work begins, chemistry output should be split into three categories:
- UI labels and messages
- domain errors and notices
- chemistry naming output

These should not be mixed together in the same layer.

In particular:
- UI text belongs in a translation-friendly catalog
- domain errors should be exposed through message keys or mapped outputs
- generated chemistry names may require language-specific naming rules

## When Touching This Area

When adding new chemistry capabilities:
- do not move solving into the backend as the primary path
- do not make the molecule editor depend on the future engine
- do not introduce a giant compound lookup database as a core requirement
- do not mix solver math with chemistry heuristics
- do not replace working molecule graph logic unless there is a clear functional reason

## Practical Next Steps

The next implementation steps that fit this architecture are:
1. add client-side formula parser contracts
2. add client-side equation parser contracts
3. add reaction domain types and balanced equation result types
4. add a lightweight solver module on the client
5. add an optional backend integration contract after the local path is stable
