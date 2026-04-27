"""
画像後処理: 背景除去 + 自動クロップ
Usage: python3 process-asset.py <input.png> <output.png> [--mode <keep-bg|transparent>]
"""
import sys
from PIL import Image
from collections import Counter

def detect_bg_color(img):
    w, h = img.size
    corners = [img.getpixel((0,0)), img.getpixel((w-1,0)),
               img.getpixel((0,h-1)), img.getpixel((w-1,h-1))]
    rgb_corners = [c[:3] if len(c) >= 3 else c for c in corners]
    return Counter(rgb_corners).most_common(1)[0][0]

def remove_bg(img, bg_color, tolerance=30):
    img = img.convert("RGBA")
    pixels = img.load()
    w, h = img.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            dist = abs(r-bg_color[0]) + abs(g-bg_color[1]) + abs(b-bg_color[2])
            if dist < tolerance * 3:
                pixels[x, y] = (r, g, b, 0)
    return img

def autocrop(img):
    if img.mode != "RGBA":
        img = img.convert("RGBA")
    bbox = img.getbbox()
    if bbox:
        left, top, right, bottom = bbox
        left = max(0, left - 2)
        top = max(0, top - 2)
        right = min(img.width, right + 2)
        bottom = min(img.height, bottom + 2)
        return img.crop((left, top, right, bottom))
    return img

def process(input_path, output_path, mode="transparent"):
    img = Image.open(input_path).convert("RGBA")
    original_size = img.size
    if mode == "transparent":
        bg_color = detect_bg_color(img)
        print(f"  Detected bg color: {bg_color}")
        img = remove_bg(img, bg_color, tolerance=25)
        img = autocrop(img)
        print(f"  Cropped: {original_size} -> {img.size}")
    img.save(output_path, "PNG", optimize=True)
    print(f"  Saved: {output_path}")

if __name__ == "__main__":
    input_path = sys.argv[1]
    output_path = sys.argv[2]
    mode = "transparent"
    if "--mode" in sys.argv:
        mode = sys.argv[sys.argv.index("--mode") + 1]
    process(input_path, output_path, mode)
