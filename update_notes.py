#!/usr/bin/env python3
"""noteの最新記事を取得して data/notes.js に書き出す。
実行: python3 update_notes.py
失敗したときは、前回の data/notes.js をそのまま残す。"""
import re, sys, time, json, html, urllib.request
import xml.etree.ElementTree as ET
from email.utils import parsedate_to_datetime
from datetime import timezone, timedelta
from pathlib import Path

RSS = "https://note.com/toki_skyxros/rss"
LIMIT = 6
EXCLUDE = []        # 表示したくない記事のURLをここに書く
JST = timezone(timedelta(hours=9))
MEDIA = "{http://search.yahoo.com/mrss/}thumbnail"

def fetch():
    req = urllib.request.Request(RSS, headers={"User-Agent": "Mozilla/5.0"})
    for i in range(3):
        try:
            with urllib.request.urlopen(req, timeout=20) as r:
                return r.read()
        except Exception as e:
            print(f"取得失敗({i+1}/3): {e}")
            time.sleep(2)
    return None

def text(s):
    s = re.sub(r"<[^>]+>", " ", s or "")
    return re.sub(r"\s+", " ", html.unescape(s)).strip()

data = fetch()
if not data:
    print("noteを取得できなかったため、data/notes.js は変更しません。")
    raise SystemExit(1)

items = []
for it in ET.fromstring(data).iter("item"):
    link = (it.findtext("link") or "").strip()
    if not link.startswith("https://note.com/") or link in EXCLUDE:     # note の記事URL以外は使わない
        continue
    dt = parsedate_to_datetime(it.findtext("pubDate")).astimezone(JST)
    th = it.find(MEDIA)
    img = th.text.strip() if th is not None and th.text else ""
    items.append({
        "date": dt.strftime("%Y.%m.%d"),
        "title": text(it.findtext("title")),
        "url": link,
        "img": img if img.startswith("https://assets.st-note.com/") else "",
    })
items = items[:LIMIT]
if not items:
    print("記事が0件だったため、data/notes.js は変更しません。")
    raise SystemExit(1)

out = Path(__file__).parent / "data" / "notes.js"
stamp = time.strftime("%Y-%m-%d %H:%M", time.localtime())
out.write_text(f'window.NOTES_UPDATED = "{stamp}";\nwindow.NOTES = {json.dumps(items, ensure_ascii=False, indent=1)};\n', encoding="utf-8")
print(f"{len(items)}件を書き出しました: {out}")
