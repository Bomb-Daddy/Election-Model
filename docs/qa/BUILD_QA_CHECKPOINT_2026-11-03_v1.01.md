# Election Analysis Workbench — Validated Build QA Checkpoint v1.01

**Date:** 2026-11-03  
**Authoritative user requirements:** `USER_REQUIREMENTS.md` v1.03, plus Political OSINT requirements v1.02 (private research sources).  
**Application:** v0.1.0 — **DEVELOPER PREVIEW, NOT RELEASE-CERTIFIED**.  
**Source commit:** `96846dfe5c07a1605088657f275411911219faf0`  
**CI build:** https://github.com/Bomb-Daddy/Election-Model/actions/runs/41665461656  
**Live VoteHub API check:** https://github.com/Bomb-Daddy/Election-Model/actions/runs/41665461742  
**Verified downloadable preview:** https://github.com/Bomb-Daddy/Election-Model/releases/tag/v0.1.0-preview-96846df  
**Prior QA:** `BUILD_QA_CHECKPOINT_2026-11-03_v1.00.md` is preserved unchanged.

## Actual observed checks

| Tested requirement / workflow | Windows 11 x64 | Ubuntu 24.04 x86_64 | Evidence |
|---|---|---|---|
| Desktop build with Electron/React + SQLite | PASS | PASS | CI successful jobs |
| Create actual Windows NSIS / Linux .deb + AppImage packages | PASS | PASS | CI package files, SHA256SUMS |
| Install actual package in CI | PASS (NSIS silent-install) | PASS (system .deb install) | CI installed-package steps |
| Launch **installed app**, exercise real interactive GUI under Playwright | PASS | PASS (under Xvfb) | CI installed-app smoke logs |
| 28 local unit tests including 6 VoteHub mock/shape tests, 12 election model tests and 10 SQLite/storage tests | PASS | PASS | CI test logs |
| 13 end-user GUI smoke workflows on unpacked packaged app | PASS | PASS | CI packaged-app logs/screenshots |
| 13 end-user GUI smoke workflows on **actually installed** app | PASS | PASS | CI installed-app logs/screenshots |
| Real VoteHub `/polls` unrestricted response, all categories | PASS (provider integration source shared) | PASS (tested on Linux runner) | live API run, 6,108 polls |
| Real VoteHub list types, pollsters, subjects, poll by ID | PASS (source shared) | PASS (tested on Linux runner) | live API run, 10 types, 335 pollsters, 174 subjects, 1 poll ID |
| Full nontechnical human GUI installation-by-click | NOT TESTED | NOT TESTED | Requires human / actual GUI software-center walkthrough |
| Real nontechnical human acceptance of every UI control | NOT TESTED | NOT TESTED | Test inventory and full acceptance missing |
| All five non-VoteHub aggregator automated data feeds | NOT IMPLEMENTED / NOT TESTED | NOT IMPLEMENTED / NOT TESTED | Only permitted manual import / status UI |
| Full private Michigan RedBox/Marist IPF and full 435 House district source integration | NOT IMPLEMENTED / NOT TESTED | NOT IMPLEMENTED / NOT TESTED | Dated source files not in public repo |
| Paid AP Voter Poll API access | NOT APPLICABLE under $0 rule | NOT APPLICABLE | Unconfirmed provider and subscriber entitlement blocked |

## Real GUI smoke actions and outcome

The 13 automated UI workflows each passed twice per OS, on packaged and installed app:

1. Open project manager backed by local SQLite
2. Poll Explorer opens with **all types unrestricted by default**
3. All seven provider/source entries shown; AP paid source disabled
4. National scenario sliders/numeric controls produce correct original-cohort 10/5/85 arithmetic
5. Save scenario as immutable SQLite version and visibly reload it
6. Native CSV open-file dialog imports a synthetic survey source and displays stored SHA-256 provenance
7. Native JSON export produces a real file with SHA-256/source metadata and one verified imported record
8. Invalid Republican cohort inputs produce a visible actionable error
9. Michigan turnout calculation displays recorded 2,313,165 early ballots in dated reference
10. Prediction register creates a dated, immutable test entry
11. QA center executes real core checks and properly labels overall status **INCOMPLETE**
12. Backup/Settings panel and its exposed controls appear
13. Help documentation opens from navigation

**Not covered comprehensively:** GUI backup/restore with native dialogs, Excel/JSON imports through GUI, actual manual installer clicks, keyboard-only navigation of every field, offline network failover, arbitrary data and corrupt-file cases, RedBox/Marist private data, all 435 district outcomes, all aggregator sources, actual human user approval. A smoke test suite is not 100% QA.

## Verified VoteHub source defect fix

Live polling endpoint response did not match VoteHub's example documentation: GET `/polls` returned a **top-level array**, not `{"polls":[...]}`. Connector now accepts both formats and retains raw fields. All five live endpoint operations were successfully checked, including 6,108 polls and 10 polling categories. A regression unit test was added. **First preview** `v0.1.0-preview-73bd602` is **superseded**; use `v0.1.0-preview-96846df`.

## Release and spend status

- **QA release gate: INCOMPLETE.** There are currently untested and unimplemented requirements. Do not claim the final program is complete, calibrated, fully one-click human-verified or entirely QA-passed.
- No premium cloud, API subscription, paid data feed, paid CI runner, signing certificate or model inference activated. VoteHub is free under CC BY 4.0, attribution included.
- No private original research files, personal voter records or OAuth credentials were put into this public GitHub repository.
- Windows app is unsigned: Windows may warn before installation, which needs actual human review.
- All package downloads are exact GitHub release assets tied to source commit and CI artifacts; source-code commits alone are not proof of installation.

**Next work:** Complete remaining analytical modules and free authorized source connectors, comprehensive menu/control interaction inventory, original input permissions/import, real human Windows/Linux GUI installer and usability validation, QA repair/retest matrix until all applicable tests pass.
