# AGENTS.md

## Chemistry Context

For any chemistry-related feature in this repository, use these files as required project context before making changes:

- `docs/chemical-system-context.md`
- `docs/chemical-system-architecture.md`

This applies to work involving, for example:
- molecule editing
- molecular formulas
- equation parsing
- reaction balancing
- chemistry plausibility analysis
- client/backend chemistry integration
- future Chemical Engine integration

## Priority

When working on chemistry-related features:
1. Read `docs/chemical-system-context.md` for the operational rules.
2. Read `docs/chemical-system-architecture.md` for the structural and roadmap view.
3. Preserve current working behavior before extending the system.
4. Keep the client-first fallback model intact.
