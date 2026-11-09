#!/usr/bin/env python3
"""Hostile QA gate unit tests — no copyrighted test data."""
import json
import tempfile
import unittest
from pathlib import Path
from transcript_hostile_qa_gate import audit

def make_fixture(root):
    root=Path(root)
    duration=1000.0
    segs=[]
    for i in range(70):
        start=round(i*(duration/70),3)
        end=round(min(duration,start+duration/70),3)
        segs.append({"start":start,"end":end,"text":("Test audio content with distinct statement " + str(i) + " ") * 16})
    words=sum(len(x["text"].split()) for x in segs)
    v={"status":"complete_unreviewed","guid":"episode-fixture-001",
       "rss":"https://publisher.example/feed.xml","audio_sha256":"a"*64,
       "audio_duration_seconds":duration,"word_count":words,"segments":len(segs)}
    d={"episode_guid":v["guid"],"audio_duration_seconds":duration,"segments":segs}
    (root/"verification.json").write_text(json.dumps(v))
    (root/"transcript_segments.json").write_text(json.dumps(d))

class HostileQATests(unittest.TestCase):
    def test_transcribed_not_certified(self):
        with tempfile.TemporaryDirectory() as t:
            make_fixture(t)
            r=audit(t)
            self.assertTrue(r["technical_qa_pass"])
            self.assertFalse(r["production_release_allowed"])
            self.assertEqual(r["release_state"],"BLOCKED_PENDING_HOSTILE_AUDIO_QA")
            self.assertTrue((Path(t)/"independent_audio_review_template.json").exists())
    def test_source_provenance_missing_blocks(self):
        with tempfile.TemporaryDirectory() as t:
            make_fixture(t)
            p=Path(t)/"verification.json"
            data=json.loads(p.read_text());data["audio_sha256"]=""
            p.write_text(json.dumps(data))
            r=audit(t)
            self.assertFalse(r["technical_qa_pass"])
            self.assertEqual(r["release_state"],"BLOCKED_STRUCTURAL_QA")
    def test_timestamp_out_of_bounds_blocks(self):
        with tempfile.TemporaryDirectory() as t:
            make_fixture(t)
            p=Path(t)/"transcript_segments.json"
            data=json.loads(p.read_text())
            data["segments"][0]["end"]=2000
            p.write_text(json.dumps(data))
            r=audit(t)
            self.assertFalse(r["technical_qa_pass"])
    def test_unreviewed_sample_blocks_even_with_claimed_approval(self):
        with tempfile.TemporaryDirectory() as t:
            make_fixture(t)
            audit(t)
            f=Path(t)/"independent_audio_review_template.json"
            review=json.loads(f.read_text())
            review.update({"status":"APPROVED_AFTER_AUDIO_REVIEW",
              "reviewer":"Test auditor","reviewed_utc":"2026-11-09T00:00:00Z",
              "exact_source_recording_archived_privately":True,
              "source_recording_archive_reference":"private://testing/sha",
              "high_impact_claims_all_audio_checked":True,
              "speaker_attributions_verified_or_left_unknown":True,
              "contradictory_evidence_searched":True,
              "material_errors_corrected_and_rechecked":True,
              "approval_statement":"Synthetic test only"})
            for w in review["sampled_windows"]:
                w.update({"reviewer":"Test auditor","audio_compared":True,"wording_accurate":True})
            review["sampled_windows"][0]["audio_compared"]=False
            (Path(t)/"independent_audio_review.json").write_text(json.dumps(review))
            r=audit(t)
            self.assertFalse(r["production_release_allowed"])
    def test_documented_full_review_can_pass_structural_gate(self):
        with tempfile.TemporaryDirectory() as t:
            make_fixture(t)
            audit(t)
            review=json.loads((Path(t)/"independent_audio_review_template.json").read_text())
            review.update({"status":"APPROVED_AFTER_AUDIO_REVIEW",
              "reviewer":"Test auditor","reviewed_utc":"2026-11-09T00:00:00Z",
              "exact_source_recording_archived_privately":True,
              "source_recording_archive_reference":"private://testing/sha",
              "high_impact_claims_all_audio_checked":True,
              "speaker_attributions_verified_or_left_unknown":True,
              "contradictory_evidence_searched":True,
              "material_errors_corrected_and_rechecked":True,
              "approval_statement":"Synthetic test of supplied signed QA attestation; not an audio review"})
            for w in review["sampled_windows"]:
                w.update({"reviewer":"Test auditor","audio_compared":True,"wording_accurate":True})
            (Path(t)/"independent_audio_review.json").write_text(json.dumps(review))
            r=audit(t)
            self.assertTrue(r["technical_qa_pass"])
            self.assertTrue(r["production_release_allowed"])
if __name__=="__main__":
    unittest.main(verbosity=2)
