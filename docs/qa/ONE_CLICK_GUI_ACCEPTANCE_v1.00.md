# Election Analysis Workbench — One-click Install + Full GUI Acceptance Matrix v1.00

**Created:** 2026-11-03  
**Status:** TEST PLAN ONLY — every test below is **NOT TESTED**, not evidence of successful software.  
**Requirements:** USER_REQUIREMENTS.md v1.03 (UR-INSTALL-001, UR-LAUNCH-001, UR-GUI-001, UR-GUI-QA-001, UR-QA-004, UR-QA-001)  
**Build/commit under test:** PENDING  
**Windows installer/version/hash:** PENDING  
**Linux installer/version/hash/distro:** PENDING  
**Test evidence location:** PENDING

## Required statuses
PASS, FAIL, NOT TESTED, NOT APPLICABLE (with reason). An unbuilt feature is **NOT TESTED or FAIL**, never PASS. If any applicable test remains FAIL or NOT TESTED, overall release status is **INCOMPLETE**.

## A. Real one-click OS installer / launcher tests

| ID | Acceptance action and observable result | Windows 11 x64 | Linux x86_64 | Evidence |
|---|---|---|---|---|
| PKG-01 | Download real release package, verify SHA-256 and version | NOT TESTED | NOT TESTED | |
| PKG-02 | Install by graphical double-click; no terminal/dev runtime/manual dependency install | NOT TESTED | NOT TESTED | |
| PKG-03 | Launcher or application entry created in expected OS menu | NOT TESTED | NOT TESTED | |
| PKG-04 | Open with one normal click/double-click and usable welcome GUI | NOT TESTED | NOT TESTED | |
| PKG-05 | Start offline and display source-cache status without crashes | NOT TESTED | NOT TESTED | |
| PKG-06 | Quit, relaunch and restore latest saved project / SQLite snapshot | NOT TESTED | NOT TESTED | |
| PKG-07 | Open after new login/reboot or equivalent verified fresh session | NOT TESTED | NOT TESTED | |
| PKG-08 | Reinstall/update with expected preservation of local project data | NOT TESTED | NOT TESTED | |
| PKG-09 | Uninstall through OS GUI and confirm documented local-data handling | NOT TESTED | NOT TESTED | |
| PKG-10 | Runs without user-installed Python, Node, FUSE, CLI tooling, paid services, or additional cost | NOT TESTED | NOT TESTED | |

**Linux installed path:** test .deb via named supported distribution's GUI software installer; test AppImage separately as optional portable package, without confusing GUI launch with installation. Record actual OS prompts, security dialogs, permission issues and missing dependency messages rather than ignoring them.

## B. GUI functional test control inventory

For each screen listed below, enumerate every actual on-screen menu, submenu, button, input, slider, dropdown, tab, keyboard shortcut, modal dialog, error/empty state and help action. Add one row **per discovered control** with:
**Control ID | screen | starting state | user action | expected visible effect | expected data/persistence effect | actual Windows outcome | actual Linux outcome | proof | issue # | retest status.**

| Screen / workflow | Required coverage | Windows | Linux |
|---|---|---|---|
| Welcome/project picker | New, open, recent, sample, help, settings, exit; cancel dialogs | NOT TESTED | NOT TESTED |
| Importer/source library | CSV/JSON/XLSX pick, preview, validate, map fields, commit, cancel, duplicate, corrupted data, provenance | NOT TESTED | NOT TESTED |
| Poll Explorer | All VoteHub categories default; dynamic filters; poll details; source links; refresh/cached/stale/offline; all provider status cards | NOT TESTED | NOT TESTED |
| Michigan turnout | Observed vs inferred vs hypothetical, turnout modes, sample cohorts and dates, age-65 constraint, uncertainty | NOT TESTED | NOT TESTED |
| National/G15 model | Every slider and number input; denominators; third-party and crossover conservation; reset, calculate, validation | NOT TESTED | NOT TESTED |
| Prediction Register | Create/version, edit, evidence, pending date, save, filter, export, restore | NOT TESTED | NOT TESTED |
| Scenario comparison | Source vintage select, save as version, compare, duplicate, restore, errors | NOT TESTED | NOT TESTED |
| Source inspector | Data license, poll dates, source type, snapshots, stale warnings and disabled paid provider explanations | NOT TESTED | NOT TESTED |
| QA center | Run/re-run, detailed result, requirement traceability, defect view, QA CSV/JSON export | NOT TESTED | NOT TESTED |
| Settings/help | Every setting read/write, tooltips, keyboard tab order, screen resize, backups, privacy, exit | NOT TESTED | NOT TESTED |

## C. First-time ordinary-user walkthrough

Tester must use **installed artifacts**, without source-code access or API/CLI knowledge:
1. Install from package by GUI alone, then click application icon.
2. Open sample project and locate source provenance and explanation in plain language.
3. Import a permitted local synthetic CSV; intentionally try corrupt and duplicate files.
4. Browse all VoteHub poll types; apply and clear filters. Verify refresh shows true source state or truthful error (no paid provider automatically accessed).
5. Open Michigan tab, compare measured versus inferred voting-mode data and modify an allowed user scenario input; confirm calculation changes correctly.
6. Change GOP abstention/crossover; validate denominators and show expected math/uncertainty.
7. Create two named, versioned scenarios, compare and export both, then reimport exported data.
8. Close app; click launcher again; verify settings and saved source snapshots persist.
9. Trigger offline/unavailable-API state and confirm understandable recovery.
10. Open QA center and reproduce a test result; export findings.
11. Use normal GUI uninstall; record data handling.
12. Repeat **independently on Windows and Linux**, capturing observed outcome and actionable user difficulties.

## D. Hostile QA and release criteria

- Every applicable control has positive, invalid-input, boundary/error and persistence tests where relevant; function effect is observed, not simply click event.
- Verify no clipping at 1366×768, full keyboard navigation, focus visibility, accessible names/help text, feedback for changes, error recovery, source attribution and coherent disabled states.
- Run backend golden-vector model tests as **additional** evidence, never as a replacement for installed GUI QA.
- Compare requirements v1.03 and the Political OSINT research requirements v1.02 in a comprehensive cross-source traceability matrix, keeping distinct requirement IDs.
- QA report must include build SHA, installed artifact SHA-256, supported Windows and Linux versions, number of controls, total requirements, PASS/FAIL/NOT TESTED/NOT APPLICABLE counts, actual evidence, defects and retest runs.
- A screenshot, compilation, CI workflow, mock-only API test or synthetic click emulation alone cannot demonstrate complete acceptance.
- Actual nontechnical-human testing must be recorded separately from automated agent tests.
- **Overall status remains INCOMPLETE** until *all* testable mandatory user requirements and each applicable UI control function have verified PASS on both platforms, with no unresolved blockers.

## Evidence log

| Date | Build SHA | Platform/version | Installer hash | Tester/tool | Test IDs | Outcome | Evidence URI | Defect |
|---|---|---|---|---|---|---|---|---|
| — | — | — | — | — | — | NOT TESTED | — | — |
