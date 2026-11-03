# Election Analysis Workbench — build QA checkpoint v1.00

**Captured:** 2026-11-03  
**Application version:** 0.1.0 preview  
**Release classification:** **INCOMPLETE**. Automated checks below do not satisfy the full User Requirements v1.03 or the separate Political OSINT requirements v1.02.  
**Source repository:** https://github.com/Bomb-Daddy/Election-Model  
**Build plan:** docs/plans/ELECTION_ANALYSIS_WORKBENCH_PLAN_v1.02.md

## Verified execution evidence

| Test category | Observed | Evidence | Result |
|---|---|---|---|
| Windows 11 x64 one-click NSIS .exe **build** | Actual installer generated in successful workflow | https://github.com/Bomb-Daddy/Election-Model/actions/runs/41664215565 | PASS (creation only) |
| Linux Ubuntu 24.04 x86_64 .deb and AppImage **build** | Both actual package files generated | Same run | PASS (creation only) |
| Windows NSIS **installation and installed binary launch** on CI | NSIS silent-install and Playwright Electron launch from installed path succeeded | Same run, Windows job | PASS (automated, **not** GUI click installation) |
| Linux .deb **installation and installed binary launch** on CI | apt install of actual .deb and installed executable Playwright GUI launch succeeded | Same run, Linux job | PASS (automated, **not** GUI installer click) |
| National and Michigan calculation unit tests | 12 passed, 0 failed | Same run, both OS jobs | PASS |
| Local SQLite persistence, immutable snapshots and backups | 10 passed, 0 failed | Same run, both OS jobs | PASS |
| VoteHub mock API compatibility and cache/error tests | 5 passed, 0 failed on installed-build run; **one additional direct-array test added later** | Same run, both OS jobs | PASS for 5 at commit |
| Packaged Electron real GUI automation | 13 smoke checks passed on each OS | Same run, both OS jobs | PASS for **tested paths only** |
| Installed Electron real GUI automation | 13 smoke checks passed on each OS | Same run, both OS jobs | PASS for **tested paths only** |
| Live VoteHub free API, all polling categories and five endpoints | 6,108 polls, 10 categories, 335 pollsters, 174 subjects, get-poll-ID works | https://github.com/Bomb-Daddy/Election-Model/actions/runs/41665461742 | PASS for API connector at corrected source SHA |
| Windows standard user GUI installation by double-click | Not directly performed; NSIS silent-install used for automated verification | No evidence | NOT TESTED |
| Linux graphical software-center installation by double-click | Not directly performed; Ubuntu apt install used for automated verification | No evidence | NOT TESTED |
| Real human nontechnical-user acceptance of **every** UI function | Not performed | No evidence | NOT TESTED |
| All 435 House district inputs and full independent Michigan/RedBox/Marist IPF analysis | Not implemented and proven end-to-end on provided private source files | No complete evidence | NOT TESTED |
| Five aggregator **live** API integrations and AP Voter entitled API | Only free permitted source cards/manual import are provided; AP paid access blocked | Code/UI source | NOT TESTED as full automated integrations |

**Important source bug and correction:** Documentation depicts VoteHub `{"polls":[...]}`; live GET /polls returned a top-level array. The initial v0.1.0 preview built at `73bd602...` contains the incompatibility. Source fix commit `f70384b...` accepts both shapes; actual free API subsequently returned all 6,108 polls in `41665461742`. **Use a newer tested installer built after the fix, not the initial preview, for live VoteHub**. This is why the versioned preview tag must match the exact build SHA and actual test result.

## Real GUI control paths exercised

Projects initial local database; Poll Explorer default unrestricted types; source list with disabled paid AP; national model sliders/numeric inputs and 10% abstention + 5% crossover; immutable SQLite scenario save; native CSV picker and source provenance inspection; native JSON snapshot export; invalid cohort input rejection and visible error; Michigan calculation; dated prediction save; local QA self-check; Backup & Settings screen; Help screen. Both platforms, once for unpacked packaged binary and once for installed package, at the pre-VoteHub-source-fix build.

**Not exhaustive:** Source refresh under real network, every filter, XSLX/JSON import paths, project backup/restore through native GUI dialogs, controls in every state, app resize and keyboard-only navigation, full import migration and actual installer GUI walkthrough have not been individually verified.

## Next release gate

All applicable User Requirements v1.03 and original Political OSINT requirements v1.02 MUST be traced to functional tests on the actual end-user application and source data; unresolved/non-implemented requirements remain **FAIL/NOT TESTED**. A short passing smoke suite alone is not a valid full QA pass. Version, test fixture, real operating system, installer SHA-256, source vintage and defect reproduction must be recorded.

No paid APIs, subscription, chargeable hosting or paid model inference used. GitHub public standard-hosted runner and GitHub public release previews only. Current status **INCOMPLETE** until the full acceptance gates are satisfied.
