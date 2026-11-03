# Election Analysis Workbench

**Status:** Integrated workbench plan v1.02 and user requirements v1.03 are published. VoteHub connector source and synthetic tests exist. **No installed desktop release, live upstream API verification or complete cross-platform QA has yet been confirmed.**

A planned local-first, GUI-based Windows/Linux election data workbench combining Michigan 2026 turnout analysis with a national OSINT participation and geographic scenario engine. The finished app is intended to import local CSV/XLSX/JSON and optionally authorized Google Sheets, modify assumptions, compare saved scenarios, and run executable hostile QA.

## For Claude Sonnet / Claude Code

1. **[Read the integrated build plan v1.02](docs/plans/ELECTION_ANALYSIS_WORKBENCH_PLAN_v1.02.md)** — architecture, UI, source/data contracts, exact vote-flow arithmetic, stages, package requirements, regression tests and release gates.
2. **[Read CLAUDE.md](CLAUDE.md)** — agent constraints and first implementation tasks.
3. Implement working code and test real Windows 11 x64 NSIS and Linux x86_64 AppImage packages. A successful build without an actual package launch is NOT a completed requirement.


## VoteHub polling API (new implementation, 2026-11-02)

The free, CC BY 4.0 VoteHub polling connector is now implemented at [packages/connectors/src/votehub.ts](packages/connectors/src/votehub.ts), with five passing mocked unit tests at [tests/unit/votehub.test.mjs](tests/unit/votehub.test.mjs). It supports **all polling types** by default, not just generic ballot, and uses no paid service, subscription, API key, hosted backend or automatic polling. [Integration contract](docs/plans/VOTEHUB_INTEGRATION_v1.00.md) and [Claude build task](https://github.com/Bomb-Daddy/Election-Model/issues/2).

**Not yet completed:** Electron GUI hookup, live VoteHub network check, saved SQLite snapshots, one-click Windows/Linux installers and installed-app QA. The connector is source code for the build agent, **not** a downloadable functioning desktop application yet.


## Current user requirements and activity reconciliation

- **[Authoritative User Requirements v1.03](USER_REQUIREMENTS.md)** — $0 cost rule, all-category VoteHub, five published aggregators, user-requested provisional **"Voter" API**, Michigan early-vote/Marist/RedBox/Silver, national G15, Prediction Register, and complete requirement-by-requirement QA.
- **[Integrated Workbench Plan v1.02](docs/plans/ELECTION_ANALYSIS_WORKBENCH_PLAN_v1.02.md)** — reconciles November 2 political research reports and GitHub build work. Its previous version is in [archives](docs/archives/ELECTION_ANALYSIS_WORKBENCH_PLAN_v1.00.md).
- **[Claude desktop epic](https://github.com/Bomb-Daddy/Election-Model/issues/1)**; **[VoteHub issue](https://github.com/Bomb-Daddy/Election-Model/issues/2)**; **[additional "Voter" API issue](https://github.com/Bomb-Daddy/Election-Model/issues/3)**.
- **Voter API identification is provisional:** AP's *The Voter Poll* is documented but requires subscriber entitlement and is **not enabled**. The $0 rule takes precedence; licensed local imports are acceptable. This is separate from the free VoteHub polling API.
- User research source originals and calibration reports are kept outside this public GitHub repository; agents must not assume private Drive files are locally present or publish them.


## Mandatory graphical installation and user acceptance

- **[One-click installation + full GUI QA release blocker](https://github.com/Bomb-Daddy/Election-Model/issues/4)** — do not close without both installed-platform launches and complete real-user testing.


**Not optional.** The application must arrive as a self-contained, genuinely **one-click graphical install and one-click launch** on both **Windows 11 x64** (installer .exe plus Start-menu launch) and **Linux x86_64** (graphically installable .deb on supported distro and application-menu launch; portable AppImage only where GUI launching actually works). Users must **not** install Python, Node, FUSE, API tools or run terminal commands to install/launch the supported package. No billable services.

**Every user-visible GUI action must function and be tested as an end user.** Claude must build a full control inventory, exercise every visible menu/control and complete user flows on **both actual installed platforms**, verify effects/persistence/error states and perform a first-time nontechnical-user walkthrough. No release-ready claim until every applicable requirement passes with OS-specific observed evidence. Current installation and GUI QA status: **NOT TESTED**.

References: [Authoritative USER_REQUIREMENTS.md v1.03](USER_REQUIREMENTS.md) (UR-INSTALL-001, UR-LAUNCH-001, UR-GUI-001, UR-GUI-QA-001, UR-QA-004) and [integrated plan v1.02 sections 23–24](docs/plans/ELECTION_ANALYSIS_WORKBENCH_PLAN_v1.02.md).

## Required capabilities

- Graphical import and provenance-preserving snapshots; SQLite-backed local persistence and no account needed for offline work.
- Michigan observed turnout, demographic marginals and historical model assumptions alongside dated Silver Bulletin race poll averages.
- National 435-district / Senate scenario module with explicit candidate, independent and vintage limitations.
- Adjustable Republican abstention, Republican-to-Democratic crossover, extra Democratic turnout, and third-party flows. In the canonical original Republican cohort the user's 10% abstain + 5% cross-to-D leaves 85% R; denominator translation required for OSINT v3.
- Scenario comparison, versioning, export and a full hostile QA center.
- All clickable controls functional; one-click GUI launches on both OSes without separately installed developer tools.

## Data/privacy

**This repository is PUBLIC.** Do not upload private Google Drive documents or identifiers, personal voter data, private images, copyrighted restricted poll feeds, credentials, OAuth refresh tokens or unpublished datasets. Original Michigan v2.03 and OSINT v3 sources exist outside this empty starter codebase and require a permitted local import/authorized connector; they are NOT silently available to a coding agent.

## Source status

The versioned plan is grounded in the existing Michigan turnout v2.03, OSINT national v3 and Michigan–OSINT integration QA v1.00. It explicitly tracks known defects and uncertainty. No code or data integration has been executed in this repository yet.
