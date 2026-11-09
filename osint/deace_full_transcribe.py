#!/usr/bin/env python3
"""Full-episode Steve Deace transcription from official publisher audio.

Requires: faster-whisper, ffmpeg, ffprobe. Exports transcript files to local
runner directory for short-lived CI artifact only. Never commits transcription.
"""
import datetime as dt
import email.utils
import hashlib
import json
import subprocess
import sys
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path
from faster_whisper import WhisperModel

FEED_URL = "https://feeds.megaphone.fm/BMDC3578899879"
EXPECTED_GUID = "ce95a408-da03-11f1-a3b4-b3021ae04d6e"
OUT = Path("transcript_out")
OUT.mkdir(parents=True, exist_ok=True)
HEADERS={"User-Agent":"PoliticalOSINTFullEpisodeTranscription/1.0"}
result={"rss":FEED_URL,"guid":EXPECTED_GUID,"created_utc":dt.datetime.now(dt.timezone.utc).isoformat(),
        "status":"started","recognizer":"faster-whisper base.en CPU int8","speakers":"not diarized"}
def manifest():
    (OUT/"verification.json").write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
def ts(seconds):
    milliseconds=round(float(seconds)*1000)
    hours,m=divmod(milliseconds,3600000)
    minutes,m=divmod(m,60000)
    sec,ms=divmod(m,1000)
    return f"{hours:02}:{minutes:02}:{sec:02}.{ms:03}"
def subtitle_ts(seconds):
    return ts(seconds).replace(".",",")
try:
    with urllib.request.urlopen(urllib.request.Request(FEED_URL,headers=HEADERS),timeout=60) as r:
        if r.status!=200: raise RuntimeError(f"RSS HTTP {r.status}")
        raw=r.read(12*1024*1024)
    root=ET.fromstring(raw)
    item=next((i for i in root.find("channel").findall("item") if i.findtext("guid")==EXPECTED_GUID),None)
    if item is None: raise RuntimeError("Expected November 6 episode GUID missing from feed")
    source=item.find("enclosure").get("url")
    result["episode_title"]=item.findtext("title")
    result["published"]=item.findtext("pubDate")
    result["source_audio_enclosure"]=source
    audio=OUT/"episode_source.mp3"
    digest=hashlib.sha256()
    total=0
    with urllib.request.urlopen(urllib.request.Request(source,headers=HEADERS),timeout=120) as r, audio.open("wb") as f:
        result["audio_content_type"]=r.headers.get("Content-Type")
        while True:
            b=r.read(1024*1024)
            if not b:break
            total+=len(b)
            if total>350_000_000:raise RuntimeError("Audio over 350MB safety threshold")
            f.write(b);digest.update(b)
    if total<1_000_000: raise RuntimeError("Audio too short")
    result["audio_bytes"]=total
    result["audio_sha256"]=digest.hexdigest()
    info=subprocess.run(["ffprobe","-v","quiet","-show_entries","format=duration,format_name",
                         "-of","json",str(audio)],capture_output=True,text=True,check=True)
    fmt=json.loads(info.stdout)["format"]
    duration=float(fmt["duration"])
    result["audio_duration_seconds"]=round(duration,2)
    if duration<5600:raise RuntimeError(f"Audio unexpectedly short: {duration}s")
    wav=OUT/"episode_16khz.wav"
    subprocess.run(["ffmpeg","-v","error","-i",str(audio),"-ac","1","-ar","16000",
                    "-y",str(wav)],check=True)
    model=WhisperModel("base.en",device="cpu",compute_type="int8",cpu_threads=4)
    segments,info=model.transcribe(str(wav),language="en",beam_size=5,vad_filter=True,
        vad_parameters=dict(min_silence_duration_ms=600),condition_on_previous_text=True)
    segs=[]
    for i,s in enumerate(segments,1):
        line=s.text.strip()
        if not line:continue
        segs.append({"start":round(s.start,3),"end":round(s.end,3),"text":line})
        if i%100==0:
            print(f"TRANSCRIBED segments={i} last_time={ts(s.end)}",flush=True)
    wordcount=sum(len(s["text"].split()) for s in segs)
    end=segs[-1]["end"] if segs else 0
    result.update({"segments":len(segs),"word_count":wordcount,
                   "last_transcribed_timestamp_seconds":end,
                   "estimated_coverage_end_pct":round(100*end/duration,1)})
    # No promise of accurate attribution; full transcript machine-generated and unreviewed.
    (OUT/"transcript.txt").write_text(
        "Steve Deace Show — FINAL WORD: What Do We Make of the Midterm BEATDOWN? (2026-11-06)\n"+
        "Machine transcription: faster-whisper base.en; speaker diarization NOT performed; verify quotations against audio.\n"+
        f"Publisher RSS: {FEED_URL}\nGUID: {EXPECTED_GUID}\n"+
        "\n".join(f"[{ts(s['start'])}–{ts(s['end'])}] {s['text']}" for s in segs)+"\n",
        encoding="utf-8")
    (OUT/"transcript.srt").write_text(
        "\n".join(f"{i}\n{subtitle_ts(s['start'])} --> {subtitle_ts(s['end'])}\n{s['text']}\n"
                  for i,s in enumerate(segs,1)),encoding="utf-8")
    (OUT/"transcript_segments.json").write_text(
        json.dumps({"episode_guid":EXPECTED_GUID,"speaker_diarization":False,
                    "audio_duration_seconds":duration,"segments":segs},
                   ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    if wordcount<5000 or end<duration*0.80:
        raise RuntimeError(f"Incomplete transcription: {wordcount} words, last timestamp {end}s / {duration}s")
    result["status"]="complete_unreviewed"
except Exception as e:
    result["status"]="failed"
    result["error"]=f"{type(e).__name__}: {e}"
    raise
finally:
    manifest()
    # Remove the licensed source audio and wav before artifact upload.
    for p in (OUT/"episode_source.mp3",OUT/"episode_16khz.wav"):
        p.unlink(missing_ok=True)
    print(json.dumps(result,ensure_ascii=False,indent=2),flush=True)
