import os, sys
from PIL import Image, ImageDraw, ImageFont

FONT_CANDIDATES = [
    "/usr/share/fonts/truetype/google-fonts/Poppins-Light.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
]

def get_font(size):
    for f in FONT_CANDIDATES:
        if os.path.exists(f):
            return ImageFont.truetype(f, size)
    return ImageFont.load_default()

def draw_tracked_text(draw, xy, text, font, fill, tracking=3):
    """Draw text with slight letter-spacing for an elegant, premium feel."""
    x, y = xy
    for ch in text:
        draw.text((x, y), ch, font=font, fill=fill)
        w = draw.textlength(ch, font=font)
        x += w + tracking

def tracked_text_width(draw, text, font, tracking=3):
    total = 0
    for ch in text:
        total += draw.textlength(ch, font=font) + tracking
    return total - tracking

def watermark(path, out_path, text="DANIA HASNAIN"):
    """
    Single, subtle, premium watermark — bottom-right corner only.
    No tiling, no diagonal repeat, no pattern. The artwork stays the hero.
    """
    base = Image.open(path).convert("RGBA")
    w, h = base.size
    overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    font_size = max(13, int(min(w, h) * 0.018))
    font = get_font(font_size)
    tracking = max(1, int(font_size * 0.12))

    tw = tracked_text_width(draw, text, font, tracking)
    pad_x = int(min(w, h) * 0.035)
    pad_y = int(min(w, h) * 0.035)

    x = w - tw - pad_x
    y = h - font_size - pad_y

    # ~7% opacity, thin white text, no background pill — stays out of the way
    draw_tracked_text(draw, (x, y), text, font, (255, 255, 255, 18), tracking)

    out = Image.alpha_composite(base, overlay)
    if out_path.lower().endswith((".jpg", ".jpeg")):
        out = out.convert("RGB")
    out.save(out_path, quality=92)
    print(f"watermarked: {out_path}")

if __name__ == "__main__":
    src, dst = sys.argv[1], sys.argv[2]
    watermark(src, dst)
