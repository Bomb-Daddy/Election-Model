# Claude Sonnet / Claude Code — Election Analysis Workbench

Read docs/plans/ELECTION_ANALYSIS_WORKBENCH_PLAN_v1.00.md before coding.

**AUTHORITATIVE USER REQUIREMENTS:** Read [USER_REQUIREMENTS.md](USER_REQUIREMENTS.md) **v1.01** before changing code or running QA. It is mandatory and includes UR-QA-001 universal full acceptance coverage, UR-COST-001 $0 spending policy, and UR-API-002 all available polling categories by default. If this file is revised later, use its latest approved version. The detailed plan does not override user requirements.

 It defines the required desktop product, data contracts, model math, deployment and hostile QA.

## Mission
Build an actual offline-first Linux and Windows graphical desktop application. Deliver Windows x64 one-click NSIS .exe, Linux x64 AppImage and optional .deb, with no user-installed Python, Node, database server or CLI tools. Codebase: Electron, React, TypeScript, pure shared calculation engine, bundled SQLite.

## Non-negotiable rules
- Do not stop at a mockup, an HTML demo or a plan. Make and test installers on real Windows and Linux systems; report actual runtime evidence, not only successful compilation.
- Every menu, button, slider and action must function. Unavailable features must be explicitly disabled and explained.
- Source snapshots and user scenarios are immutable and versioned. Mark observed vs poll average vs assumption vs scenario vs validated forecast accurately.
- Republican original-cohort example: 10% abstain; 5% vote Democratic; 85% vote Republican. Convert to OSINT post-abstention crossover: 5/90 = 5.5555556%. Never subtract already recorded early ballots from Michigan turnout. Never silently double-count abstention.
- Silver candidate-share figures include other/undecided; retain both original percentages and separately computed two-party D−R margin.
- Respect known national QA blockers: candidate/holder mismatches, independents, exact-zero ties, and incomplete source provenance. No invented race winners or implied forecast certainty.
- This repository is PUBLIC. Do not commit private Google Drive documents/IDs, copyrighted datasets, restricted screenshots, personal voter records, OAuth tokens or other secrets. Build local authenticated imports instead.
- Log actual test evidence, missing data and blockers. Never claim a feature passed if the test was not run.

## First implementation milestones
1. Repository structure, CI, data schemas, shared engine, versioned source manifest, golden-vector tests.
2. Electron GUI shell, native database migration, file import picker, real Windows and Linux package builds and launch verification.
3. Local JSON/CSV/XLSX imports, Michigan module, national OSINT module, scenario adapter, comparisons and QA center.
4. Optional Google Sheets read-only OAuth connector with PKCE, user consent and encrypted OS credential storage.
5. Full end-to-end hostile QA, cross-platform release artifacts, checksums, change log and user manual.

Use small commits. After each phase report files changed, test commands and results, packaging targets, real OS launch status, unresolved blockers, and next action. Plan revisions use v1.00, v1.01, etc., with older versions archived.


## Active work: VoteHub free polling API connector (2026-11-02)
- **Read [VoteHub Integration Contract v1.00](docs/plans/VOTEHUB_INTEGRATION_v1.00.md) before implementation.** A dependency-free TypeScript connector has been committed at `packages/connectors/src/votehub.ts` with mocked tests at `tests/unit/votehub.test.mjs`.
- **Hard user requirement: $0 cost.** No paid feeds, billing accounts, cloud hosting, paid inference, trials or subscriptions. VoteHub publicly provides this API free under CC BY 4.0; preserve attribution in the UI and exports.
- Make VoteHub available through a secure read-only Electron main-process IPC interface and a fully functional Poll Explorer, where **ALL polling types are selected by default**. Do not force generic ballot.
- Consume VoteHub's documented five endpoints, preserve raw poll metadata, create immutable local source snapshots, handle offline/stale states and explicit refresh. No automatic polling or silent changes to existing G15 or OSINT v3 data.
- **Current status:** connector and 5 offline synthetic tests implemented; live upstream verification and GUI packaging are not yet done. Do not claim the feature is shipped until real Windows and Linux installed applications run successfully.
