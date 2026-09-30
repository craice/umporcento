"""Generates the static Open Graph image (1200x630) using Carter One and Nunito."""

import io
from pathlib import Path

import requests
from PIL import Image, ImageDraw, ImageFont

DISPLAY_URL = "https://github.com/google/fonts/raw/main/ofl/carterone/CarterOne.ttf"
TEXT_URL = "https://github.com/google/fonts/raw/main/ofl/nunito/Nunito%5Bwght%5D.ttf"
PAPER, RED, INK = "#FFE600", "#E8001C", "#141414"


def _download(url: str) -> bytes:
    response = requests.get(url, timeout=60)
    response.raise_for_status()
    return response.content


def display(size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(io.BytesIO(_download(DISPLAY_URL)), size)


def text(size: int, weight: int = 700) -> ImageFont.FreeTypeFont:
    font = ImageFont.truetype(io.BytesIO(_download(TEXT_URL)), size)
    font.set_variation_by_axes([weight])
    return font


def main(out: Path = Path("public/og.png")) -> None:
    img = Image.new("RGB", (1200, 630), PAPER)
    d = ImageDraw.Draw(img)
    d.text((70, 66), "UMPORCENTO", font=text(34, 800), fill=INK)
    stamp_font = text(32, 800)
    stamp_width = d.textlength("PNAD · IBGE", font=stamp_font)
    d.rounded_rectangle((1130 - stamp_width - 40, 56, 1130, 110), radius=6, fill=RED)
    d.text((1130 - stamp_width - 20, 64), "PNAD · IBGE", font=stamp_font, fill="#FFFFFF")
    d.text((70, 150), "Onde você está", font=display(104), fill=INK)
    d.text((70, 272), "na renda do Brasil?", font=display(104), fill=RED)
    d.text((70, 450), "Compare sua renda com a de quem trabalha no país.", font=text(38), fill=INK)
    d.text((70, 504), "Dados do IBGE. Nada sai do seu navegador.", font=text(38), fill=INK)
    out.parent.mkdir(parents=True, exist_ok=True)
    img.save(out, optimize=True)
    print(f"Wrote {out}")


if __name__ == "__main__":
    main()
