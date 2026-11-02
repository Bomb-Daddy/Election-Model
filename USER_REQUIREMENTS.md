# Election Model — User Requirements

**Version:** 1.02  
**Added:** 2026-11-02  
**Updated:** 2026-11-02  
**Prior versions:** [v1.01](docs/archives/USER_REQUIREMENTS_v1.01.md), [v1.00](docs/archives/USER_REQUIREMENTS_v1.00.md)  
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

## UR-SRC-001 — Maintain seven tracked polling data sources (one provisionally identified)

The front end must list and distinguish these sources:
1. **Silver Bulletin (Nate Silver):** published polling averages.
2. **RealClearPolling (RCP):** published polling averages and poll tables.
3. **FiftyPlusOne:** published averages; do not pay for its API or subscribe.
4. **Decision Desk HQ (DDHQ):** published polling averages and free, permitted data.
5. **Race to the WH:** polling and model outputs when publicly and lawfully accessible.
6. **VoteHub:** individual poll observations accessed using its free API, **not** an additional published average.
7. **Voter** (provisional match: **AP The Voter Poll**): survey crosstabs/race-specific voter research; access requires provider-specific entitlement and cannot be assumed free. Do not enroll in paid service or attempt access without lawful permission. Provider identification remains subject to confirmation.

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
| 1.01 | 2026-11-02 | Added $0 hard cost ceiling; all-category VoteHub integration; six-source polling registry; Poll Explorer; provenance, privacy, offline and QA acceptance criteria |
| **1.02 (current)** | **2026-11-02** | Consolidated new political-research threads and provisional Voter API request; added RedBox/Marist/Silver and voter-method QA |

**Scope:** This is the authoritative current user-requirements file. Superseded versions are archived at [v1.01](docs/archives/USER_REQUIREMENTS_v1.01.md) and [v1.00](docs/archives/USER_REQUIREMENTS_v1.00.md). [Election Analysis Workbench plan](docs/plans/ELECTION_ANALYSIS_WORKBENCH_PLAN_v1.01.md) remains the more detailed implementation specification; it may not override mandatory user requirements. The full project inventory must be reconciled with every additional approved requirement before claiming exhaustive project QA.

**Status as of revision:** VoteHub connector source and five synthetic/mocked unit tests are committed. **Live API verification, Voter provider free entitlement, Electron UI integration and real installed Windows/Linux functionality are not yet verified complete.**


---

## UR-VOTER-001 — Voter data API in provider registry and integration pipeline

User requested a Voter API in addition to the existing VoteHub data API. **Provider identity is provisional.** The documented **Associated Press _The Voter Poll_** API is one plausible match; it is not VoteHub.

- The AP developer documentation defines a race list at \`GET /v3/voterpoll/{electionDate}\` and a \`/download\` response for entitled race survey crosstabs, and requires an AP API key plus Voter Poll subscriber entitlement. The API is **not demonstrated to be free**. Never auto-activate it or any subscription.
- Register this source as \`provider_unconfirmed / subscription_entitlement_required / not_active\` until the intended Voter provider and lawful zero-cost access can be established.
- If free authorized access is unavailable, provide an honestly disabled integration with a permitted user-owned/local crosstab import route; do not claim the Voter API is live or create a fake response.
- AP Voter Poll crosstabs are survey measurements of verified voters, distinct from published polling aggregator averages, early ballot administrative counts and modeled party affiliation. Preserve state, office, election date, survey population, published version/weightingID and preclose/postclose time gate where available.
- If user later identifies a different Voter API, amend this requirement and provider record without losing this integration request or the $0 limit.

**Acceptance:** Voter source appears with accurate identity/access status, no paid endpoint is invoked, and any imported authorized records retain survey-specific metadata, source status and provenance. Mock an entitlement denied response in QA; no fabricated success.

## UR-MI-001 — Original RedBox and historical exit-poll source preservation

- Support private/local byte-for-byte archival of original user-provided source files with SHA-256 manifests, **not publication to the public repository**. Derived files carry separate versions.
- Build dated source schemas for RedBox 2026 already-voted, not-yet-voted, all-likely and 2024 historical exit-poll sources. Never treat recall/planned votes, modeled early party affiliation or 2024 exit polls as actual November 2026 individual ballot tallies.
- Verify reported RedBox original 8,900 source rows, Q2/Q3 Senate and Q6/Q7 governor fields and status columns against originals when accessible, including unweighted sample size, effective n, source-provided single-share MOE, derived D–R uncertainty and rounding.
- The reported October 20–23 2026 RedBox already-voted subgroup (n=940 unweighted, effective n=280.1) must not silently represent every later early ballot cast by November 2. Cross-compare separate survey windows and target populations.

**Acceptance:** All source categories are distinct, sources and hashes are traceable, original-vs-derived data is clear, no inappropriate pooling, original survey values and historical years are tested. Unavailable originals remain NOT TESTED rather than invented.

## UR-MI-002 — Marist joint reconstruction, demographics and voting-method transition

- Reconstruct Michigan party × age × voting-method × candidate marginals from October 15–18 Marist with constrained/IPF calculations; label the full joint table **unobserved and assumption-dependent**.
- Do not double-count party and age effects. Verify source marginals within explicitly stated tolerance and run alternative assumption sensitivities.
- Reject any scenario where the modeled final early 65+ count is below the already-recorded November 2 65+ count; document the observed reported 55% early 65+ share and any assumed 35% all-voter or 40% late-early senior share as **not empirically established**.
- Model Michigan 2024 introduction of statewide early in-person voting and first 2026 midterm with that mode. Voting-method changes do not themselves prove additional turnout or a partisan swing.

**Acceptance:** Constraint-negative test fails correctly; marginals/conservation pass arithmetic tests; unobserved joint distributions are not reported as observed; 2024 and 2026 voting methods are separately dated.

## UR-MI-003 — Separate Silver calibration, RedBox conditional identities and GOP stress assumptions

- Keep the November 2 Silver Bulletin reported Senate D49.9/R45.2 and governor D51.8/R42.4 as **secondary-transcribed polling averages**, not vote results or independently validated original poll microdata.
- Show **Marist/IPF structure** and **RedBox-conditional early support** as distinct analytical series, with explicit same-day source vintage, temporal and survey-sample uncertainty.
- Any statewide Silver recentering exactly matches the statewide source margin **by construction**; this is numerical consistency, not external validation.
- Preserve user-defined 5% Republican original-cohort crossover and 10% nonvoting as mutually exclusive conditional groups. Do not append them blindly as additional effects to poll averages that may already reflect vote switching.
- Show election-day recovery thresholds, turnover method assumptions and turnout sensitivity as arithmetic hypotheticals, never measured election-night results or validated win probabilities.

**Acceptance:** Silver normalization, candidate-response denominators, IPF recentering, distinct alternatives and scenario flow tested. 5/90 crossover adjustment and early ballot conservation must be golden-vector tests.

## UR-PR-001 — Prediction Register and distinct model output layers

- Maintain a versioned prediction/evidence ledger with original prediction date, target date/window (including post-2028 pending entries), metric, source, assumptions, amendments and evaluation status.
- G15/effective generic ballot represents **poll starting environment plus participation/defection/third-party changes in an explicitly hypothetical two-party vote denominator**; it is not merely a static generic ballot average.
- Keep provider published polls, poll averages, modeled turnout, sensitivity results and official counted ballots as distinct typed records. Do not score pending predictions before their target event or fabricate outcome probabilities.

**Acceptance:** G15 and vote-flow cohorts are reproducible; no previously scheduled future PR is improperly resolved; different observation/assumption types are visible and cannot be silently combined.

## UR-QA-003 — Integrated full QA and latest source-research findings

UR-QA-001 remains mandatory. The complete testability matrix shall include **every requirement in this repository** and all testable provisions of Political OSINT User Requirements v1.02, using a namespaced ID mapping for collisions. In addition, test all UR-VOTER-001, UR-MI-001/002/003 and UR-PR-001 acceptance criteria.

Track historical reported RedBox calibration and independent consistency audit v1.03 checks as **source evidence only**, not proof that the new installed application passed. The reported 52/53 source assertions and 66 arithmetic results cannot replace current software testing.

**Acceptance:** Full matrix with PASS/FAIL/NOT TESTED/NOT APPLICABLE for each applicable testable item, counts, build identity, datasets, observed evidence and signed-off unresolved gates. Include real installed Windows/Linux GUI, free-cost and AP entitlement-denial QA. Anything incomplete means **PARTIAL/INCOMPLETE**, not fully released.
