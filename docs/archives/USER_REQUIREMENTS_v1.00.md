# Election Model — User Requirements

**Version:** 1.00  
**Added:** 2026-11-02  
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

**Scope note:** This file establishes the user's explicit QA coverage rule in the Election-Model repository. It is **not** an assertion that every earlier Election Model requirement has already been collected, implemented, or tested. A complete requirements inventory must be assembled and reconciled before claiming an exhaustive QA pass.
