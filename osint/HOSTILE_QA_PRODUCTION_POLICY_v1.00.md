# Political OSINT — Mandatory Hostile QA Release Gate v1.00

Effective: 2026-11-09. This is a **required production policy**, not an optional post-production review. Applies to every broadcast, podcast, newsletter extraction, and downstream political-faction finding.

## Classification and release states

- **COLLECTED**: Original accessible source identified; publisher, URL, episode GUID, publication date, and source hash recorded. No claims of transcription accuracy.
- **ASR_PROVISIONAL**: Entire recording transcribed by Whisper; word count and final timestamp measured. Transcript is *not* certified, even when technical execution succeeds.
- **AUTOMATED_QA_PASSED**: Deterministic structural audit passes. It can check timing, completeness indicators, provenance, integrity, duplication and suspicious gaps. It **cannot** establish word-for-word accuracy.
- **HUMAN_AUDIO_QA_PASSED**: Independent adversarial audio comparison performed, evidence logged, discrepancies corrected and reviewed. This step must not be self-certified by the same model from its own transcript.
- **PRODUCTION_APPROVED**: All prior gates passed; material quotations, proper names, speaker attributions and interpretations used in database findings independently verified with source audio. Require an explicit release decision and review date.

A failure or missing QA record is **BLOCKED**, never assumed passed.

## Required hostile checks

1. **Source authenticity:** Publisher feed/URL, original publication time, unique episode identifier, audio format, duration and SHA-256. Archive recording securely where authorized. Re-downloads and dynamic ad changes must create distinguishable source versions.
2. **Coverage:** Validate timestamp bounds, chronological order, unexplained gaps, repeated or missing passages, clipped beginnings/endings, ad insertions, silence and transcript-to-audio duration mismatches. A last timestamp near the end is **not** proof that intervening speech was captured.
3. **Independent audio audit:** Review multiple clips across beginning, middle, and end, plus independently selected/random windows; verify actual spoken words while listening to the publisher audio. Record each clip's source time, reviewer, discrepancy findings and disposition. Automated second-ASR comparisons may assist, not replace the independent audit.
4. **Attribution:** Identify speakers only when verified; uncertain speakers stay **UNKNOWN**. Hosts' reporting about someone else must never be converted into that person's direct quote.
5. **High-impact claims:** Every quotation, allegation, proper name, institution, number, threat, claimed disagreement and apparent change of position used for a political finding must receive source-audio verification. Preserve context, negations, jokes/irony and quotation boundaries. Separate a guest's opinion from a host's claim and independently corroborated facts.
6. **Fracture-database hostile QA:** Search for counterevidence, reconciliation, contradicting statements, and organizational actions that disconfirm a proposed fracture. Distinguish individual opinion, media disagreement, institutional action, and inferred alignment. Do not count syndicated/duplicated episodes as independent evidence.
7. **Traceability:** Every consequential database record links source ID, audio hash, exact timestamp/segment, speaker-confidence/reviewer, verbatim-quotation verification status, and QA record. Correct errors with versioned amendments; never silently overwrite.

## Policy on artifacts and automation

- Public GitHub stores **code, technical metadata, and non-content QA results only**. Never commit full copyrighted audio, transcripts or private user data there.
- Transcript artifacts can be privately archived in the user's OSINT Google Drive. Label unreviewed materials **PROVISIONAL — NOT VERIFIED FOR QUOTATION**.
- A successful GitHub Actions job or successful Whisper execution is **not** production approval.
- Automated QA must execute in every transcription workflow and emit machine-readable gate results. Missing reviewer evidence blocks the production-approval gate, even if technical quality checks pass.
- No silently skipped episodes, no silent QA waivers, and no claims of certification based on a synthetic-only test.
