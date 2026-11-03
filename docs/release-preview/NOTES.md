# Election Analysis Workbench v0.1.0 — Early Test Build

**TEST BUILD — QA INCOMPLETE — NOT A CERTIFIED RELEASE.**
The project follows a strict rule: a build is not complete until every applicable user requirement is implemented and tested on the installed Windows and Linux applications. This preview does not meet that release gate.

## Download/install

**Windows 11 x64:** Download the attached `Election Analysis Workbench Setup 0.1.0.exe`, then double-click the installer. Windows may show an unsigned/SmartScreen warning because this free, public preview is not code-signed. Do not bypass a warning unless you trust this repository and understand what you're installing. Once installed, open the Start-menu application.

**Linux x86_64 (Ubuntu 24.04 / compatible Debian-family):** Download the `election-analysis-workbench_0.1.0_amd64.deb`. Open it with the distribution's graphical software installer, then launch **Election Analysis Workbench** from the application menu. The AppImage is provided as an alternative portable image; its double-click execution and desktop integration vary by distro, so prefer .deb on a compatible supported distro.

No external Node, Python, database-server or API-configuration installation is required on the end user's machine. The app uses local SQLite and is usable offline for saved projects and scenarios.

## What works in this preview

- Local projects, data snapshots and scenario version history.
- VoteHub free individual-polls REST integration with **all polling types by default**, optional filters, source metadata and a visible manual Refresh control.
- Authorized local CSV, XLSX and JSON imports.
- National generic ballot / hypothetical Republican abstention, crossover, third-party and extra Democratic turnout arithmetic. Clear denominators and conditional-result labels.
- Michigan dated turnout and age-coherence example scenario.
- Dated prediction register and amendments.
- Local project backup/export and QA self-check panel.

## What is *not* complete

- Full Silver Bulletin, RealClearPolling, FiftyPlusOne, DDHQ and Race to the WH **automatic API integration**. These have source listings and authorized local imports; paid or unverified connections remain disabled.
- AP "Voter" API: provider identity/paid subscriber entitlement must be resolved; not enabled under the strict **$0 new cost** requirement.
- Full private-source RedBox and Marist IPF datasets and Michigan observed election-day calibration, and all 435 House district historical inputs. They must be imported privately with appropriate rights, never published in this public repository.
- Installed app has not yet passed a real human first-time-user evaluation of **every** UI control, nor comprehensive graphical one-click installation testing on all supported configurations.
- Live VoteHub upstream availability is separately recorded; network/polling coverage can change. Poll averages must not be conflated with single survey observations.
- Full hostile QA, code signing, broader compatibility and historical prediction validation.

## QA evidence

Published source and test history: https://github.com/Bomb-Daddy/Election-Model/actions/workflows/build-desktop.yml

To prevent false assurance, CI passing a packaged GUI smoke test does not equal complete release QA. Any remaining applicable unverified requirement keeps release status **INCOMPLETE**.

**Cost:** $0 additional subscription, API, cloud hosting or development fees are required by the software. Third-party internet connectivity or the user's existing computer/ISP are external.
**Licensing:** VoteHub responses CC BY 4.0, attribution required. Other providers must respect their own licenses.
**Privacy:** Synthetic fixtures only in the public GitHub repository; private voter or polling files stay on the user's device.
