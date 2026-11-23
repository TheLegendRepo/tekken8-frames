#!/usr/bin/env python3
"""Attach move clips (wavu.wiki first, then tekkendocs.com) to src/data/framedata.json.

Each move in the app carries a `sourceId` that is its wavu Move id (e.g. "Alisa-1,2").
wavu's Cargo `Move` table has a `video` field naming the clip file, and `list=allimages`
gives each file's direct URL. We store that URL as `clipUrl` so the app streams it;
no MP4s are bundled.

wavu has no clips for some characters (Bob, Roger Jr., Armor King, ...). tekkendocs.com
hosts its own clips for those on its CDN; its character pages embed each move's wavu id and
clip file name, and its move pages' og:video tag shows the CDN URL pattern (size suffix such
as "-426" varies per character). Those moves get the tekkendocs URL and clipSource "tekkendocs".

When a move has no clip of its own from either site but a longer string that starts with it does
(e.g. "1" has none, "1,1" has one), we use the string's clip and set `clipFrom` to
that string's notation so the app can say what the clip shows.

Usage: python3 -I scripts/import_clips.py   (writes framedata.json and scripts/clip_coverage.md)
Wavu text content is CC0; tekkendocs allows using its data with credit. Clips are
recordings of Tekken 8 (Bandai Namco).
"""
import collections
import json
import os
import re
import time
import urllib.parse
import urllib.request

API = "https://wavu.wiki/w/api.php"
UA = "t8-frames-importer (personal project)"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "src", "data", "framedata.json")
REPORT = os.path.join(ROOT, "scripts", "clip_coverage.md")


def get(params):
    url = API + "?" + urllib.parse.urlencode({**params, "format": "json"})
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                return json.load(r)
        except Exception:
            if attempt == 3:
                raise
            time.sleep(2 ** attempt)


def wavu_moves():
    rows, offset = [], 0
    while True:
        d = get({"action": "cargoquery", "tables": "Move", "fields": "id,video,parent",
                 "limit": 500, "offset": offset})
        page = [r["title"] for r in d.get("cargoquery", [])]
        if not page:
            return rows
        rows += page
        offset += 500
        time.sleep(0.5)


def wavu_videos():
    files, cont = {}, {}
    while True:
        d = get({"action": "query", "list": "allimages", "aimime": "video/mp4",
                 "ailimit": 500, "aiprop": "url", **cont})
        for i in d["query"]["allimages"]:
            files[i["name"].lower()] = i["url"]
        if "continue" not in d:
            return files
        cont = d["continue"]
        time.sleep(0.5)


TD = "https://tekkendocs.com/t8/"
TD_CDN = "https://tekkendocs.b-cdn.net/t8/videos/"


def fetch_html(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (t8-frames-importer)"})
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                return r.read().decode("utf-8")
        except Exception:
            if attempt == 3:
                raise
            time.sleep(2 ** attempt)


def turbo_decode(html):
    """Decode the React Router turbo-stream payload embedded in a tekkendocs page."""
    m = re.search(r'enqueue\(("(?:[^"\\]|\\.)*")\)', html)
    if not m:
        return None
    arr = json.loads(json.loads(m.group(1)).split("\n")[0])
    memo = {}

    def h(i):
        if not isinstance(i, int) or i < 0:
            return None
        if i in memo:
            return memo[i]
        v = arr[i]
        if isinstance(v, dict):
            o = memo[i] = {}
            for k, vi in v.items():
                o[arr[int(k[1:])]] = h(vi)
            return o
        if isinstance(v, list):
            if v and isinstance(v[0], str) and len(v[0]) == 1:  # typed value (date, promise, ...)
                return None
            lst = memo[i] = []
            lst.extend(h(x) for x in v)
            return lst
        memo[i] = v
        return v

    return h(0)


def td_moves(node, acc):
    if isinstance(node, dict):
        if "moveNumber" in node and "video" in node and "id" in node:
            acc.append(node)
        for v in node.values():
            td_moves(v, acc)
    elif isinstance(node, list):
        for v in node:
            td_moves(v, acc)
    return acc


def tekkendocs_clips(char_id):
    """{wavu move id: (clip URL, id of the move the clip belongs to)} from tekkendocs.

    tekkendocs often gives a move the clip of a longer string (e.g. "1" shows "1,1"). When several
    moves share a clip, the one whose input ends the file name (or else the longest) owns it.
    """
    moves = [m for m in td_moves(turbo_decode(fetch_html(TD + char_id)), []) if m.get("video")]
    stem = lambda v: v.split(":", 1)[-1].strip()[: -len(".mp4")] if v.strip().endswith(".mp4") else None
    suffix = None
    # Find the CDN size suffix from a move page's og:video tag (the site picks it per character).
    for m in sorted(moves, key=lambda m: len(m["command"]))[:5]:
        page = fetch_html(TD + char_id + "/" + urllib.parse.quote(m["command"], safe=""))
        og = re.search(r'og:video:url" content="([^"]*)"', page)
        s = stem(m["video"])
        if og and s:
            prefix = TD_CDN + char_id + "/" + s
            if og.group(1).startswith(prefix) and og.group(1).endswith(".mp4"):
                suffix = og.group(1)[len(prefix): -len(".mp4")]
                break
        time.sleep(0.3)
    if suffix is None:
        return {}
    groups = collections.defaultdict(list)
    for m in moves:
        s = stem(m["video"])
        if s:
            groups[s].append(m)
    out = {}
    for s, ms in groups.items():
        url = TD_CDN + char_id + "/" + urllib.parse.quote(s + suffix + ".mp4", safe=",+()!'")
        named = [m for m in ms if s.lower().endswith("-" + m["command"].lower())]
        owner = max(named or ms, key=lambda m: len(m["command"]))["id"]
        for m in ms:
            out[m["id"]] = (url, owner)
    return out


def main():
    rows, files = wavu_moves(), wavu_videos()
    by_id = {r["id"]: r for r in rows}
    kids = collections.defaultdict(list)
    for r in rows:
        if r.get("parent"):
            kids[r["parent"]].append(r["id"])

    data = json.load(open(DATA, encoding="utf-8"))
    td = {}
    for ch in data["characters"]:
        try:
            td.update(tekkendocs_clips(ch["id"]))
        except Exception as e:  # tekkendocs is a fallback; keep wavu results if it fails
            print("tekkendocs failed for", ch["id"], e)
        time.sleep(0.3)

    def wavu_url(move_id):
        v = (by_id.get(move_id) or {}).get("video") or ""
        name = v.split(":", 1)[-1].strip().replace(" ", "_")
        # A few wavu pages omit the .mp4 extension in the video field.
        return files.get(name.lower()) or files.get((name + ".mp4").lower()) if name else None

    def own_clip(move_id):
        url = wavu_url(move_id)
        if url:
            return url, "wavu"
        if move_id in td and td[move_id][1] == move_id:
            return td[move_id][0], "tekkendocs"
        return None

    def string_clip(move_id, seen=frozenset()):
        """Shortest follow-up string (breadth first) that has its own clip."""
        children = sorted(kids[move_id], key=len)
        for k in children:
            if own_clip(k):
                return k
        for k in children:
            if k not in seen:
                found = string_clip(k, seen | {move_id})
                if found:
                    return found
        return None

    stats = collections.Counter()
    per_char = []
    missing = collections.defaultdict(list)
    for ch in data["characters"]:
        own = fb = n_td = 0
        for m in ch["moves"]:
            for k in ("clipUrl", "clipFrom", "clipSource"):
                m.pop(k, None)
            sid = m.get("sourceId") or ""
            clip = own_clip(sid)
            alt = None
            if not clip and sid in by_id:
                alt = string_clip(sid)
                clip = own_clip(alt) if alt else None
            if not clip and sid in td:  # tekkendocs shows a longer string's clip for this move
                alt = td[sid][1]
                clip = (td[sid][0], "tekkendocs")
            if not clip:
                missing[ch["name"]].append(m["notation"])
                continue
            m["clipUrl"], m["clipSource"] = clip
            if alt:
                m["clipFrom"] = alt[len(sid.split("-", 1)[0]) + 1:]
                fb += 1
            else:
                own += 1
            n_td += clip[1] == "tekkendocs"
        stats["own"] += own
        stats["fallback"] += fb
        stats["tekkendocs"] += n_td
        stats["total"] += len(ch["moves"])
        per_char.append((ch["name"], len(ch["moves"]), own, fb, n_td))

    with open(DATA, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=1)

    none = stats["total"] - stats["own"] - stats["fallback"]
    pct = lambda n: f"{100 * n / stats['total']:.0f}%"
    out = [
        "# Move clip coverage",
        "",
        f"Generated by `scripts/import_clips.py` on {time.strftime('%Y-%m-%d')}.",
        "",
        f"- Moves: {stats['total']}",
        f"- Own clip: {stats['own']} ({pct(stats['own'])})",
        f"- Clip of a longer string that starts with the move: {stats['fallback']} ({pct(stats['fallback'])})",
        f"- Of all clips, {stats['tekkendocs']} come from tekkendocs.com and the rest from wavu.wiki",
        f"- No clip: {none} ({pct(none)})",
        "",
        "| Character | Moves | Own clip | String clip | No clip | From tekkendocs |",
        "|---|---:|---:|---:|---:|---:|",
    ]
    for name, n, own, fb, n_td in per_char:
        out.append(f"| {name} | {n} | {own} | {fb} | {n - own - fb} | {n_td} |")
    out += ["", "## Moves with no clip", ""]
    for name, *_ in per_char:
        if missing[name]:
            out.append(f"**{name}** ({len(missing[name])}): " + ", ".join(f"`{x}`" for x in missing[name]))
            out.append("")
    with open(REPORT, "w", encoding="utf-8") as f:
        f.write("\n".join(out))
    print(dict(stats), "none:", none)


if __name__ == "__main__":
    main()
