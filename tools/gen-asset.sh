#!/bin/bash
# Usage: gen-asset.sh "<prompt>" "<output_path>"
# 環境変数 GEMINI_IMAGE_API_KEY 必須
PROMPT="$1"
OUTPUT="$2"
curl -s "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent?key=$GEMINI_IMAGE_API_KEY" \
  -H 'Content-Type: application/json' \
  -d "$(python3 -c "
import json, sys
prompt = sys.argv[1]
print(json.dumps({
    'contents': [{'parts': [{'text': prompt}]}],
    'generationConfig': {'responseModalities': ['IMAGE']}
}))
" "$PROMPT")" | python3 -c "
import sys, json, base64, os
out = sys.argv[1]
try:
    resp = json.load(sys.stdin)
    parts = resp.get('candidates', [{}])[0].get('content', {}).get('parts', [])
    for part in parts:
        if 'inlineData' in part:
            data = base64.b64decode(part['inlineData']['data'])
            with open(out, 'wb') as f:
                f.write(data)
            print(f'Saved {out} ({len(data)} bytes)')
            sys.exit(0)
    print('NO_IMAGE_RETURNED', json.dumps(resp)[:300])
    sys.exit(1)
except Exception as e:
    print(f'ERROR: {e}')
    sys.exit(1)
" "$OUTPUT"
