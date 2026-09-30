"""Generates the static Open Graph image (1200x630) using Londrina Solid."""

import io
from pathlib import Path

import requests
from PIL import Image, ImageDraw, ImageFont

FONT_URL = "https://github.com/google/fonts/raw/main/ofl/londrinasolid/LondrinaSolid-{weight}.ttf"
PAPER, RED, INK = "#FFE600", "#E8001C", "#141414"


def font(weight: str, size: int) -> ImageFont.FreeTypeFont:
    data = requests.get(FONT_URL.format(weight=weight), timeout=60).content
    return ImageFont.truetype(io.BytesIO(data), size)


def main(out: Path = Path("public/og.png")) -> None:
    img = Image.new("RGB", (1200, 630), PAPER)
    d = ImageDraw.Draw(img)
    d.text((70, 60), "UMPORCENTO", font=font("Regular", 44), fill=INK)
    d.rounded_rectangle((900, 52, 1130, 112), radius=6, fill=RED)
    d.text((922, 58), "PNAD · IBGE", font=font("Black", 40), fill="#FFFFFF")
    d.text((70, 150), "ONDE VOCÊ ESTÁ", font=font("Black", 120), fill=INK)
    d.text((70, 270), "NA RENDA DO BRASIL?", font=font("Black", 120), fill=RED)
    d.text((70, 440), "Compare sua renda com a de quem trabalha no país.", font=font("Regular", 44), fill=INK)
    d.text((70, 500), "Dados do IBGE. Nada sai do seu navegador.", font=font("Regular", 44), fill=INK)
    out.parent.mkdir(parents=True, exist_ok=True)
    img.save(out, optimize=True)
    print(f"Wrote {out}")


if __name__ == "__main__":
    main()
