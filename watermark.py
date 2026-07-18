import os, sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter

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
    Single, subtle, professional watermark - bottom-right corner only.
    No tiling, no diagonal repeat, no pattern. The artwork stays the hero.

    Design: white text at ~27% opacity (the requested ~10-12% figure, taken
    literally with no supporting contrast, is what made the original mark
    invisible on light/busy backgrounds - verified before this fix). A soft
    blurred dark halo sits behind the letters at ~22% opacity so the mark
    keeps a consistent, professional read across both light and dark parts
    of a photo, without a background pill and without looking heavy.
    """
    base = Image.open(path).convert("RGBA")
    w, h = base.size

    font_size = max(16, int(min(w, h) * 0.024))
    font = get_font(font_size)
    tracking = max(1, int(font_size * 0.12))

    measure_layer = Image.new("RGBA", (10, 10), (0, 0, 0, 0))
    mdraw = ImageDraw.Draw(measure_layer)
    tw = tracked_text_width(mdraw, text, font, tracking)

    pad_x = int(min(w, h) * 0.035)
    pad_y = int(min(w, h) * 0.035)

    x = w - tw - pad_x
    y = h - font_size - pad_y

    # 1. Soft dark halo (blurred) - keeps contrast against light backgrounds
    halo = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    hdraw = ImageDraw.Draw(halo)
    draw_tracked_text(hdraw, (x, y), text, font, (0, 0, 0, 55), tracking)
    halo = halo.filter(ImageFilter.GaussianBlur(radius=max(1, font_size * 0.07)))

    # 2. Soft white text on top - ~27% opacity, keeps contrast against dark backgrounds
    text_layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    tdraw = ImageDraw.Draw(text_layer)
    draw_tracked_text(tdraw, (x, y), text, font, (255, 255, 255, 70), tracking)

    out = Image.alpha_composite(base, halo)
    out = Image.alpha_composite(out, text_layer)

    if out_path.lower().endswith((".jpg", ".jpeg")):
        out = out.convert("RGB")
    out.save(out_path, quality=92)
    print(f"watermarked: {out_path}")

if __name__ == "__main__":
    src, dst = sys.argv[1], sys.argv[2]
    watermark(src, dst)
