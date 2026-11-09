#!/usr/bin/env python3
"""One-shot publisher-RSS pilot: validates latest audio; commits metadata only."""
import datetime as dt, email.utils, hashlib, json, os, shutil, subprocess, sys, tempfile
import urllib.request, xml.etree.ElementTree as ET
from pathlib import Path

FEED = "https://feeds.megaphone.fm/BMDC3578899879"
OUT = Path("osint/results/deace_latest.json")
MAX_AUDIO = 350 * 1024 * 1024
HEADERS = {"User-Agent": "PoliticalOSINTFeedPilot/1.0 (publisher RSS test)"}
result = {"tested_utc": dt.datetime.now(dt.timezone.utc).isoformat(),
          "rss_url": FEED, "state": "failed", "steps": {}}
def save():
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
try:
    req = urllib.request.Request(FEED, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=45) as res:
        raw = res.read(12 * 1024 * 1024 + 1)
        if len(raw) > 12 * 1024 * 1024:
            raise RuntimeError("Feed exceeds size limit")
        result["steps"]["feed"] = {"status": "pass", "http_status": res.status, "bytes": len(raw), "sha256": hashlib.sha256(raw).hexdigest()}
    root = ET.fromstring(raw)
    channel = root.find("channel")
    if channel is None: raise ValueError("missing RSS channel")
    result["show"] = (channel.findtext("title") or "").strip()
    eps = []
    for x in channel.findall("item"):
        e = x.find("enclosure")
        pub = x.findtext("pubDate") or ""
        try:
            d = email.utils.parsedate_to_datetime(pub)
            if not d.tzinfo: d = d.replace(tzinfo=dt.timezone.utc)
            sort_ts = d.timestamp()
        except (ValueError, TypeError):
            sort_ts = 0
        eps.append(dict(title=x.findtext("title") or "", guid=x.findtext("guid") or "", pubDate=pub,
                        enclosure_url=e.get("url") if e is not None else None,
                        enclosure_type=e.get("type") if e is not None else None, sort_ts=sort_ts))
    eps.sort(key=lambda x:x["sort_ts"], reverse=True)
    for e in eps: e.pop("sort_ts", None)
    result["feed_episode_count"] = len(eps)
    result["recent_episodes"] = [{k:v for k,v in e.items() if k!="enclosure_url"} for e in eps[:5]]
    if not eps or not eps[0]["enclosure_url"]: raise ValueError("Missing latest enclosure")
    episode = eps[0]
    result["episode"] = episode
    result["steps"]["parse"] = {"status": "pass", "episodes": len(eps)}
    h = hashlib.sha256()
    size = 0
    with tempfile.TemporaryDirectory(prefix="deace_audio_") as d:
        file = Path(d) / "deace_latest.mp3"
        request = urllib.request.Request(episode["enclosure_url"], headers=HEADERS)
        with urllib.request.urlopen(request, timeout=120) as res, file.open("wb") as f:
            result["audio_final_url"] = res.geturl()
            result["audio_content_type"] = res.headers.get("Content-Type")
            while True:
                b = res.read(262144)
                if not b: break
                size += len(b)
                if size > MAX_AUDIO: raise ValueError("Audio larger than 350 MB")
                h.update(b); f.write(b)
        if size < 1000000: raise ValueError("Audio unexpectedly short: %d bytes" % size)
        with file.open("rb") as f: magic = f.read(4)
        if not (magic.startswith(b"ID3") or (len(magic) >= 2 and magic[0] == 255 and (magic[1] & 0xe0) == 0xe0)):
            raise ValueError("Audio does not have recognizable MP3 header")
        if shutil.which("ffprobe"):
            p = subprocess.run(["ffprobe", "-v", "error", "-show_entries",
                                "format=duration,format_name", "-of", "json", str(file)],
                               capture_output=True, text=True, timeout=80)
            if p.returncode: raise RuntimeError("ffprobe error: " + p.stderr[:500])
            info = json.loads(p.stdout).get("format", {})
            duration = float(info.get("duration", "0"))
            result["audio_duration_seconds"] = duration
            if duration < 5400: raise ValueError("Audio duration too short")
        result["steps"]["audio_download"] = {"status": "pass", "bytes": size, "sha256": h.hexdigest(), "format": "MP3"}
        result["state"] = "audio_download_pass"
except Exception as e:
    result["error"] = "%s: %s" % (type(e).__name__, e)
finally:
    save()
print(json.dumps(result, indent=2, ensure_ascii=False))
sys.exit(0 if result["state"] == "audio_download_pass" else 2)
