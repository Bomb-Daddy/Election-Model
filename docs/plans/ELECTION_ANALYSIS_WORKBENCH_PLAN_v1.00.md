# Election Analysis Workbench — Detailed Claude Sonnet Build Plan v1.00

**Created:** 2026-11-02  
**Target repository:** Bomb-Daddy/Election-Model  
**Agent:** Claude Sonnet using Claude Code or equivalent software-building environment  
**Status:** Implementation specification only. The desktop program has **not** yet been built or tested.  
**Project type:** Local-first election data exploration, deterministic counterfactual scenario analysis, and hostile quality assurance.  
**Platforms:** Windows 11 x64 and Linux x86_64, CPU-only compatible.

---

## 1. Executive directive

Create a single, fully launchable, graphical desktop application called **Election Analysis Workbench**. It must import and manipulate data from two previously developed analytical systems without destroying their individual assumptions or data provenance:

1. **Michigan 2026 Turnout Model v2.03:** statewide registered/observed early ballots, absentee and early-in-person figures, historical turnout regression, age/gender/prior-election marginals, synthetic participation cohorts, Silver Bulletin polling averages, and Republican counterfactuals.
2. **National OSINT Effective Generic Ballot Model v3:** a national House/Senate geographic scenario framework, 2024 district baseline votes, 2026 race-poll evidence, generic-ballot starting conditions, Republican abstention and defection, additional Democratic participation, third-party flows, source vintages, and seat-count QA.
3. **Michigan–OSINT Integration Hostile QA v1.00:** the source of required denominator translation, double-counting protections, poll normalizations and previously discovered defects.

The application is an **analytical workbench**, not an election-persuasion tool, a fake prediction generator, or a static chart viewer. It must clearly distinguish **observed data, survey measurements, model assumptions, hypothetical results and genuinely validated estimates**.

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

**Plan completion condition:** This file is a detailed build handoff. It does not claim that any model was merged, that private Google Drive data was published, that Claude has run, or that the desktop app has been compiled and launched.
