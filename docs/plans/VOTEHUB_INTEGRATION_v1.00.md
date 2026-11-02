# VoteHub Polling API — Implementation Contract v1.00

**Date:** 2026-11-02
**Repository:** Bomb-Daddy/Election-Model
**Status:** Connector code and synthetic/offline unit tests implemented; Electron UI, live VoteHub network verification, SQLite snapshots, installers, and Windows/Linux launch QA **NOT YET IMPLEMENTED**.

## 1. Strict cost policy
- **Maximum recurring or usage cost: $0.**
- VoteHub documents its public polling API as **free of charge**; its public data is licensed **CC BY 4.0** (link and attribute on every data view and export).
- **No paid APIs, subscriptions, cloud hosting, paid GitHub features, paid data services, paid map tools, AI inference charges, trial billing, card entry, or automatic provisioning.**
- Do not automatically access FiftyPlusOne's $100/month paid feed. Only use additional aggregators through authorized genuinely free sources or explicit local imports.
- The feature must run inside the planned local, packaged Electron desktop app with no extra dependencies installed by the user.

## 2. Already implemented
- `packages/connectors/src/votehub.ts`: dependency-free TypeScript main-process-friendly client
- `tests/unit/votehub.test.mjs`: 5 synthetic/mocked unit tests (5 passed locally on Node 22.16.0)
- Endpoints documented by VoteHub: `GET /polls`, `GET /polls/{poll_id}`, `GET /pollsters`, `GET /subjects`, `GET /poll-types`.
- Default `getPolls()` includes **every category VoteHub returns** (no forced generic-ballot filter).
- Optional poll type, pollster, subject, date range, sample size and population filters.
- Read-through in-memory cache (1h), manual force-refresh, explicit `cached` and `stale` markers, 20s timeout, no background polling.
- Basic input validation and response shape checks, preservation of raw provider record and source metadata.
- Provider source: https://votehub.com/polls/api/ ; REST base: https://api.votehub.com ; license: https://creativecommons.org/licenses/by/4.0/.

## 3. Next actions for Claude Sonnet — implement, not plan
1. Read repository `CLAUDE.md` and `docs/plans/ELECTION_ANALYSIS_WORKBENCH_PLAN_v1.00.md`. The Electron/React/SQLite architecture and Windows/Linux one-click installer requirements are authoritative.
2. Use `VoteHubClient` from **Electron main process**; expose strict validated read-only IPC operations with `contextIsolation` and `sandbox` enabled. Never fetch provider data directly from renderer, and never expose generic network proxying.
3. Add a **Poll Explorer** tab with **All polling types** as the default, dynamically populated filter choices from `getPollTypes()`, pollster/subject search, date & population filters; a visible `Refresh` button; poll details and public source links; loading, offline, last-retrieved, cached and stale states. Ensure every clickable control works, with accessible help text.
4. Add a local immutable **VoteHub source snapshot** on explicit Import/Save with metadata (retrieval timestamp, license, URL, original poll IDs, payload checksum, source vintage) and never overwrite old snapshots; build deduplication using stable provider poll ID and raw timestamp where provided. Keep polling data distinct from weighted aggregator averages.
5. Never feed a single poll directly into G15, Silver, RCP, or the national model as an independent aggregator average. Any computation of averages/weights is a separate, named, validated analytical rule.
6. Offline fallback: show previously saved snapshots with visibly labelled vintage. Never present cached/stale results as newly retrieved data.
7. Add tests for IPC validation, URL/host restrictions, stale cache, malformed payload, unknown new poll type, export attribution, CSV formula injection and duplicate import. Check all five live endpoints **when network access permits**. Log the status without inventing passing results.
8. Build and **launch-test** packaged Windows NSIS and Linux AppImage per main plan. No user-side Node/Python installation. Release only after actual functionality and hostile QA gates pass.

## 4. Source distinctions
VoteHub exposes **individual surveys** and their metadata. It does not automatically provide the **published aggregated averages of Silver Bulletin, RCP, DDHQ, FiftyPlusOne or Race to the WH**. Do not label VoteHub poll records as those providers' independent data series. A single poll reused by multiple sites must not be double counted.

## 5. Verification performed
- `node --experimental-strip-types --test tests/unit/votehub.test.mjs` → **5 passed, 0 failed** using synthetic mocked responses.
- `tsc --noEmit --target es2022 --lib es2022,dom --module nodenext --moduleResolution nodenext packages/connectors/src/votehub.ts` → **passed** locally.
- **Not run / unverified:** actual live API response, Windows and Linux installers, GUI integration, user workflow, hardware launch.

## 6. Source/public repository safeguards
- This repo is PUBLIC. Do not copy the private Drive OSINT v3 simulator or its sensitive/unlicensed underlying data, spreadsheets or private IDs into GitHub.
- Synthetic fixtures only in code. Licensed VoteHub poll responses should be collected on user's machine and stored locally with attribution.
- No telemetry, paid tools, accounts, API keys, or private personal information is required for VoteHub.
