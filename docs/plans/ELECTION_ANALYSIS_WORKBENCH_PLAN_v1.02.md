# Election Analysis Workbench — Integrated Build Plan v1.02

**Created:** 2026-11-02  
**Updated:** 2026-11-03  
**Prior version:** docs/archives/ELECTION_ANALYSIS_WORKBENCH_PLAN_v1.01.md (v1.00 archived separately)  
**Target repository:** Bomb-Daddy/Election-Model  
**Agent:** Claude Sonnet using Claude Code or equivalent software-building environment  
**Status:** Updated implementation specification. VoteHub connector files are committed; a finished desktop build, live API verification, and Windows/Linux launch tests are **not verified**.  
**Project type:** Local-first election data exploration, deterministic counterfactual scenario analysis, and hostile quality assurance.  
**Platforms:** Windows 11 x64 and Linux x86_64, CPU-only compatible.

---

## 1. Executive directive

Create a single, fully launchable, graphical desktop application called **Election Analysis Workbench**. It must import and manipulate data from two previously developed analytical systems without destroying their individual assumptions or data provenance:

1. **Michigan 2026 Turnout Model v2.03:** statewide registered/observed early ballots, absentee and early-in-person figures, historical turnout regression, age/gender/prior-election marginals, synthetic participation cohorts, Silver Bulletin polling averages, and Republican counterfactuals.
2. **National OSINT Effective Generic Ballot Model v3:** a national House/Senate geographic scenario framework, 2024 district baseline votes, 2026 race-poll evidence, generic-ballot starting conditions, Republican abstention and defection, additional Democratic participation, third-party flows, source vintages, and seat-count QA.
3. **Michigan–OSINT Integration Hostile QA v1.00:** the source of required denominator translation, double-counting protections, poll normalizations and previously discovered defects.

The application is an **analytical workbench**, not an election-persuasion tool, a fake prediction generator, or a static chart viewer. **The new sections 14–24 below extend the implementation and supersede conflicting older status/sequence statements.** It must clearly distinguish **observed data, survey measurements, model assumptions, hypothetical results and genuinely validated estimates**.

**Critical user experience:** The user downloads one package, installs or opens it via the graphical desktop, imports an existing data file, changes percentages in an understandable form, compares results, saves the scenario, and can reopen the exact same work. No terminal, Python, separate server or developer tooling.

## 2. Immutable requirements

- Produce and test a **Windows NSIS .exe installer** and **Linux AppImage**. Also build Linux .deb if feasible. Every package must include all application/runtime dependencies. On Windows, launch from Start; on Linux, launch from the graphical file manager/application menu. No separate Node/Python/SQL install.
- No "works in dev" or "build succeeded" substitute for installing/launching the real artifact on the stated OS.
- Run on a CPU-only laptop. Target Windows 11 x64 and representative mainstream Linux x86_64. Avoid GPU, cloud inference or per-query fees.
- Every displayed button, tab, menu item, input, reset, import, run, export, comparison, save and help function must actually work. Unavailable capabilities must be clearly disabled with explanatory text.
- All model inputs state their denominator, unit, vintage and evidence class. Do not use one unlabeled 5% slider for semantically different cohorts.
- Retain all existing model source material and original results as immutable references. Any repairs occur in new versioned app modules or adapted copies. Do not edit connected Google Sheets by default.
- Preserve user versioning: v1.00, v1.01, v1.02 and archive superseded plan versions. Application SemVer (0.1.0, 0.2.0, etc.) is separate.
- The GitHub repository is **public**. Do not upload private Drive exports/IDs, unauthorized copyrighted poll feeds, raw voter records, screenshots from access-restricted dashboards, user tokens, passwords or private keys. Source datasets should be imported locally with the user's authorization; CI should use synthetic or openly licensed fixtures.
- Never claim scenario output is a calibrated forecast or probability unless independent backtesting demonstrates it.
- Preserve source/claim traceability even when it makes the UI slightly more verbose.
- Keep a reproducible hostile QA log. Release is blocked by any unresolved critical accounting, security, packaging or core user-workflow failure.

## 3. Architecture decision

Use a TypeScript monorepo:

- **Electron** for Windows/Linux desktop shell and native OS file dialogs.
- **React + TypeScript + Vite** for responsive desktop UI.
- **Pure TypeScript calculation package** for deterministic models, formula translations and comparisons. Never put election math only in React components.
- **SQLite** database in the Electron main process, via a bundled native SQLite driver such as better-sqlite3. Rebuild native modules per Electron/runtime/OS. If a native driver proves unstable, use a tested bundled SQLite alternative without adding user dependencies.
- **Electron-builder stable v26** with Windows NSIS x64, Linux AppImage x64 and Linux DEB target. Pin tested exact tool versions and lockfile. Build natively on separate Linux and Windows CI runners.
- **Zod or equivalent typed schema validation** for imported data, IPC, scenario inputs and stored evidence.
- Charts may use a React chart package, but tables and readable text must remain primary.
- No background cloud service required for core functions. Network connectors are optional and must fail gracefully offline.

Recommended project layout:

    README.md
    CLAUDE.md
    CHANGELOG.md
    docs/plans/
    docs/archives/
    docs/architecture/
    docs/data-contracts/
    docs/qa/
    apps/desktop/electron/
    apps/desktop/src/
    packages/core/
    packages/storage/
    packages/importers/
    packages/connectors/
    packages/fixtures/
    tests/unit/
    tests/integration/
    tests/e2e/
    .github/workflows/

**Process architecture:** Renderer sees only explicitly exposed narrow IPC APIs through a preload bridge. Main process owns SQLite, filesystem, OS dialogs, OAuth and logging. No Node integration in renderer; enable context isolation, sandbox and restrictive Content Security Policy. Validate all IPC sender/origin and request schemas. Never execute imported HTML, macros or remotely supplied JavaScript.

## 4. What already exists (reference inventory)

### Michigan v2.03

Existing local source bundle from prior project work, not present automatically in public GitHub. Contains model.py, Silver calibration logic, hostile_qa.py, input CSVs, README and JSON outputs. The November 2, 2026 recorded early-vote snapshot is:

| Measure | Value | Classification |
|---|---:|---|
| Returned absentee ballots | 1,569,715 | Observed snapshot |
| Early in-person ballots | 743,450 | Observed snapshot |
| **Recorded early total** | **2,313,165** | Observed snapshot |
| Final statewide turnout working estimate | 5,002,698 | Unvalidated heuristic model |
| Estimated still-future participants in baseline | 2,689,533 | Derived model difference |
| Reported early age 65+ share | 55% | Rounded early-voter marginal |
| Reported early women share | 56% | Rounded early-voter marginal |
| Early voters with recorded participation in both 2022 and 2024 | 83% | Rounded early-voter marginal |
| TargetSmart early modeled R share | 39% | Early-voter affinity estimate only |

Interpretation restrictions:
- The 55% age-65+ and 39% modeled R are separate *marginals*; do NOT invent their intersection.
- Michigan does not register by political party. Affiliation is modeled and not a record of candidate votes.
- The 83% previous-two-elections history only applies to already recorded early voters; it is not a statewide turnout probability.
- Approximately 5M turnout is a judgment-weighted/blended heuristic with substantial unknown cohort assumptions; a 2022 one-step OLS test had approximately 6.72% error, **not** an independent backtest of the combined model.
- EAVS 2022 absentee returned and Michigan post-election 2022 absentee cast counts differ in coverage/definition; never equate these without source reconciliation.

### OSINT national v3

Existing native Google Sheets has tabs: Controls, House, Senate, By State, Methodology. Companion standalone HTML and Excel version exist in the user's private Drive. Base 2026 generic input in frozen Oct 29 On Point snapshot is D+9.9; model's published race-poll weight default 50% is **illustrative, not empirically calibrated**. National geographic prior uses 435 2024 presidential district two-party vote records in 2026 boundaries; it does NOT automatically represent 2026 down-ballot turnout.

Critical prior QA findings: signed-margin import polarity, exact zero/tie discrepancy, current-holder vs candidate labels, independent case CA-03 and CA-06, Nebraska Senate independent vs Republican, Vermont governor holder party, source vintage and denominator mismatch, and lack of calibrated poll-reliability weights.

**Confirmed current workbook defect:** Controls!B16 input-validation formula checks Democratic third-party parameter B9 >= 0 but omits B9 <= 100. App must reject invalid 200% input and cover this in negative tests. Do not silently "fix" the original live user Sheet; fix app validator or an explicitly approved copy.

### Silver Bulletin snapshots

Historical secondary-recorded Nov 2 polling candidate shares:
- Michigan U.S. Senate: D 49.9%, R 45.2%, other/undecided 4.9%.
- Michigan Governor: D 51.8%, R 42.4%, other/undecided 5.8%.

They are **all-response polling averages**. They are not official vote counts, not validated future forecasts, and not verified live API responses. Confirm original source vintage/provenance before treating as production-grade updated observations. Preserve a source flag for secondary transcription. Silver generic national average and On Point generic baseline must not be treated as the same measure/vintage or averaged as independent polls.

### Import guidance to Claude

Private model bundles are NOT in this newly initialized public repository. Do not assume Claude has them. Implement source import contracts and use an explicitly labeled synthetic fixture until model bundles are supplied by authorized local user import or an authenticated Drive connector. Avoid public GitHub commits containing private Drive source identifiers. Never invent data to make a model pass.

## 5. Canonical data model

Design SQLite tables and TS types with migrations and tests:

**Project:** project ID, local path, schema version, created/modified, active scenario, settings version.

**EvidenceSource:** source ID, organization, public URL if permitted, access/license classification, source version, expected reporting population, data collection method.

**EvidenceSnapshot:** immutable ID, source ID, reference election date, observed_at, published_at, retrieved_at, geographic scope, population denominator, sha256 of imported bytes, transformation version, original filename stored privately/local only, parser warnings.

**EvidenceRecord:** snapshot ID, race/geography key, measure name, numerator, denominator, value, unit, confidence/status, evidence class (OBSERVED, POLL_AVERAGE, ASSUMPTION, SCENARIO, VALIDATED_FORECAST), missingness code and notes.

**Race/Candidate:** election date, office, geography, ballot method, verified candidate IDs and parties, current seat holder, caucus, ballot qualification status, unresolved status. Holder and candidate cannot be the same field. Independents and multi-candidate races must remain representable.

**ScenarioVersion:** ID, parent ID, timestamp, source snapshot IDs, engine version, value of each parameter *with units and denominators*, abstention mode, warnings, result digest and QA result. Scenario edit creates a new version; never silently rewrites a prior scenario.

**ImportBatch:** source file, rows scanned/accepted/rejected, warnings, checksums, timestamp, rollback status. Transactional rollback required.

**QARun/QAFinding:** exact executable check, severity, data/model/version, expected/actual, reproduction, status and evidence artifacts.

**Backups/Migrations:** explicit schema version, WAL where appropriate, transactional migrations, backup verification and interrupted-upgrade recovery. App settings and external credential metadata separated from project data.

No individual person-level voter-file data ingestion is required or encouraged in v1; model aggregate cohorts only.

## 6. Pure calculation engine — mathematical specification

### 6.1 Canonical Republican example

The user's intended rule refers to the **original potential Republican voting cohort**, not Republicans who remained after abstaining:

- 10% of original potential R voters do not vote.
- 5% of original potential R voters instead vote for the Democrat.
- 85% of original potential R voters vote for the Republican.

These mutually exclusive outcomes sum to 100%. Per 1,000,000 potential Republicans: 100,000 nonvoters, 50,000 crossovers and 850,000 Republican votes.

The national OSINT calculation convention differs: crossover is a percentage of **participating Republicans remaining after abstention**. Convert automatically before applying OSINT formula:

    post_abstention_crossover = 5% / (1 - 10%) = 5.5555555556%

Directly putting 5% in OSINT's post-abstention parameter would yield only 45,000 D crossovers per million and 855,000 Republican votes. That difference is a mandatory golden-vector regression test.

Validate 0 <= abstention <= 100, 0 <= original crossover <= 100 - abstention, including the extreme no-participants condition. No negative fractions, no silent clamping, no unit-free slider storage. Support original-cohort and participating-cohort views with clear labels, but never change intended meaning by toggling the UI.

### 6.2 Three mutually exclusive abstention interpretations

Mode A — **Embedded in baseline** (default): existing Michigan modeled 5,002,698 already represents eventual participation; user's 10% is a hypothetical explanation of the electorate, not an additional ballot subtraction.

Mode B — **Incremental stay-home stress**: the additional 10% no-show is truly beyond the turnout already expected in baseline. Subtract only from the modeled *not-yet-recorded future R-aligned pool*. Never delete 2,313,165 already recorded Michigan ballots; no double application.

Illustrative input: future pool 5,002,698 - 2,313,165 = 2,689,533. If 39% of this hypothetical pool is R-aligned and an additional 10% stays home, about 104,892 more nonvoters; conditional total about 4,897,806. The 39% is observed among **early** voters, not observed future voters, so label as assumption.

Mode C — **Contest undervote**: person votes in election but skips a specific race. The statewide turnout remains unchanged; only contest valid-vote total and shares change.

UI must force user to select/understand mode and must explain when scenario totals change.

### 6.3 National cohort flow equations

Let g be national initial D-R two-party percentage-point margin and let parameter fractions be typed and within [0,1]:

    D0 = (100 + g) / 2
    R0 = (100 - g) / 2
    D_active = D0 * (1 + extra_D_turnout)
    R_active = R0 * (1 - R_abstention)
    D_votes = D_active * (1 - D_to_third) + R_active * R_to_D_post
    R_votes = R_active * (1 - R_to_D_post - R_to_third_post)
    Third = D_active * D_to_third + R_active * R_to_third_post
    effective_DR_2P = 100 * (D_votes - R_votes) / (D_votes + R_votes)

Reject zero D+R denominator; conserve every category and allow 3rd-party flows without assuming they are votes for a single candidate. The effective margin here is a deterministic hypothetical calculated from chosen starting conditions; PR-002's D+15 threshold refers to **certified future national House two-party votes**, not survey generic-ballot polling.

### 6.4 Silver candidate shares and two-party margins

Do not convert all-response candidate-support percentages by subtraction alone. Store originals and a separately normalized two-party comparator:

    two_party_DR = 100 * (D_share - R_share) / (D_share + R_share)

- Senate: (49.9 - 45.2)/(49.9 + 45.2)*100 ≈ D+4.9422 two-party points; raw D-R is +4.7 of all responses.
- Governor: (51.8 - 42.4)/(51.8 + 42.4)*100 ≈ D+9.9788 two-party points; raw D-R is +9.4 of all responses.

Keep other/undecided separate. Never apply an extra 5% crossover to Silver toplines as though polling did not already include unspecified crossovers. An actual calibrated candidate-vote adjustment requires a comparable party-specific survey or an explicitly labeled counterfactual.

### 6.5 Michigan turnout and geographic weighting

Michigan engine returns statewide observed early counts, model-derived final turnout, plausible method split, sensitivity, cohort marginal diagnostics and explicit assumption flags. National engine uses district-level historical weights and race labels. They connect through typed evidence/snapshot/scenario adapters, not by multiplying 5M total across Michigan's 13 House districts.

Until real geographic crosswalks and 2026 district turnout are authorized/available, the Michigan module must show state-specific turnout *next to* national scenarios but not silently recalibrate district results. Missing county/precinct and 2026 turnout denominator must be visible in the model.

### 6.6 Source-vintage controls

Every scenario pins exact observations and a polling benchmark by date. Frozen On Point Oct 29 D+9.9 and Silver Nov 2 Michigan shares can coexist as separate inputs only if the user understands their different geography/measurement. Do not blend aggregator averages as independent samples. Changes in a source snapshot do not automatically change previously saved scenario outputs.

## 7. Application UI — detailed functional contract

### Welcome / project manager
- New project, Open existing, Recent projects, Import source, Example project, Help, Settings, Exit.
- All functions work; no sign-in needed to access example/offline project.
- Visible "sample/synthetic data" labeling when using demo.

### Dashboard
- Date/time and geography filters, observed-count cards, source-vintage status, current scenario, last recalculation, QA health and unresolved limitations.
- Clicking an observed/model number opens its evidence/provenance panel.
- Do not mix source counts with estimated totals in same visual style without labels.

### Source library and import
- Buttons: Add CSV, Add XLSX, Add JSON, Connect Google Sheets (optional), Refresh, View source, View mappings, Remove snapshot, Export.
- Import preview table, matching candidate/header mapping, unit/denominator confirmation, percentage source, timestamp selection, duplicate detection, checksum, errors and transactional Commit/Cancel.
- Support date parse errors, mixed encodings, empty rows/sheets, nonnumeric percentage and corrupted files safely.

### Michigan tab
- Observed early counts by voting method; age/gender/history *marginal* tables; affiliation model and warning; turnout assumptions; conditional stress table; polling benchmark panel; source-diff snapshots.
- Never show age-by-party crosstab unless actual joint source exists.

### National OSINT tab
- Search/filter 435 House district keys, Senate races and governors where authoritative metadata exists. Snapshot/score status, source date, baseline 2024 D-R, observed 2026 poll where available, scenario calculation.
- Explicit independently held/independent candidate, incomplete or unresolved flag; do not turn a mathematical positive margin into a definite partisan seat.

### Model Lab
- Named baseline and dated snapshots; editable parameters with slider AND numeric input, percent unit, denominator description and on-hover help.
- Abstention mode toggle: embedded/incremental/undervote. Explicit third-party options, reset all, save as version, duplicate, compare, export scenario.
- Invariance checks run on each evaluation. Error state blocks result display for invalid inputs.
- A small example "out of 100 Republicans" allocation responds coherently to percentages and never substitutes for actual election outcome forecasts.

### Compare
- Baseline and up to two versions side by side. Difference decomposition: source-vintage changed; abstention changed; crossover changed; poll weight changed; denominator changed.
- Separate columns for raw all-response polling, normalized 2P hypothetical, modeled statewide turnout, electoral participation and unscored races.
- Charts are supplementary, with tabular equivalent and definitions.

### Hostile QA Center
- Run QA, View last run, Details/reproduce, Export QA results, Regression examples. Show passed/failed/skipped with exact date and engine version. No decorative green check when something was not executed.

### Settings and Help
- Local data path, user backup/export/delete, automatic backup toggle, source cache age, Google status (when connected), credential removal, application version, keyboard shortcuts, contrast/accessibility controls.
- Every button has help tooltip and accessible name. No user should need to know Google Sheet cell positions to operate the app.

Target 1366x768 and 1920x1080; test keyboard navigation, scrolling, focus, high-contrast and light/dark mode. Usable without GPU.

## 8. Authentication, permissions and licensing

v1 must work offline without signing into any external account. Google Sheets integration is an optional next milestone:

- Desktop OAuth 2.0 using system browser, authorization-code flow and PKCE, restrictive/readonly scopes, state validation and exact redirect handling. Never embed a WebView credential prompt.
- Store refresh tokens only in an adequately secure OS credential facility (e.g. OS-protected Electron safeStorage where actually secure). If reliable secure storage is unavailable, require sign-in again on next launch rather than fall back to plaintext.
- Provide Connect, Reconnect, Disconnect, Access status, Select Sheet and Preview Changes. No write access to the user's original Google Sheets in initial app.
- Public client ID may be configured as build-time public metadata; no client secrets or refresh tokens in repository.
- Paid/restricted TargetSmart or Silver Bulletin feeds may not have authorized desktop APIs. Implement manual import first; do not promise automated access or scrape around access controls.
- No default telemetry or background network updates; user controls refresh operations. Clearly explain offline cache freshness.

## 9. Hostile QA testing matrix and known defects

### Deterministic core
- No changes => identity calculation.
- 10%/5% original Republican potential cohort -> per million 100k absent, 50k D crossover, 850k R.
- 5/90 denominator adapter => exact same allocation after conversion, not 45k/855k.
- 0%, 100%, zero surviving population, crossover+third above 100, negative/NaN/Infinity/blank/unparseable inputs.
- All-response vs two-party margins as above.
- 1,569,715 + 743,450 = 2,313,165 exactly; observed totals immutable under scenarios.
- If early recorded > final model turnout => explicit invalid scenario.
- Stay-home mode reduces future participation only; contest undervote mode leaves statewide participation fixed.
- D/R and third-party vote conservation and positive denominator.
- Signed R+X poll becomes negative D-R; exact tie and near-zero tolerance 0.01 percentage point; no floating precision seat flip.

### Previous OSINT defects as regression fixtures
- Democrat vs Republican signed source labels on all imported polls.
- Separate current holder, ballot candidate, candidate party, independent and caucus. CA-03/CA-06 and Nebraska Senate special candidate shapes remain unscored unless accurately matched.
- Correct Vermont governor holder party in the dated roster.
- Robust exact-zero handling (previous NC-13 inconsistent classification in HTML and Sheet).
- House 435 unique keys; no double counts, no fake legislative races from mere seat-slot inventory.
- Reject Democratic third-party 200% input; old Google Sheet validation missed B9<=100.
- Source poll counts, names, stale vintages and unverified candidates marked missing, not fabricated.
- Published polling average cannot be misrepresented as a forecast or independent raw poll.

### Security, import and persistence
- Malicious CSV formula injection is escaped in exports; protect against XLSX external links, macros, zip bombs, malformed dates, giant rows, unsupported encoding and duplicate import.
- No arbitrary process/file access exposed to renderer. Reject unexpected IPC.
- OAuth denied/expired/invalid-state callback and offline modes.
- DB import interrupted: transactional rollback; schema migration with backup; save-close-reopen hash equality.
- No private source path, tokens, poll-data license material or voter records in logs, crash dumps, project export or public artifacts.

### End-user acceptance walkthrough
1. Download both Windows and Linux packages from GitHub Releases.
2. On a clean machine, install/open without developer dependencies.
3. Open sample project. Load/inspect source provenance.
4. Import JSON/CSV/XLSX data via graphical picker and map columns.
5. Set Republican original-cohort no-show 10% and crossover 5%, verify 85/5/10 example.
6. Toggle embedded vs incremental vs undervote; observe correct impact on statewide turnout.
7. View Silver polling shares and normalized 2P difference separately.
8. Open Michigan, national, select two scenarios and compare.
9. Save, close, reopen, verify data/scenario persistence and reproducible results.
10. Run QA, read failures, export CSV/JSON report, restore baseline and create backup.
11. Uninstall/reinstall and verify documented user-data preservation/removal options.

Package build tests must include a real launch with logs/screenshots on each OS. GitHub build success ≠ executed GUI acceptance pass. Windows signing/SmartScreen status, Linux AppImage execute bit/FUSE compatibility and alternative package path are documented accurately.

### Minimum release gate
- Zero unresolved critical/blocker failures in security, bookkeeping, critical UI actions, import, persistence or installer runtime.
- Real Windows 11 and representative Linux installation/launch tests have passed.
- Formula golden vectors and previous known defect cases pass in bundled software.
- Data provenance, denominator, third-party and scenario/forecast labels are intact.
- Normalized storage/export and restore audited.
- Complete dated QA report, software version, commit SHA, artifact checksums and known-limitations report attached.
- All release downloads must be real; do not publish fictional asset links.

## 10. Delivery phases and required exit evidence

**P0 — Discovery and contract lock**
- Inventory authorized existing sources; source version/date checksums and access restrictions. Define JSON/CSV input contracts, fixture policies, full acceptance tests.
- Output: docs/data-contracts and source registry; issue list; initial golden-vector QA suite.
- Exit: no hidden source assumption; public repo contains no private files.

**P1 — Earliest possible genuinely installable vertical slice**
- Scaffold monorepo and Electron/React shell, local SQLite open/migrate, New/Open Project screen, file picker, app log and help.
- Configure Windows NSIS and Linux AppImage/DEB CI early, not at the end. Attach actual test logs from packaged launch.
- Exit: both OS packages install/launch, simple project survives restart; no developer dependencies on user hardware.

**P2 — Evidence store/import pipeline**
- Implement transactional CSV/JSON/XLSX import, staging/preview, validation, source vintages, snapshot hashes, diffing and export/backup.
- Exit: corrupted/duplicate/out-of-order inputs handled; all rows accounted; persistence recovery and privacy QA pass.

**P3 — Michigan engine and UI**
- Port available Python Michigan v2.03 formulas to TypeScript without changing meaning; Python frozen results are golden vectors.
- Show observed early-voter marginals, historical estimator, model-wide assumptions, stress cases, Silver candidate percentage conversion.
- Exit: exact observed conservation, documented numerical tolerances, zero double counted no-show, no fictitious age-party cells.

**P4 — National OSINT engine and UI**
- Port cohort flow and historical district/poll source importer; independent candidate and tie cases; source vintage selection.
- Exit: reproduce core v3 scenario formulas on frozen inputs, verify 435 unique House keys and all exclusions. Old candidate/party classification bugs have regression coverage.

**P5 — Integration and reusable scenarios**
- Typed denominator adapter, abstention modes, comparison engine, versioned scenario saves, QA center and report export.
- Exit: reproduce previous 21 adapter QA diagnostics plus additional edge tests; same source + same assumptions => same output on Linux/Windows.

**P6 — Read-only Google Sheets connector (optional for offline MVP)**
- OAuth with PKCE, secure OS token storage, select/preview/import, reconnect/disconnect, offline status.
- Exit: explicitly authorized read verified; no source Sheet writes or secret leaks. If credential setup unavailable, clearly mark this as an optional blocked connector, without blocking offline package release.

**P7 — Final hostile QA and deliverables**
- Full end-to-end user playflow, clean OS installation and runtime tests, backup/restore, error handling, performance test, cross-platform golden vectors.
- GitHub Releases: tested installer, AppImage, DEB if working, SHA256 hashes, version, release notes and limitations.
- Exit: all non-negotiable gates satisfied; detailed build evidence archived.

## 11. Claude Sonnet execution instructions and checkpoints

Start by reading CLAUDE.md and this complete plan. Work in milestones, but **implement actual code**: do not produce another conceptual-only handoff and stop.

First coding iteration:
1. Create packages/core with typed inputs and a golden-vector test proving 10%/5% denominator semantics and no double-counting.
2. Establish desktop app shell and IPC with strict security.
3. Add SQLite migrations, sample project, file picker and persistent storage.
4. Build the first OS installers early; obtain real launch evidence.
5. Then expand importers, Michigan and national calculations, screens and QA suites.

At the end of each iteration provide: files changed, commit SHA, exact commands run, pass/fail/skipped test counts, which real platform(s) were launched, unresolved blockers, next precise task. Run adversarial QA after each functionality pass, fix defects before claiming completion. Use synthetic/public fixtures in source control; do not invent unavailable private data. Where a source permission blocks a task, write a working import mechanism and document precise acquisition requirements.

Success is defined by **a human user being able to operate the complete application with real data on Linux and Windows**, not by prose or screenshots.

## 12. Versioning and change-control policy

- Plans: v1.00 to v1.01 etc with version history, preserved archive copies; no overwrite without archived predecessor.
- Data: every import generates immutable source snapshot ID; no mutation of a prior observed record; changes have hashes and timestamps.
- Scenarios: immutable saved version chain; source-vintage pin, model-engine version, explicit assumptions and result digest. Export produces reproducible manifest.
- Code: SemVer, changelog and GitHub commits. Build/release artifact must match its commit.
- QA: test result date, scenario, platform, executable version, fixtures, pass/fail/skip counts and known data limitations.
- Source repairs: never silently rewrite historical OSINT spreadsheets or Michigan source archives.

## 13. Public implementation documentation

- Electron security: https://www.electronjs.org/docs/latest/tutorial/security/
- Electron packaging: https://www.electronjs.org/docs/latest/tutorial/tutorial-packaging
- electron-builder v26 targets: https://www.electron.build/v26/docs/targets/
- electron-builder v26 AppImage: https://www.electron.build/v26/docs/appimage/
- Google desktop OAuth/PKCE guidance: https://developers.google.com/identity/protocols/oauth2/resources/best-practices

---

**Plan completion condition:** This is a detailed build handoff, not evidence of a finished installed application. VoteHub connector source and synthetic tests are committed; current live API, native desktop integration and cross-platform user-acceptance verification remain outstanding.


---

## 14. Activity-thread consolidation, governing requirements and cost policy (v1.01)

This plan incorporates November 2 political-research activity and the new GitHub integration instructions without changing older formulas silently. Two independent requirements families must be reconciled:
- Repository \`USER_REQUIREMENTS.md\` — current authoritative Election Model product/user-acceptance requirements, including **100% of applicable testable user requirements in full QA**.
- User's separate **Political OSINT User Requirements v1.02** (November 2, stored in authorized research files) — research-specific QA, source fidelity, early-vote cohort definitions, RedBox/Marist model controls and prior calibration findings. Preserve its unique original IDs with an explicit prefix such as \`MIOSINT-UR-DATA-006\` in the combined traceability table to avoid collisions.
- [GitHub issue #1](https://github.com/Bomb-Daddy/Election-Model/issues/1): Windows/Linux installed workbench, still open. [Issue #2](https://github.com/Bomb-Daddy/Election-Model/issues/2): VoteHub integration, still open.

**Cost requirement, absolute:** $0 additional spending; no new paid data subscription, paywalled API, hosted inference, cloud infrastructure, credit card, chargeable trials or surprise metered service. Local on-device application and legitimately free data providers only. A provider that demands billing or a subscription remains unavailable for automatic acquisition, with a permitted local import alternative if rights permit. Paid FiftyPlusOne and paid AP access are **not** automatically enabled.

**Versioning:** All plan versions use v1.00, v1.01, etc. Preserve the prior version unmodified in docs/archives. Source data remains immutable. Original dated evidence never becomes a "live" value merely because the dashboard was opened later.

**Scope:** Michigan early-vote and national polling models, PR/G15 scenarios, related statistical research and formal QA are included. Fictional/hypothetical political commentary scripts, campaign-ad creative work and persona simulations are not silently converted into application features.

## 15. Unified polling-source architecture and free APIs

Maintain a distinct provider registry, ingestion status and permissions table for:
1. **Silver Bulletin (Nate Silver)** — published averages, rate/office/geography/temporal provenance. Use authorized permitted free export or user-owned local CSV; do not imply an open API if none verified.
2. **RealClearPolling (RCP)** — published averages and poll listing; use authorized free access/export or manual import, no unrestricted scraping assumptions.
3. **FiftyPlusOne** — published aggregate; paid subscriptions prohibited. Only permitted free export/manual data where authorized.
4. **Decision Desk HQ (DDHQ)** — dated published averages; any API must be checked for free access and usage rights.
5. **Race to the WH** — dated published numbers and modeled outputs, kept distinct from raw surveys and probability forecasts.
6. **VoteHub** — individual polling records from free documented API; not itself an additional independent Silver/RCP/DDHQ aggregate.
7. **"Voter" API request, provisionally mapped to Associated Press _The Voter Poll_** — source identity remains provisional until confirmed. AP's official developer documentation lists \`GET /v3/voterpoll/{electionDate}\` and its \`/download\` resource, requiring an AP API key and specific subscriber entitlement. **Do not activate subscription, invent a free public key or claim connectivity.** Register as \`requires_entitlement/unavailable_under_zero_cost_policy\` and permit a user-authorized licensed local import; retain source-specific election date, survey dates, weighting version, preclose/postclose phase, population, state, office and rights. If "Voter" refers to a different provider, substitute the verified actual source after identification, preserving this request.

Document VoteHub's existing code \`packages/connectors/src/votehub.ts\` and \`tests/unit/votehub.test.mjs\`. Agent must verify API schema against the provider and run real network checks. Endpoints: \`/polls\`, \`/polls/{poll_id}\`, \`/pollsters\`, \`/subjects\`, \`/poll-types\`. **Request all polling types by default**, not generic ballot only. Optional filtering uses dynamically returned types and pollsters; retain unknown types. Refresh is explicit, with source date and cache/stale/offline labels. Save historical snapshots with raw provider poll ID, timestamp, hash and required CC BY 4.0 attribution.

Source panel distinguishes every item: \`verified_live_api\`, \`verified_public_export\`, \`manual_authorized_import\`, \`planned_unverified\`, \`requires_entitlement\`, \`offline_cached\`, \`error\`. Never silently substitute an unavailable provider or average multiple provider aggregates as independent surveys.

### Additional zero-cost APIs as research candidates, not promised integrations

- If "Voter" refers to an election-results/voter-information service rather than AP's voter survey, validate the exact provider and its documented rates/rights before implementation.
- Free publicly documented alternatives such as civicAPI or Decision Labs may be evaluated for **official results and data overlays**, but election result tallies are not opinion polls. They must be separate measure classes with explicit coverage/QA and no invented election counts. Do not expand scope until core requirements are implemented.

## 16. Michigan new research datasets: RedBox, early votes and comparison types

Ingest the three user-supplied original datasets described by the Political OSINT requirements v1.02 using **private/local file import** only. Preserve byte-for-byte originals and SHA-256 checksums; build a separately versioned normalized layer. No original user-owned or restricted dataset goes into this **public** GitHub repository.

**Mandatory cohort categories:**
- Already-voted respondents describing their own vote (a pre-election recall survey; not official ballots).
- Not-yet-voted respondents reporting a planned choice.
- Mixed already/planned early voters.
- Modeled party affiliation/registration probabilities (e.g. TargetSmart), which are not observed candidate votes.
- Historical 2024 exit-poll/retrospective results, clearly marked 2024.
- Dated observed administrative early ballot counts, which are ballots cast and not candidate preferences.

**RedBox audit fixture (October 20–23, 2026):** original 8,900-row crosstab, verify Q2/Q3 Senate and Q6/Q7 Governor. In the reported already-voted subgroup unweighted n=940, effective n=280.1: Senate D60.45/R35.69 (D-R +24.76 pp); Governor D60.91/R34.82 (D-R +26.09 pp). Record single-share reported margin of error (about ±5.9 pp) separately from derived D-R margin uncertainty (about ±11 pp sampling-only). Independently check exact shares, cohort totals, 14-row public web extract and the original source hashes; maintain 2024 comparisons in their separate time bucket. No generalization of October 20–23 early-vote respondents to all November 2 early ballots absent an explicit conditional extrapolation.

**November 2 Michigan baseline source snapshot:** 1,569,715 returned absentee + 743,450 early in person = 2,313,165 early ballots observed in the source-model capture. Its data origin is a dated third-party tracker/screenshot pending independent official-source reconciliation; do not call it a current/live official result. The 5,002,698 projected total turnout is a **hypothetical heuristic**, not observed or statistically validated. Downstream snapshots must never overwrite this frozen input.

## 17. Marist joint demographic and voting-method model; Silver calibration

- Model the **October 15–18, 2026 Marist** party, age, voting-mode and candidate marginals with an auditable iterative-proportional-fitting/minimum-interaction joint reconstruction. The party×age×mode×candidate four-way cells are **not observed**. Never double-add separate age and party effects.
- Reproduce source marginals to documented tolerance; show observed versus inferred cells, assumptions, disagreements, constraints and sensitivity.
- **Hard demographic coherence check:** November 2 source reported early 65+ at 55%. A future modeled total cannot contain fewer seniors than already counted. The prior Marist 31% all-electorate senior assumption violated that check for the modeled final early cohort. An adjusted example uses 35% of all voters 65+ and 40% of later pre-election voters 65+ — both **unverified editable assumptions**, not fixed truth.
- Explicitly incorporate the **2024 introduction of statewide early in-person voting** and 2026's first midterm using that method. Report transitions in time/method (early-in-person, absentee, Election Day), not assumed changes in votes or total participation. Never transport historical 2022 Election Day party shares unchanged to 2026.
- The November 2 **Silver Bulletin secondary-transcribed** Senate D49.9/R45.2, Governor D51.8/R42.4 averages remain dated and marked secondary transcription. They are full-response candidate shares, not results. A uniform recentering may be run as a separate named scenario, not as evidence that early and Election Day preferences are observed.
- Keep two distinct conditional models: (A) Marist structural/IPF voting-method reconstruction with Silver statewide recentering; (B) RedBox-reported early subgroup held constant, with Silver statewide identity used to derive a hypothetical necessary Election Day margin. Never fuse these automatically or express them as measured election probabilities.
- Source research report v1.02 notes structural Silver-aligned Election Day R–D requirements of +10.90 pp Senate, +6.07 pp governor, and RedBox-conditional +20.12/+11.25 pp respectively. These are **conditional arithmetic outputs** under the reported assumptions, not projected election-night values. Sensitivity changes with assumed turnout.
- Retain user's optional **5% original-Republican-cohort crossover and additional 10% nonvoting** as mutually exclusive scenarios, not presumed new behaviors absent from topline polling. Preserve original cohort math and the \`5/90\` post-abstention conversion, separate embedded versus genuinely incremental turnout loss, and no deletion of already recorded ballots.

## 18. Independent model audit and non-identifiability report

The independent November 2 **consistency audit v1.03** concluded no *arithmetic contradiction* between the structural early-voter model and RedBox early subgroup under stated sampling uncertainty, but it **did not validate the turnout forecast or the party×age×method×candidate joint distribution**. Silver statewide recentering matches published Silver margins **by construction**, not independently.

Reproduce audit checks: RedBox effective-sample uncertainty, turnout-method counts, senior lower-bound/coherence, source freshness, denominator conservation, all-response vs two-party margin, and abstention/crossover flow. Historical audit recorded 52/53 testable source requirements pass with one empirically unobserved joint-cell condition, plus 66 arithmetic tests in the Silver calibration model. These are **historical report results**, not new tests passed in the desktop app.

Add a visible side-by-side panel: structural assumption, RedBox-conditional identity, sampling-only variability, structural/temporal uncertainty and unobserved variables. Report \`empirically_unverifiable\` separately from coding \`NOT TESTED\`. Warn when the modeled late absentee return, senior cohort or candidate choice is not directly measured.

## 19. National model and Prediction Register integration

Preserve all established national OSINT v3 House/Senate content, G15 (generic ballot + Republican abstention/defection/third-party + extra turnout **effective two-party vote margin**, not merely polling average), individual named PRs, frozen baseline, 435 House districts and Senate special cases. Keep the **prediction registry** as a separate ledger of dated hypotheses, evidence and target event windows, including those not scoreable until **2028**.

Show generic ballot **source average** beside original-cohort scenario changes and final **hypothetical effective counted two-party House vote**, without treating them as the same observed quantity. Support user adjustment of crossover, abstention, turnout and third-party participation independently with clearly stated denominators.

Implement early-vote remaining-vote **recovery threshold** as conditional arithmetic, with timestamps, projected remaining vote count, early assumed preference and population. Never present early modeled party affiliation as recorded candidate votes; do not claim the chance that a party will win. Keep observed, poll, assumption, conditional identity and certified result visibly distinct. National and Michigan models integrate via typed source snapshots; no silent double counting and no assumption that demographic margins form a joint table.

## 20. App features newly required in the integrated build

Add to the existing Electron/React desktop GUI (do not replace with a web-only demo):
1. **Poll Explorer** with all-category VoteHub, separate five aggregator source statuses and the provisional AP Voter Poll row behind an entitlement/cost gate.
2. **Source & License Inspector** showing original survey/provider, date, fieldwork window, method, sample n/effective n, population, modeled-vs-measured status and acquisition permissions.
3. **Michigan Early Vote Lab** with observed vs survey early voters, RedBox/Marist/Silver side-by-side, EIP transition, 65+ constraint and turnout sensitivity.
4. **National/G15 Model Lab** with original-cohort GOP switches/abstention, third-party, generic baseline, two-party margin and non-overlapping populations.
5. **Prediction Register** with unexpired future targets and a clear evidence log; do not retrospectively score a forecast before its specified date.
6. **Full QA matrix** with every user acceptance requirement and previous regression vectors; no "green" release state if blocked or untested requirements remain.
7. **Import/export** for CSV/XLSX/JSON, immutable snapshots, local backups and clear attribution/licensing. Mark data provenance and collection timestamp in every displayed quantitative output.

All buttons, filters, chart legends, exports, help actions and settings must be functional. Every user-facing function should have a discoverable UI control; every offered menu action must have implemented behavior or a disabled explanation. Meet accessibility, full-keyboard navigation, and CPU-only operation.

## 21. Revised implementation order and agents' task register

- **P0 (first):** confirm current v1.01 plan plus the latest user requirements, source identity, free-cost gate and detailed requirements traceability. Discover all new research source originals locally and never infer public GitHub access to private Drive data.
- **P1:** preserve existing pure-core, Electron/React/SQLite build architecture; establish real one-click installer pipeline on native Windows/Linux early.
- **P2:** secure import pipeline with immutable originals, checksums, verified population types, safe export, licensing, snapshots and SQLite rollback.
- **P3:** VoteHub all-category API and Poll Explorer main-process IPC; test real endpoints, cache/offline/refresh and free status. Provisional AP Voter Poll availability card is gated and disabled pending legal free access and exact identity.
- **P4:** integrate RedBox, Marist IPF and Silver as **separate** measurement/calibration streams; reproduce the hard senior constraint and transition scenarios.
- **P5:** preserve and integrate Michigan v2.03 and OSINT v3 national/G15 engine; new measured/predicted/simulated type guards and dated PR ledger.
- **P6:** source-provider registry for RCP, FiftyPlusOne, DDHQ, Race to the WH, Silver; implement permitted free automation only if verified; otherwise functional manual imports and honest unavailable state.
- **P7:** full requirement-based hostile QA, installed Windows/Linux user walkthroughs, privacy/security/financial compliance and reproducible build outputs with checksums.

For each phase, Claude must report exact changed paths, commit hash, tests actually run, pass/fail/untested counts, sample vs real data, issues and next implementation objective. No claim that a programming plan or test stubs equal an installed release.

## 22. Release gate / QA traceability additions

A full QA attempt must reconcile the source-model requirements v1.02 and the repository requirements, avoiding duplicate IDs by namespacing. Enumerate **every applicable, testable requirement**; map expected/observed/evidence and test state. Include the following specific hostile cases:
- All VoteHub polling categories without default restrictive filter; new type acceptance, live failure, invalid JSON/schema, rate limit and stale cache.
- AP Voter Poll entitlement denied and zero-cost safeguard: no API key, no requests that could incur a charge, clear provider status, optional authorized file import.
- Original RedBox hash and 8,900 source-row quality, n versus effective-n, sample uncertainty, Q2/Q3/Q6/Q7, 2024 historical data kept apart.
- Unobserved joint Marist reconstruction, fitted marginals, constraints and sensitivity; senior already-recorded impossibility rejection.
- Turnout mode switching 2024/2026, candidate preference vs party-alignment separation, no treatment of 2026 pre-election surveys as official exit results.
- Silver source-date and full-response vs two-party normalization; no additive double counting of 5% crossover or 10% nonvoting.
- G15 denominator translation and cohort conservation; 435 unique House keys; independents, tie and mismatched candidate/holder cases.
- Exact source vintage, original/derived snapshots, dedupe, license attribution, CSV injection, corrupt import, malicious IPC, backup/restore and offline.
- All user-facing controls functional, package installs and **real launch** of Windows x64 and Linux x86_64; no extra runtimes, no paid account.
- $0 cost verification of dependency, network, provider, CI and release workflows.

Output a requirements-to-test matrix with PASS, FAIL, NOT TESTED, NOT APPLICABLE plus numerical coverage. Never represent historical 52/53, 66 arithmetic or five mock VoteHub results as a fresh complete full-project QA pass. Known missing source permissions/real device testing are blockers or explicitly unverified. Release is not fully QA cleared until all applicable testable requirements pass on actual deliverables.

### Source references for the implementation agent

- Repository: USER_REQUIREMENTS.md, CLAUDE.md, docs/plans/VOTEHUB_INTEGRATION_v1.00.md, issue #1 and #2.
- Private research documents (authorized local read/import, **not** public GitHub contents): \`POLITICAL_OSINT_USER_REQUIREMENTS_v1.02.md\`, \`CALIBRATION_REPORT_v1.01.md\`, \`TRANSITION_CALIBRATION_REPORT_v1.02.md\`, \`CONSISTENCY_AUDIT_REPORT_v1.03.md\`.
- AP Voter Poll official docs: https://developer.ap.org/ap-elections-api/docs/Voter_Poll.htm ; subscriber access https://developer.ap.org/ap-elections-api/docs/Release_Notes.htm.
- VoteHub: https://votehub.com/polls/api/ .

---

## 23. MANDATORY cross-platform one-click installation AND single-icon execution (user instruction 2026-11-03)

**This is a product acceptance/release gate, not a secondary packaging task.** Follow authoritative User Requirements v1.03 IDs UR-INSTALL-001 and UR-LAUNCH-001.

### 23.1 Windows (required)

- Produce a genuine self-contained Windows 11 x64 graphical executable installer (.exe, NSIS or equivalently robust). The user downloads one file, double-clicks, accepts normal operating-system prompts, and installs through a GUI, without terminal, PowerShell, git, Python, Node, developer IDE, source build or user-supplied runtime.
- Installer provides ordinary Start-menu/application launch and user-visible installation/repair/uninstallation behavior. App uses local storage and works with the network disabled after installation.
- Verify app creation of the required local database/config, app first-run onboarding, normal quit and relaunch, save/close/reopen with persisted data; verify an upgrade or reinstall does not unexpectedly destroy snapshots.
- If a Windows OS SmartScreen or unsigned installer warning appears, record it exactly; do not misreport a blocked or unlaunched installation as successful.

### 23.2 Linux (required)

- Produce a mainstream supported Linux x86_64 package that the user can open in a graphical file manager and install via the distribution's own graphical software installer (prefer a tested .deb for Ubuntu/Debian-family target); the app then launches from the desktop application menu by a click. Do **not** require apt commands or manual runtime installation.
- Also provide the planned Linux x86_64 AppImage as a portable launch artifact **only if tested** on representative supported Linux desktop. Make AppImage GUI-launchable and document any security/permission prompts. If it requires terminal chmod or manual FUSE packages, that route does **not** satisfy the one-click requirement; fix the packaging/launcher or provide the tested graphical .deb route.
- All necessary runtime binaries/native dependencies must be packaged or resolved by the normal graphical installation process. Do not require Python/Node setup or custom terminal instructions.
- Verify desktop icon/application entry, open, file permissions, local database directory, normal window close, reopen, offline and saved scenario reload. Verify OS-specific Linux desktop behavior rather than trusting Windows tests.

### 23.3 Build artifacts, distribution and cost

- Use pinned Electron + native SQLite compatibility, reproducible lockfiles, real native Windows and Linux builds; package version and build SHA tied to each release artifact.
- Compare artifact SHA-256, file size, name and actual downloadable release attachment. A CI build check alone cannot be a launch-test or GUI test.
- The $0 additional cost rule applies to CI build minutes, infrastructure, cloud artifact storage, plugins and external systems. Do not enable charged build runners or premium hosting; if free build quotas are exhausted, report blocker rather than incur billing.
- First-run UX shall not ask the user to connect a paid account, install an API development tool or type terminal commands. VoteHub stays free; AP Voter entitlement gated.

### 23.4 Test matrix (separately on both installed OSes)

1. Starting from an environment without programming/runtime tooling, download actual release package.
2. Double-click/open package through the graphical OS only.
3. Complete the install with ordinary UI prompts; see app icon/Start menu/desktop launcher.
4. Start app with one click (or normal icon double-click); check visible, interactive welcome and menu functions.
5. Create example project, test offline and import a permitted local synthetic CSV; verify fields, error labels and provenance.
6. Save changes, quit, relaunch, restore same project; close app and reopen after a new OS user session/reboot where feasible.
7. Use normal OS GUI to uninstall; verify documented user-data retention/deletion policy.
8. Repeat for Windows 11 x64 and at least one named supported Linux x86_64 distribution/desktop.
9. Repeat first-run and reinstall scenarios after material packaging fixes, retaining failure evidence.

**No real test evidence on a platform = NOT TESTED, not PASS.** Require logs/screenshots with build SHA, OS version, package hash, observed outcome and issue ID.

## 24. MANDATORY 100%-functional real-user GUI QA (user instruction 2026-11-03)

**The user explicitly requires a GUI that works, with every function tested from a normal user's perspective.** Follow UR-GUI-001, UR-GUI-QA-001 and UR-QA-004 and the full project QA rules. There is no waiver for attractive layout, screenshot plausibility or passing unit tests.

### 24.1 Build a control inventory as an executable acceptance contract

Enumerate **every control that the user can see or invoke**, nested by page/modal/menu and workflow:
- Welcome: New/Open/Recent, example project, help, settings, exit, dialog cancel.
- Source Library: source type/license/vintage, add/import CSV/XLSX/JSON, preview/commit/cancel, source refresh, delete snapshot rules, metadata, history, data errors.
- Poll Explorer: VoteHub all categories by default, all filters, refresh, last retrieval, offline/cached/stale/errors, provider detail and attribution; RCP/Silver/FiftyPlusOne/DDHQ/Race to the WH and provisionally Voter access statuses.
- Michigan Lab: original records, RedBox early/not-yet, Marist reconstruction, 65+ feasibility, early-vote mode transitions, Silver recentering, turnout stress assumptions and all visible filters.
- National/G15 Lab: source poll selection, model parameters with correct denominators, sliders **and** numeric input, reset/validate, apply/run, geographic list/detail, independent cases, chart and table controls.
- Prediction Register: create/edit/save version, evidence log, source dates, pending target dates, filtering, compare and permitted evaluations.
- Scenario Manager/Compare: save-as-version, reset, clone, compare, export and reopen preserving exact inputs/results.
- QA Center: run/re-run, test result details, report export, view unresolved issues and data/provenance warnings.
- Settings/help/accessibility: settings save/reopen, backup/restore, keyboard shortcuts, source status, credentials/permissions where actually supported, readable tooltips and appropriate disabled states.
- Window/UI lifecycle: focus, scrolling, resizing, keyboard-only navigation, long tables, empty/loading/error conditions, screen-reader labels, failure/retry recovery and close/relaunch.

Each inventory row must have: **control ID, page/state, user intent, expected outcome, data/model side effect, accepted input ranges, test case, Windows installed app result, Linux installed app result, evidence URL/path, defect ID and retest result**.

### 24.2 Hostile functional and user testing

- Exercise **click-to-actual-effect**, not only event dispatch. For example, clicking Export must create a correct, re-importable artifact; clicking Refresh must update/reject with truthful response vintage; changing a scenario input must affect correct output and not mutate prior snapshots.
- Exercise positive, negative, boundary, error/timeout, empty and persistence cases for every applicable control. Include cancel/retry, duplicate import, stale cache, unknown polling category, extreme values, invalid date, offline source, unsubscribed Voter provider and no-cost guard.
- Use true application UI automation where practical (Playwright/Electron or OS GUI automation), and actual visual inspection plus a nontechnical first-time-user manual walkthrough. **Automation simulating a user does not replace an actual human acceptance test** where required.
- Run separately on **installed** Windows and Linux packages. A Chrome browser preview, source code linter, React unit test, screenshot or macOS-only launch is not an installed-app acceptance result.
- Verify **discoverability and plain-language behavior**: user can understand all functions without software-development experience; all labels, help text, alerts, disabled-state explanations, loading indicators, key navigation and error recovery are clear.
- Capture screenshots or short screen recordings of the real application as evidence; protect private user data and credentials in outputs.
- Every reopened/failed test must be fixed and retested; report unresolved items exactly. No overall status COMPLETE or RELEASE READY if applicable functionality remains unimplemented or unverified.

### 24.3 Project QA and milestone updates

Add phase **P1a — earliest one-click Windows/Linux installed vertical slice with verified GUI start** before adding all analytical models; package early and keep installing/launching after every major change.
Add phase **P7a — full control-by-control installed GUI functional QA and novice walkthrough** before any release candidate is called complete.
- QA matrix encompasses all user-requirements source families (GitHub current requirements + source Political OSINT), plus every interactive GUI control and both platform installers.
- Use PASS / FAIL / NOT TESTED / NOT APPLICABLE with observed evidence, no optimistic green check for partially verified software.
- **Release gate:** Both graphical installations and single-click launches work; every applicable control and full user workflow passes on both OSes; no unresolved significant bugs or applicable untested requirements; outputs preserve model arithmetic, source license, $0 spend, reproducible results and immutable snapshots.
- Include release evidence summary with commits/checksums, OS/distro details, total requirement counts, control counts, per-OS pass/fail/untested counts, blockers and exact links to real binary artifacts.
- **Current status at plan publication:** packaging, installed-app launch and complete user GUI acceptance are NOT TESTED; this update sets requirements but is not itself test proof.

### Revision history
- **v1.00 — 2026-11-02:** initial comprehensive architecture and implementation plan.
- **v1.01 — 2026-11-02:** consolidated polling source integrations, RedBox/Marist/Michigan research, Voter API cost gate, national G15 and PR.
- **v1.02 — 2026-11-03:** explicit mandatory one-click GUI installation/launch on both supported OSes, full all-controls functional acceptance and release-blocking QA evidence.
