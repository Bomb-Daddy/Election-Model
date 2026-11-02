# Election Model — User Requirements

**Version:** 1.01  
**Added:** 2026-11-02  
**Updated:** 2026-11-02  
**Prior version:** [v1.00 archive](docs/archives/USER_REQUIREMENTS_v1.00.md)  
**Status:** Active / mandatory  
**Repository:** Election-Model

## UR-QA-001 — Complete coverage of all testable User Acceptance (UA) requirements in every QA check

**User instruction (2026-11-02):** "A full QA check of all testable UA requirements is required in a QA check."

### Mandatory requirement

Every QA run (including regular QA, hostile QA, regression QA, integration QA, data-quality QA, front-end QA, model QA, and release-candidate QA) **MUST evaluate every currently applicable, testable user-acceptance requirement**. Testing a convenient subset is insufficient to declare a **full QA pass**.

### Required procedure

1. **Read requirements before testing.** Obtain the latest approved, versioned user requirements and changes from current project documents or instructions. Do not omit a requirement solely because it is absent from a particular test script.
2. **Build a complete, bidirectional traceability matrix** that identifies each applicable requirement ID, its acceptance criteria, corresponding function/data flow/interface/report, test case(s), environment/build/data snapshot, expected result, observed result, status, and evidence.
3. **Execute every testable requirement** in the actual target environment. Use executable checks for code, model computations, ingestion pipelines, persistence, exports, data lineage, calculations and UI interactions; use direct interface tests for user-facing functionality. Source inspection, a screenshot, passing unit tests, or a claimed prior QA pass alone do not substitute for actual functional verification when executable testing is possible.
4. **Include positive, negative, boundary, error-handling, regression, and relevant end-to-end cases.** For election-data models specifically, check input validity, source/date provenance, denominators, disjoint cohorts, sum/accounting identities, double-counting, missing data, API and CSV failure paths, scenario sensitivity, and reproducibility.
5. **Report a status for every applicable requirement:** PASS, FAIL, NOT TESTED, or NOT APPLICABLE, with reasons and evidence. Mark NOT TESTED if access, missing source data, unavailable equipment, or an incomplete implementation prevents a real test. NOT APPLICABLE requires a documented reason.
6. **Be explicit about incomplete coverage.** If any applicable, testable UA requirement is FAIL or NOT TESTED, QA status is **INCOMPLETE/FAIL**, not a full pass. Do not report "100% QA passed," "fully tested," or "ready" without evidence covering 100% of applicable testable UA requirements.
7. **Retest after fixes and material changes.** Rerun the affected tests plus necessary regression and end-to-end cases against the actual new version, and record results against that version. Do not reuse results from a prior build as proof of the current build.

### QA report acceptance criteria

A QA report is complete only when it includes:
- Exact project/build/version and data snapshot tested;
- The current requirements version and complete applicable requirement inventory;
- Requirement-to-test coverage matrix with observed outcomes and evidence;
- A defect list, unresolved issues, exclusions and environment/access limitations;
- Counts of PASS, FAIL, NOT TESTED and NOT APPLICABLE plus coverage percentage;
- An unambiguous overall result, accurately distinguishing **full QA pass** from **partial testing**.

### Example enforcement

A Michigan turnout/polling-model QA pass **must** test all applicable user acceptance requirements for turnout assumptions, early-vote inputs, polling ingestion, model arithmetic and calibration, vote-share projections/scenarios, source metadata, CSV export, and user-facing controls. It is not acceptable to test only the arithmetic and present that as full-project QA.

### Change control

This requirement remains mandatory in every later requirements version. A subsequent revision may expand requirements and tests but cannot silently remove this universal coverage requirement. Historic QA reports are not retroactively upgraded by this addition.

---

## UR-COST-001 — No added costs, subscriptions or billed services

**Mandatory:** This project and its VoteHub polling integration must incur **$0 in additional costs**. Do not activate paid APIs, FiftyPlusOne subscriptions, billable cloud or hosting, pay-per-call services, paid GitHub features, AI inference fees, paid trials, or request a credit card. Use permitted free feeds, local computation/storage and optional manual imports. If a provider requires payment, show that integration as unavailable rather than circumventing restrictions or incurring a charge.

**Acceptance:** Full service/dependency and network review finds no required paid service, billing credential, metered charge or unintended cloud deployment. No user purchase or subscription is necessary to run the locally installed application.

## UR-SRC-001 — Maintain six distinct polling data sources

The front end must list and distinguish these sources:
1. **Silver Bulletin (Nate Silver):** published polling averages.
2. **RealClearPolling (RCP):** published polling averages and poll tables.
3. **FiftyPlusOne:** published averages; do not pay for its API or subscribe.
4. **Decision Desk HQ (DDHQ):** published polling averages and free, permitted data.
5. **Race to the WH:** polling and model outputs when publicly and lawfully accessible.
6. **VoteHub:** individual poll observations accessed using its free API, **not** an additional published average.

**Acceptance:** Each provider has its own identity, published source link, geographic/election coverage, dated source status, cost/license status and working acquisition method where authorized. Mark missing automated feeds as unavailable with optional permitted local import, rather than claiming the API exists or silently using a paid feed. No raw poll should be double counted as an independent aggregate.

## UR-API-001 — Integrate VoteHub directly, without manual API setup

- Build the free VoteHub REST connector directly into the **Electron desktop application**, running in its trusted main process behind validated read-only IPC.
- The user must not need to open API documentation, type queries, copy API code, obtain an API key, run a terminal, or manually download polls.
- Support the five documented operations: GET /polls, GET /polls/{poll_id}, GET /pollsters, GET /subjects, and GET /poll-types.
- Official documentation: https://votehub.com/polls/api/ ; API base: https://api.votehub.com ; CC BY 4.0 attribution: https://creativecommons.org/licenses/by/4.0/.
- A working connector module exists at [VoteHub TypeScript connector](packages/connectors/src/votehub.ts). The full implementation instructions are [VoteHub integration v1.00](docs/plans/VOTEHUB_INTEGRATION_v1.00.md), [agent issue #2](https://github.com/Bomb-Daddy/Election-Model/issues/2) and the main build plan.

**Acceptance:** Live retrieval of the five documented endpoints succeeds when the provider is available; failures, rate limits and schema changes are reported accurately. Synthetic/mock-only tests are insufficient to declare live integration complete.

## UR-API-002 — All polling categories by default

**Mandatory:** VoteHub data acquisition must default to **ALL polling types**, with no generic-ballot filter. Never narrow the source to generic ballot unless the user specifically selects that filter.

- Discover available polling types dynamically instead of hardcoding an exhaustive list.
- Retain any offered House, Senate, governor, presidential, approval, generic-ballot and new/unrecognized categories; do not claim categories that VoteHub does not actually publish.
- Allow optional filters for polling type, pollster, subject, dates, sample size and voter population where the provider supports them. Blank filters impose no restriction.
- Preserve provider poll IDs, raw fields and exact polling category labels.

**Acceptance:** Default request has no poll_type parameter. Integration tests prove multiple distinct types are retained and an unfamiliar new type is not dropped.

## UR-UI-001 — Complete, easy-to-use Poll Explorer

- Integrate a **Poll Explorer** into the existing graphical Election Analysis Workbench. Include All Poll Types default, optional filtering, poll detail, source links, manual Refresh, last successful retrieval and clear stale/offline/error states.
- Every displayed control and menu button must work, or be deliberately disabled with a meaningful explanation/help text.
- Deliver one-click Windows 11 x64 and Linux x86_64 packages as required by the authoritative project plan, with no separate Node/Python/developer-tool installation or paid account.
- Do not replace the planned desktop workbench with an unrelated web mockup, or overwrite existing national OSINT, Michigan or G15 scenario logic.

**Acceptance:** Actual installed Windows and Linux desktop launches complete a functional end-user walkthrough of all Poll Explorer actions. Code-only delivery or mocked tests are not release proof.

## UR-DATA-001 — Source provenance and immutable historical datasets

- Save each explicit import as a **new immutable local data snapshot** with source name and URL, retrieved time, provider-vintage fields, raw poll identifiers, checksum, source licensing and errors/warnings.
- Dedupe repeat polls; preserve snapshots and permit comparison/exports with correct CC BY 4.0 attribution and visibly dated data.
- Never treat cached/stale responses as newly fetched data.
- Keep **VoteHub individual polls** distinct from provider **published aggregate averages**. Do not average averages together as if they were independent samples or treat one poll as a full average.
- Do not silently change existing effective generic ballot/G15 adjustments, turnout, R abstention/crossover and third-party parameters, historical results, formulas or denominator assumptions.
- Any new independently computed polling average must have an explicit reproducible calculation, provenance, population, weights and quality assessment.

**Acceptance:** Repeat imports don't duplicate evidence; older snapshots are intact; source category, freshness and license are clear; existing scenario results remain unchanged unless the user explicitly selects a new source or edits parameters.

## UR-SEC-001 — Security, local-first behavior and no private data leaks

- Network access is restricted to the legitimate polling provider, with validated inputs and API responses and read-only secure IPC. No open internet proxy, remote code execution, automatic paid processing or unsolicited background polling.
- The application remains usable offline with saved snapshots, clearly identifying older data.
- The public GitHub repository must not contain private Google Drive datasets, personal voter records, secrets, private tokens or unlicensed/restricted poll datasets.
- Validate exports against CSV/formula injection and safely handle malformed, oversized or unavailable upstream data.

**Acceptance:** Negative, error, privacy and offline tests pass in the packaged application.

## UR-QA-002 — VoteHub and $0 requirements are mandatory in full QA

This adds to, and never weakens, **UR-QA-001**. Every applicable full QA run must include tests covering UR-COST-001, UR-SRC-001, UR-API-001, UR-API-002, UR-UI-001, UR-DATA-001 and UR-SEC-001.

**Acceptance:** The QA traceability matrix covers every testable requirement with PASS, FAIL, NOT TESTED or NOT APPLICABLE and evidence. It includes paid-dependency checks, unrestricted/multi-type polling, new categories, network failures/timeouts, caching, duplicates, attribution, privacy, offline mode, all UI buttons and actual packaged Windows/Linux launch. If applicable live/GUI tests are not executed, the overall full QA status remains INCOMPLETE, even if mocked unit tests pass.

---

## Version history and implementation status

| Version | Date | Changes |
|---|---|---|
| 1.00 | 2026-11-02 | Universal, exhaustive testable user-acceptance requirement coverage for every full QA pass |
| **1.01 (current)** | **2026-11-02** | Added $0 hard cost ceiling; all-category VoteHub integration; six-source polling registry; Poll Explorer; provenance, privacy, offline and QA acceptance criteria |

**Scope:** This is the authoritative current user-requirements file. Its predecessor is archived at [v1.00](docs/archives/USER_REQUIREMENTS_v1.00.md). [Election Analysis Workbench plan](docs/plans/ELECTION_ANALYSIS_WORKBENCH_PLAN_v1.00.md) remains the more detailed implementation specification; it may not override mandatory user requirements. The full project inventory must be reconciled with every additional approved requirement before claiming exhaustive project QA.

**Status as of revision:** VoteHub connector source and five synthetic/mocked unit tests are committed. **Live API verification, Electron UI integration and real installed Windows/Linux functionality are not yet verified complete.**
