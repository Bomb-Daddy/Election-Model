#!/usr/bin/env python3
"""Fail-closed OSINT transcript QA. Transcript files stay on private runner/Drive.

This script is deterministic structural QA plus an independent reviewer evidence
gate. It does NOT pretend that automated checks certify spoken-word accuracy.
"""
import argparse
import datetime as dt
import hashlib
import json
import re
from pathlib import Path

def audit(folder):
    folder=Path(folder)
    verification=json.loads((folder/"verification.json").read_text(encoding="utf-8"))
    segments_doc=json.loads((folder/"transcript_segments.json").read_text(encoding="utf-8"))
    segs=segments_doc.get("segments",[])
    errors=[]
    warnings=[]
    def require(cond, msg):
        if not cond: errors.append(msg)
    audio_hash=verification.get("audio_sha256","")
    duration=float(verification.get("audio_duration_seconds",0))
    require(bool(re.fullmatch("[a-f0-9]{64}",audio_hash)), "Missing or invalid source audio SHA-256")
    require(bool(verification.get("guid")), "Missing publisher episode GUID")
    require(bool(verification.get("rss")), "Missing publisher RSS provenance")
    require(verification.get("status")=="complete_unreviewed", "Transcription is not complete_unreviewed")
    require(duration>=60, "Invalid audio duration")
    require(len(segs)==verification.get("segments"), "Segment count does not match manifest")
    require(len(segs)>50, "Implausibly few segments")
    require(segments_doc.get("episode_guid")==verification.get("guid"),"Transcript GUID mismatches publisher episode")
    require(abs(float(segments_doc.get("audio_duration_seconds",0))-duration)<1.0,"Manifest vs segment audio duration mismatch")
    previous_start=-1.0
    previous_end=-1.0
    gap_windows=[]
    last_text=""
    repeat_count=0
    all_words=0
    for n, segment in enumerate(segs,1):
        try:
            start=float(segment["start"])
            end=float(segment["end"])
            txt=str(segment["text"]).strip()
        except (KeyError,TypeError,ValueError):
            errors.append(f"Bad segment schema at #{n}")
            continue
        if start<0 or end<=start or end>duration+2:
            errors.append(f"Invalid or out-of-bounds timestamp at segment #{n}")
        if start<previous_start:
            errors.append(f"Non-monotonic transcript start at segment #{n}")
        if start<previous_end-4:
            warnings.append(f"Substantial timestamp overlap at segment #{n}")
        if previous_end>=0 and start-previous_end>90:
            gap_windows.append({"from_s":round(previous_end,2),"to_s":round(start,2),"gap_s":round(start-previous_end,2)})
        if not txt:
            errors.append(f"Empty text at segment #{n}")
        all_words+=len(txt.split())
        repeat_count=repeat_count+1 if txt==last_text else 1
        if repeat_count>=5:
            warnings.append(f"Repeated adjacent line at segment #{n}")
        last_text=txt
        previous_start=start
        previous_end=end
    require(all_words==verification.get("word_count"),"Word count does not match manifest")
    require(all_words>=5000,"Word count implausibly low for full episode")
    require(previous_end>=duration*0.95,"Last transcript timestamp is too far from recording end")
    if gap_windows:
        warnings.append(f"{len(gap_windows)} speech gaps greater than 90 seconds require audio review")
    if duration and segs:
        starts=[max(0, min(duration-30, duration*p)) for p in (0.02,0.20,0.40,0.60,0.80,0.96)]
        # Additional deterministic unanticipated windows seeded by source hash.
        for i in range(3):
            u=int(hashlib.sha256((audio_hash+str(i)).encode()).hexdigest()[:8],16)/0xffffffff
            starts.append(max(0,min(duration-30, duration*(0.08+0.84*u))))
        windows=[{"id":f"Q{i+1:02}","start_s":round(v,2),"end_s":round(min(duration,v+30),2),
                  "audio_compared":False,"wording_accurate":None,"speaker_attribution_accurate":None,
                  "notes":"","reviewer":""} for i,v in enumerate(starts)]
    else: windows=[]
    # This blank template cannot count as approval; reviewers must fill evidence
    # after listening directly to the exact source audio version.
    template={
        "status":"PENDING_INDEPENDENT_AUDIO_REVIEW",
        "audio_sha256":audio_hash,
        "publisher_episode_guid":verification.get("guid"),
        "reviewer":"","reviewed_utc":"",
        "sampled_windows":windows,
        "high_impact_claims_all_audio_checked":False,
        "speaker_attributions_verified_or_left_unknown":False,
        "contradictory_evidence_searched":False,
        "material_errors_corrected_and_rechecked":False,
        "approval_statement":"",
    }
    review_path=folder/"independent_audio_review.json"
    if review_path.exists():
        review=json.loads(review_path.read_text(encoding="utf-8"))
    else:
        review=template
        (folder/"independent_audio_review_template.json").write_text(
            json.dumps(template,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    required_windows={x["id"] for x in windows}
    reviewed={w.get("id"):w for w in review.get("sampled_windows",[]) if isinstance(w,dict)}
    independent_ok=(
        review.get("status")=="APPROVED_AFTER_AUDIO_REVIEW"
        and bool(review.get("reviewer")) and bool(review.get("reviewed_utc"))
        and review.get("audio_sha256")==audio_hash
        and review.get("publisher_episode_guid")==verification.get("guid")
        and required_windows.issubset(reviewed.keys())
        and all(bool(reviewed[k].get("audio_compared")) and
                reviewed[k].get("wording_accurate") is True and
                bool(reviewed[k].get("reviewer")) for k in required_windows)
        and all(review.get(k) is True for k in (
            "high_impact_claims_all_audio_checked",
            "speaker_attributions_verified_or_left_unknown",
            "contradictory_evidence_searched",
            "material_errors_corrected_and_rechecked"))
        and bool(review.get("approval_statement"))
    )
    state="BLOCKED_STRUCTURAL_QA" if errors else ("PRODUCTION_APPROVED" if independent_ok else "BLOCKED_PENDING_HOSTILE_AUDIO_QA")
    report={
        "checked_utc":dt.datetime.now(dt.timezone.utc).isoformat(),
        "episode_guid":verification.get("guid"),
        "source_audio_sha256":audio_hash,
        "technical_qa_pass":not errors,
        "independent_audio_review_pass":independent_ok,
        "production_release_allowed":bool(not errors and independent_ok),
        "release_state":state,
        "error_count":len(errors),"errors":errors,"warning_count":len(warnings),
        "warnings":warnings[:80],"large_speech_gap_windows":gap_windows[:80],
        "required_audio_sample_windows":len(windows),
        "note":"Technical completion and end timestamp do not establish factual or quote accuracy. Independent source-audio review is mandatory.",
    }
    (folder/"hostile_qa_report.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    return report

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("folder",nargs="?",default="transcript_out")
    parser.add_argument("--require-release",action="store_true")
    args=parser.parse_args()
    report=audit(args.folder)
    print(json.dumps(report,ensure_ascii=False,indent=2))
    if not report["technical_qa_pass"]:raise SystemExit(2)
    if args.require_release and not report["production_release_allowed"]:raise SystemExit(3)
if __name__=="__main__":main()
