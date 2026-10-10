#!/usr/bin/env python3
"""TimeTree の公開カレンダー（SKYXROS）から、これからの予定を取り、data/live.js を作り直す。
使い方: python3 update_live.py   （標準ライブラリだけで動く）

注意: TimeTree が公式に公開しているAPIではなく、公開カレンダーのページが使っているデータを読んでいる。
      仕様が変わると取れなくなる。取れなかったときは live.js を空にして、サイトは「NEXT LIVE」ボタンだけで動く。"""
import json, re, time, urllib.request
from datetime import datetime, timezone, timedelta
from pathlib import Path

ALIAS   = "skyxros0511"
URL     = f"https://timetreeapp.com/api/v2/public_calendars/{ALIAS}/public_events"
OUT     = Path(__file__).parent / "data" / "live.js"
LIMIT   = 12                      # 取っておく件数（サイト側で、今日以降の先頭3件だけを表示する）
EXCLUDE = []                      # ここに入れた語を含む予定は表示しない（例: ["解散"]）
JST     = timezone(timedelta(hours=9))
DOW     = ["MON","TUE","WED","THU","FRI","SAT","SUN"]
EMOJI   = re.compile("[\U0001F000-\U0001FFFF☀-➿⬀-⯿️‍]+")

def fetch():
    # 一時的な失敗に備えて3回までやり直す（TimeTree側のヘッダー要求にも合わせる）
    last = None
    for i in range(3):
        try:
            req = urllib.request.Request(URL, headers={"User-Agent": "Mozilla/5.0", "Accept": "application/json",
                                                       "X-TimeTreeA": "web/2.1.0/ja"})
            return json.load(urllib.request.urlopen(req, timeout=20))["public_events"]
        except Exception as ex:
            last = ex; time.sleep(2 * (i + 1))
    raise last

def main():
    items = []
    try:
        today = datetime.now(JST).replace(hour=0, minute=0, second=0, microsecond=0)
        for e in sorted(fetch(), key=lambda e: e.get("start_at", 0)):
            d = datetime.fromtimestamp(e["start_at"]/1000, JST)
            title = re.sub(r"\s+", " ", EMOJI.sub(" ", e.get("title",""))).strip()
            if d < today or not title or any(w in title for w in EXCLUDE): continue
            items.append({"date": d.strftime("%Y.%m.%d"), "dow": DOW[d.weekday()], "title": title,
                          "place": (e.get("location_name") or "").strip()})
    except Exception as ex:
        print("取得に失敗（前回の live.js をそのまま残します）:", ex)
        raise SystemExit(1)
    items = items[:LIMIT]
    OUT.parent.mkdir(exist_ok=True)
    stamp = datetime.now(JST).strftime("%Y-%m-%d %H:%M")
    OUT.write_text(f"window.LIVE_UPDATED = {json.dumps(stamp)};\nwindow.LIVE = " + json.dumps(items, ensure_ascii=False, indent=2) + ";\n", encoding="utf-8")
    print(f"{len(items)}件 → {OUT}")

main()
