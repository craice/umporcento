"""Generates the site icons ("1%" in Carter One on the poster yellow)."""

import io
from pathlib import Path

import requests
from PIL import Image, ImageDraw, ImageFont

DISPLAY_URL = "https://github.com/google/fonts/raw/main/ofl/carterone/CarterOne.ttf"
PAPER, RED = "#FFE600", "#E8001C"
MASTER = 512


def _font_bytes() -> bytes:
    response = requests.get(DISPLAY_URL, timeout=60)
    response.raise_for_status()
    return response.content


def draw_icon(font_data: bytes, rounded: bool = True) -> Image.Image:
    img = Image.new("RGBA", (MASTER, MASTER), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    if rounded:
        d.rounded_rectangle((0, 0, MASTER - 1, MASTER - 1), radius=MASTER // 5, fill=PAPER)
    else:
        d.rectangle((0, 0, MASTER, MASTER), fill=PAPER)
    # Largest size at which "1%" fits ~84% of the width, then centre it by its ink box.
    size = 400
    while True:
        font = ImageFont.truetype(io.BytesIO(font_data), size)
        left, top, right, bottom = d.textbbox((0, 0), "1%", font=font)
        if right - left <= MASTER * 0.84 or size <= 100:
            break
        size -= 8
    x = (MASTER - (right - left)) / 2 - left
    y = (MASTER - (bottom - top)) / 2 - top
    d.text((x, y), "1%", font=font, fill=RED)
    return img


def main(out_dir: Path = Path("public")) -> None:
    font_data = _font_bytes()
    icon = draw_icon(font_data)
    icon.save(out_dir / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])
    icon.resize((32, 32), Image.LANCZOS).save(out_dir / "favicon-32.png", optimize=True)
    # iOS applies its own rounded mask, so the touch icon is a full square.
    draw_icon(font_data, rounded=False).convert("RGB").resize((180, 180), Image.LANCZOS).save(
        out_dir / "apple-touch-icon.png", optimize=True
    )
    icon.resize((512, 512)).save(out_dir / "icon-512.png", optimize=True)
    print(f"Wrote icons to {out_dir}")


if __name__ == "__main__":
    main()
