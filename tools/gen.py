"""Generate image via Nano Banana 2.
Usage: python3 gen.py <output.png> "<prompt>"
"""
import sys, os, json, base64, urllib.request, urllib.error

api_key = os.environ.get("GEMINI_IMAGE_API_KEY") or os.environ.get("GEMINI_API_KEY")
if not api_key:
    print("ERROR: GEMINI_IMAGE_API_KEY not set", file=sys.stderr)
    sys.exit(2)

out = sys.argv[1]
prompt = sys.argv[2]

url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent?key={api_key}"
payload = {
    "contents": [{"parts": [{"text": prompt}]}],
    "generationConfig": {"responseModalities": ["IMAGE"]}
}
req = urllib.request.Request(url, data=json.dumps(payload).encode(), headers={"Content-Type": "application/json"})
try:
    with urllib.request.urlopen(req, timeout=60) as resp:
        data = json.loads(resp.read())
except urllib.error.HTTPError as e:
    print(f"HTTP ERROR {e.code}: {e.read()[:300].decode(errors='ignore')}", file=sys.stderr)
    sys.exit(1)
except Exception as e:
    print(f"ERROR: {e}", file=sys.stderr)
    sys.exit(1)

parts = data.get("candidates", [{}])[0].get("content", {}).get("parts", [])
for part in parts:
    if "inlineData" in part:
        b = base64.b64decode(part["inlineData"]["data"])
        with open(out, "wb") as f:
            f.write(b)
        print(f"Saved {out} ({len(b)} bytes)")
        sys.exit(0)

# Try alternative model name fallback
print(f"NO_IMAGE: {json.dumps(data)[:400]}", file=sys.stderr)
sys.exit(1)
