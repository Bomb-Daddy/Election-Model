#!/usr/bin/env python3
"""Independent ASR QA against original Deace feed audio; no audio or full transcript committed."""
import datetime as dt, email.utils, hashlib, json, subprocess, tempfile, urllib.request, traceback
import xml.etree.ElementTree as ET
from pathlib import Path
from faster_whisper import WhisperModel

RSS="https://feeds.megaphone.fm/BMDC3578899879"
O=Path("osint/results/deace_transcript_spot_check.json")
record={"checked_utc":dt.datetime.now(dt.timezone.utc).isoformat(),"rss_url":RSS,"status":"failed","method":"independent faster-whisper base.en ASR on publisher audio at 5 sample windows"}
def save():O.parent.mkdir(exist_ok=True,parents=True);O.write_text(json.dumps(record,ensure_ascii=False,indent=2)+"\n")
try:
  headers={"User-Agent":"PoliticalOSINTVerification/1.0"}
  with urllib.request.urlopen(urllib.request.Request(RSS,headers=headers),timeout=60) as q: root=ET.fromstring(q.read())
  items=root.find("channel").findall("item")
  sorted_eps=sorted(items,key=lambda x:email.utils.parsedate_to_datetime(x.findtext("pubDate")),reverse=True)
  it=sorted_eps[0]
  record["episode"]={"title":it.findtext("title"),"guid":it.findtext("guid"),"published":it.findtext("pubDate")}
  url=it.find("enclosure").get("url")
  with tempfile.TemporaryDirectory() as tmp:
    full=Path(tmp)/"audio.mp3"
    with urllib.request.urlopen(urllib.request.Request(url,headers=headers),timeout=120) as q,full.open("wb") as fp:
      while True:
        buf=q.read(1024*1024)
        if not buf:break
        fp.write(buf)
    record["audio_bytes"]=full.stat().st_size
    p=subprocess.run(["ffprobe","-v","quiet","-print_format","json","-show_format",str(full)],capture_output=True,text=True,check=True)
    dur=float(json.loads(p.stdout)["format"]["duration"])
    record["duration_seconds"]=round(dur,2)
    model=WhisperModel("base.en",device="cpu",compute_type="int8",cpu_threads=4)
    # The first two sample positions correspond to the free Podgist preview; later samples test audio speech coverage.
    checks=[("intro_ad",0,25),("host_intro",30,29),("early_program",70,28),("mid_program",2700,24),("late_program",min(int(dur-50),5400),24)]
    for label,start,seconds in checks:
      out=Path(tmp)/(label+".wav")
      subprocess.run(["ffmpeg","-hide_banner","-loglevel","error","-ss",str(start),"-t",str(seconds),
                      "-i",str(full),"-ar","16000","-ac","1","-y",str(out)],check=True)
      seg,info=model.transcribe(str(out),beam_size=5,vad_filter=False,language="en")
      speech=" ".join(s.text.strip() for s in seg).strip()
      toks=speech.split()
      record.setdefault("samples",[]).append({"label":label,"start_s":start,"length_s":seconds,
        "word_count":len(toks),"excerpt_first_16_words":" ".join(toks[:16]),
        "preview_topic_anchor_matches":{
            "simplisafe": "simplisafe" in speech.lower(),
            "steve_deace": any(t in speech.lower() for t in ["deace","dace"]),
            "happy_friday":"happy friday" in speech.lower(),
            "dallas":"dallas" in speech.lower(),
            "ottumwa":any(t in speech.lower() for t in ["ottumwa","ottumwa,","ottomwa","autumnal"]),
            "aaron":"aaron" in speech.lower(),
          }})
    record["status"]="sampled_audio_asr_completed"
except Exception as exc:
  record["error"]=str(exc)
  record["traceback"]=traceback.format_exc()[-4000:]
finally:
  save()
print(json.dumps(record,ensure_ascii=False,indent=2))
if record["status"]!="sampled_audio_asr_completed":raise SystemExit(2)
