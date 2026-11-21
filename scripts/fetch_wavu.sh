#!/usr/bin/env bash
# Run this on a machine that can reach wavu.wiki (the build sandbox cannot: its proxy returns 403).
# Step 1 discovers the Cargo tables/fields; step 2 dumps the Move table to wavu_moves.json.
# Wavu text content is CC0 (see wavu.wiki footer); game content belongs to Bandai Namco.
set -euo pipefail
API="https://wavu.wiki/w/api.php"
UA="t8-frames-importer (personal project)"
curl -sS -A "$UA" "$API?action=cargotables&format=json" -o wavu_tables.json
curl -sS -A "$UA" "$API?action=cargofields&table=Move&format=json" -o wavu_move_fields.json
echo "Wrote wavu_tables.json and wavu_move_fields.json"
: > wavu_moves.ndjson
offset=0
while :; do
  curl -sS -A "$UA" -G "$API" --data-urlencode "action=cargoquery" --data-urlencode "tables=Move" \
    --data-urlencode "fields=_pageName=page,id,name,input,target,damage,startup,block,hit,ch,notes" \
    --data-urlencode "limit=500" --data-urlencode "offset=$offset" --data-urlencode "format=json" -o page.json
  n=$(python3 -c "import json;print(len(json.load(open('page.json')).get('cargoquery',[])))")
  [ "$n" -eq 0 ] && break
  cat page.json >> wavu_moves.ndjson; echo >> wavu_moves.ndjson
  offset=$((offset+500)); sleep 1
done
rm -f page.json
echo "Done: wavu_moves.ndjson (field names in the query are a best guess; check wavu_move_fields.json and fix 'fields=' if the API reports unknown fields)"
