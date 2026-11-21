#!/usr/bin/env python3
"""Convert the TekkenDocs wavu-derived CSVs (data/wavuConvertedCsv/<char>/<char>-special.csv)
into src/data/framedata.json, then validate and write a coverage report.

Usage: python3 -I scripts/import_tekkendocs.py <csv_root> <characterInfoListT8.ts> <out_json> <report_md>

Nothing is invented: empty source cells stay empty strings and are reported as gaps.
Source terms (tekkendocs README): the data may be used with credit to tekkendocs.com and rbnorway.org.
"""
import csv, glob, json, os, re, sys, collections

csv_root, info_ts, out_json, report_md = sys.argv[1:5]

# id -> display name
names = {}
try:
    txt = open(info_ts, encoding='utf-8').read()
    for m in re.finditer(r"id:\s*'([^']+)',\s*displayName:\s*'([^']+)'", txt):
        names[m.group(1)] = m.group(2)
except OSError:
    pass

TAGS = {  # wavu tag prefix -> readable property
    'hom': 'homing', 'pc': 'powercrush', 'he': 'heat engager', 'hs': 'heat smash', 'hb': 'heat burst',
    'ra': 'rage art', 'trn': 'tornado', 'spk': 'spike', 'wc': 'wall crush', 'bbr': 'wall break',
    'fbr': 'floor break', 'chp': 'chip', 'elb': 'elbow', 'kne': 'knee', 'shd': 'shoulder', 'hed': 'head',
    'hip': 'hip', 'wpn': 'weapon', 'dck': 'duckable', 'stp': 'steppable', 'intr': 'interruptible',
    'fcb': 'force crouch', 'cs': 'high crush', 'js': 'low crush', 'ps': 'parry',
}
def parse_tags(raw):
    out, unknown = [], []
    for tok in raw.split():
        key = re.match(r'[a-z]+', tok)
        key = key.group(0) if key else tok
        if key in TAGS:
            if TAGS[key] not in out: out.append(TAGS[key])
        else:
            unknown.append(tok)
    return out, unknown

LAUNCH = re.compile(r'\d\s*a')       # notation key: 'a' after a frame number = opponent launched
LEVEL_OK = re.compile(r'^[a-z!(),\s]+$', re.I)  # letters, '!', '(', ')', ',' only
NUM = re.compile(r'[+-]?\d+')

def clean_damage(s):
    s = s.strip().replace('[', '').replace(']', '').replace(';', ',')
    return re.sub(r'\s+', ' ', s)

def first_int(s):
    m = NUM.search(s or '')
    return int(m.group(0)) if m else None

characters, problems, stats = [], [], {}
seen_ids = collections.Counter()
for d in sorted(os.listdir(csv_root)):
    files = glob.glob(os.path.join(csv_root, d, '*.csv'))
    if not files:
        problems.append((d, '-', 'no csv file')); continue
    moves = []
    cov = collections.Counter()
    for f in sorted(files):
        for i, r in enumerate(csv.DictReader(open(f, newline='', encoding='utf-8'), delimiter=';')):
            tags, unknown = parse_tags(r['Tags'])
            hit, ch = r['Hit frame'].strip(), r['Counter hit frame'].strip()
            if LAUNCH.search(hit) or LAUNCH.search(ch):
                tags.append('launcher')
            mv = {
                'id': f"{d}-{len(moves)}",
                'notation': r['Command'].strip(),
                'hitLevel': r['Hit level'].strip(),
                'startup': r['Start up frame'].strip(),
                'onBlock': r['Block frame'].strip(),
                'onHit': hit,
                'onCounterHit': ch,
                'damage': clean_damage(r['Damage']),
                'tags': tags,
            }
            if r['Name'].strip(): mv['name'] = r['Name'].strip()
            if r['Notes'].strip(): mv['notes'] = r['Notes'].strip()
            if r['Wavu id'].strip(): mv['sourceId'] = r['Wavu id'].strip()
            seen_ids[mv['sourceId'] if 'sourceId' in mv else mv['id']] += 0
            # validation
            where = f"{mv['notation']}"
            if not mv['notation']: problems.append((d, where, 'empty notation'))
            for fld in ('hitLevel', 'startup', 'onBlock', 'onHit', 'onCounterHit', 'damage'):
                if mv[fld]: cov[fld] += 1
            if mv['startup'] and first_int(mv['startup']) is None: problems.append((d, where, f"startup unparseable: {mv['startup']!r}"))
            if mv['startup'] and first_int(mv['startup']) is not None and not (1 <= first_int(mv['startup']) <= 120):
                problems.append((d, where, f"startup out of range: {mv['startup']!r}"))
            if mv['onBlock'] and mv['onBlock'] != '!' and first_int(mv['onBlock']) is None: problems.append((d, where, f"block unparseable: {mv['onBlock']!r}"))
            if mv['onBlock'] and first_int(mv['onBlock']) is not None and abs(first_int(mv['onBlock'])) > 40:
                problems.append((d, where, f"block out of range: {mv['onBlock']!r}"))
            if mv['hitLevel'] and not LEVEL_OK.match(mv['hitLevel']): problems.append((d, where, f"unusual hit level: {mv['hitLevel']!r}"))
            if unknown: cov['unknown_tag_tokens'] += 1
            moves.append(mv)
    # duplicates by source id
    dup = [k for k, v in collections.Counter(m.get('sourceId') for m in moves if m.get('sourceId')).items() if v > 1]
    for k in dup: problems.append((d, k, 'duplicate source id'))
    characters.append({'id': d, 'name': names.get(d, d.replace('-', ' ').title()), 'moves': moves})
    stats[d] = (len(moves), cov)

out = {
    'meta': {
        'game': 'Tekken 8',
        'isSample': False,
        'source': 'TekkenDocs wavu-derived CSV export (tekkendocs.com), originally from wavu.wiki',
        'attribution': 'Frame data from tekkendocs.com and rbnorway.org (per tekkendocs terms: data may be used with credit). Underlying data: wavu.wiki. Tekken is a trademark of Bandai Namco; this app is unofficial.',
    },
    'characters': characters,
}
os.makedirs(os.path.dirname(out_json), exist_ok=True)
json.dump(out, open(out_json, 'w', encoding='utf-8'), indent=1, ensure_ascii=False)

with open(report_md, 'w', encoding='utf-8') as f:
    tot = sum(v[0] for v in stats.values())
    f.write(f"# Import report\n\nCharacters: {len(characters)}  \nMoves: {tot}  \nFlagged issues: {len(problems)}\n\n")
    f.write("## Coverage per character (% of moves with a non-empty value)\n\n| Character | Moves | Level | Startup | Block | Hit | CH | Damage |\n|---|---|---|---|---|---|---|---|\n")
    for d, (n, cov) in stats.items():
        p = lambda k: f"{100*cov[k]//max(n,1)}%"
        f.write(f"| {d} | {n} | {p('hitLevel')} | {p('startup')} | {p('onBlock')} | {p('onHit')} | {p('onCounterHit')} | {p('damage')} |\n")
    f.write("\nCH is empty for most moves in the source (it only lists counter-hit data when it differs).\n\n## Flagged issues\n\n")
    for d, w, msg in problems[:500]:
        f.write(f"- {d} / {w}: {msg}\n")
    if len(problems) > 500: f.write(f"- ... {len(problems)-500} more\n")
print(f"characters={len(characters)} moves={tot} issues={len(problems)}")
