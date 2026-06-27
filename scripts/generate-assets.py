#!/usr/bin/env python3
from __future__ import annotations

import json
import math
import random
import struct
import wave
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "assets"
CAST_SOURCE = OUT / "source" / "character-cast-source.png"

CHARACTER_ORDER = [
    "player",
    "son",
    "ba_hanh",
    "anh_tam",
    "me",
    "di_tu",
    "su_thay",
]

COLORS = {
    "deep": (6, 25, 29),
    "teal": (13, 62, 69),
    "teal_2": (20, 89, 96),
    "gold": (204, 157, 72),
    "paper": (244, 224, 188),
    "paper_dark": (196, 164, 102),
    "red": (146, 54, 47),
    "jade": (47, 143, 123),
    "ink": (23, 35, 38),
}


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = [
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/System/Library/Fonts/Supplemental/Helvetica.ttc",
        "/Library/Fonts/Arial Unicode.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ]
    for candidate in candidates:
        path = Path(candidate)
        if path.exists():
            return ImageFont.truetype(str(path), size)
    return ImageFont.load_default()


def ensure_dirs() -> None:
    for folder in ["characters", "backgrounds", "documents", "audio", "source"]:
        (OUT / folder).mkdir(parents=True, exist_ok=True)


def vertical_gradient(width: int, height: int, top: tuple[int, int, int], bottom: tuple[int, int, int]) -> Image.Image:
    img = Image.new("RGB", (width, height))
    draw = ImageDraw.Draw(img)
    for y in range(height):
        t = y / max(1, height - 1)
        color = tuple(round(top[i] * (1 - t) + bottom[i] * t) for i in range(3))
        draw.line((0, y, width, y), fill=color)
    return img.convert("RGBA")


def texture(img: Image.Image, opacity: int = 18, seed: int = 7) -> Image.Image:
    rng = random.Random(seed)
    layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    pixels = layer.load()
    for y in range(0, img.height, 3):
        for x in range(0, img.width, 3):
            value = rng.randint(-opacity, opacity)
            color = (255, 255, 255, value) if value > 0 else (0, 0, 0, -value)
            pixels[x, y] = color
    return Image.alpha_composite(img, layer.filter(ImageFilter.GaussianBlur(0.55)))


def draw_text_box(draw: ImageDraw.ImageDraw, xy: tuple[int, int], text: str, max_width: int, fill, fnt, line_gap: int = 6) -> int:
    words = text.split()
    lines: list[str] = []
    current = ""
    for word in words:
        trial = f"{current} {word}".strip()
        if draw.textlength(trial, font=fnt) <= max_width or not current:
            current = trial
        else:
            lines.append(current)
            current = word
    if current:
        lines.append(current)
    x, y = xy
    line_h = fnt.size + line_gap if hasattr(fnt, "size") else 24
    for index, line in enumerate(lines):
        draw.text((x, y + index * line_h), line, font=fnt, fill=fill)
    return y + len(lines) * line_h


def add_gold_frame(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int], radius: int = 32) -> None:
    draw.rounded_rectangle(box, radius=radius, fill=(7, 25, 29, 218), outline=COLORS["gold"], width=4)


def save_background(name: str, img: Image.Image) -> None:
    texture(img, seed=len(name) * 17).save(OUT / "backgrounds" / f"{name}.png")


def make_bank_background() -> None:
    img = vertical_gradient(1080, 1920, (13, 55, 62), (4, 18, 22))
    d = ImageDraw.Draw(img)
    d.rectangle((0, 0, 1080, 1220), fill=(24, 72, 78))
    d.rounded_rectangle((88, 110, 992, 218), radius=18, fill=(242, 223, 187), outline=COLORS["gold"], width=4)
    d.text((540, 156), "NGÂN HÀNG NHÂN ÁI", font=font(48, True), anchor="mm", fill=(19, 54, 58))
    d.rounded_rectangle((95, 290, 430, 840), radius=18, fill=(12, 66, 73), outline=COLORS["gold"], width=3)
    d.text((262, 350), "CẢNH GIÁC", font=font(40, True), anchor="mm", fill=COLORS["paper"])
    d.text((262, 405), "LỪA ĐẢO", font=font(40, True), anchor="mm", fill=COLORS["paper"])
    d.rounded_rectangle((185, 480, 340, 650), radius=18, fill=(136, 48, 43), outline=COLORS["gold"], width=5)
    d.polygon([(262, 520), (330, 620), (194, 620)], fill=COLORS["paper"])
    d.text((262, 594), "!", font=font(70, True), anchor="mm", fill=COLORS["red"])
    d.rounded_rectangle((650, 292, 945, 470), radius=18, fill=(8, 39, 46), outline=(91, 147, 151), width=4)
    d.text((798, 378), "QUẦY 03", font=font(54, True), anchor="mm", fill=(122, 221, 204))
    d.rounded_rectangle((90, 1050, 990, 1325), radius=42, fill=(147, 92, 45))
    d.rounded_rectangle((135, 1088, 945, 1228), radius=18, fill=(222, 196, 137))
    d.rounded_rectangle((0, 1320, 1080, 1920), radius=0, fill=(5, 23, 27))
    d.polygon([(0, 1425), (1080, 1328), (1080, 1920), (0, 1920)], fill=(10, 46, 52))
    save_background("bank", img)


def make_home_background() -> None:
    img = vertical_gradient(1080, 1920, (119, 51, 47), (9, 30, 32))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((70, 105, 1010, 980), radius=28, fill=(159, 78, 62), outline=(181, 93, 69), width=4)
    d.rounded_rectangle((374, 122, 706, 438), radius=20, fill=(78, 35, 32), outline=COLORS["gold"], width=8)
    d.ellipse((468, 185, 612, 329), fill=(239, 222, 185))
    d.rounded_rectangle((444, 374, 636, 414), radius=10, fill=COLORS["gold"])
    d.rounded_rectangle((130, 560, 950, 930), radius=24, fill=(224, 190, 132, 58))
    d.rounded_rectangle((150, 980, 930, 1248), radius=26, fill=(48, 25, 22))
    d.rounded_rectangle((250, 1038, 830, 1118), radius=20, fill=(241, 219, 176))
    d.text((540, 1082), "BÀN TRÀ GIA ĐÌNH", font=font(32, True), anchor="mm", fill=(74, 43, 34))
    d.rectangle((0, 1255, 1080, 1920), fill=(5, 22, 26))
    d.polygon([(0, 1380), (540, 1290), (1080, 1372), (1080, 1920), (0, 1920)], fill=(10, 43, 48))
    save_background("home", img)


def make_temple_background() -> None:
    img = vertical_gradient(1080, 1920, (28, 70, 62), (8, 30, 30))
    d = ImageDraw.Draw(img)
    d.ellipse((-20, 70, 280, 370), fill=(214, 168, 74, 45))
    d.polygon([(142, 674), (540, 300), (938, 674)], fill=(125, 42, 38), outline=COLORS["gold"])
    d.line((142, 674, 540, 300, 938, 674), fill=COLORS["gold"], width=14)
    d.rounded_rectangle((232, 674, 848, 1108), radius=8, fill=(188, 138, 69))
    d.rounded_rectangle((404, 770, 676, 1108), radius=26, fill=(42, 42, 32))
    for x in [170, 910]:
        d.line((x, 425, x, 860), fill=(201, 155, 71), width=5)
        d.rounded_rectangle((x - 44, 515, x + 44, 620), radius=22, fill=(156, 57, 43), outline=COLORS["gold"], width=4)
    d.rounded_rectangle((345, 1120, 735, 1248), radius=30, fill=(72, 37, 24))
    d.text((540, 1188), "GIỮ TÂM - GIỮ TÌNH", font=font(34, True), anchor="mm", fill=COLORS["paper"])
    d.rectangle((0, 1278, 1080, 1920), fill=(6, 24, 26))
    d.polygon([(0, 1390), (1080, 1308), (1080, 1920), (0, 1920)], fill=(12, 45, 42))
    save_background("temple", img)


def make_consult_background() -> None:
    img = vertical_gradient(1080, 1920, (16, 65, 72), (5, 21, 24))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((95, 145, 985, 870), radius=34, fill=(19, 70, 78), outline=COLORS["gold"], width=6)
    d.rounded_rectangle((150, 230, 470, 735), radius=18, fill=(232, 207, 149, 70), outline=(229, 186, 95), width=3)
    d.text((310, 305), "CẨM NANG", font=font(44, True), anchor="mm", fill=COLORS["paper"])
    for i, label in enumerate(["Giả danh", "Gấp gáp", "Cô lập", "Gỡ gạc"]):
        y = 390 + i * 74
        d.rounded_rectangle((205, y, 420, y + 44), radius=10, fill=(244, 224, 188))
        d.text((312, y + 23), label, font=font(22, True), anchor="mm", fill=COLORS["ink"])
    d.rounded_rectangle((575, 250, 880, 735), radius=18, fill=(236, 219, 182, 50), outline=(209, 166, 86), width=3)
    d.text((728, 326), "PHÒNG TƯ VẤN", font=font(36, True), anchor="mm", fill=COLORS["paper"])
    d.rounded_rectangle((130, 1000, 950, 1285), radius=34, fill=(139, 87, 45))
    d.rounded_rectangle((232, 1048, 848, 1148), radius=22, fill=(241, 219, 176))
    d.rectangle((0, 1300, 1080, 1920), fill=(5, 23, 27))
    d.polygon([(0, 1440), (1080, 1340), (1080, 1920), (0, 1920)], fill=(10, 44, 50))
    save_background("consult", img)


def remove_green_background(img: Image.Image) -> Image.Image:
    rgba = img.convert("RGBA")
    pixels = rgba.load()
    for y in range(rgba.height):
        for x in range(rgba.width):
            r, g, b, a = pixels[x, y]
            green_delta = g - max(r, b)
            if g > 135 and green_delta > 42:
                pixels[x, y] = (r, g, b, 0)
            elif g > 105 and green_delta > 18:
                alpha = max(0, min(255, int(255 * (1 - (green_delta - 18) / 48))))
                pixels[x, y] = (r, min(g, max(r, b) + 18), b, min(a, alpha))
            elif g > max(r, b) + 8:
                pixels[x, y] = (r, min(g, max(r, b) + 14), b, a)
    return rgba


def normalize_sprite(source: Image.Image, name: str) -> None:
    bbox = source.getbbox()
    if bbox is None:
        raise RuntimeError(f"No opaque pixels for {name}")
    cropped = source.crop(bbox)
    canvas = Image.new("RGBA", (720, 920), (0, 0, 0, 0))
    scale = min(620 / cropped.width, 860 / cropped.height)
    size = (round(cropped.width * scale), round(cropped.height * scale))
    resized = cropped.resize(size, Image.Resampling.LANCZOS)
    x = (720 - size[0]) // 2
    y = 875 - size[1]
    shadow = Image.new("RGBA", (720, 920), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.ellipse((150, 830, 570, 902), fill=(0, 0, 0, 54))
    shadow = shadow.filter(ImageFilter.GaussianBlur(10))
    canvas.alpha_composite(shadow)
    canvas.alpha_composite(resized, (x, y))
    canvas.save(OUT / "characters" / f"{name}.png")


def sprite_component_boxes(source: Image.Image, expected: int) -> list[tuple[int, int, int, int]]:
    alpha = np.array(source.getchannel("A"))
    mask = alpha > 24
    active_cols = np.flatnonzero(mask.any(axis=0))
    if active_cols.size == 0:
        return []

    runs: list[tuple[int, int]] = []
    start = int(active_cols[0])
    previous = int(active_cols[0])
    for col in active_cols[1:]:
        col = int(col)
        if col - previous <= 10:
            previous = col
            continue
        runs.append((start, previous))
        start = previous = col
    runs.append((start, previous))

    boxes: list[tuple[int, int, int, int]] = []
    for left, right in runs:
        if right - left < 42:
            continue
        submask = mask[:, left:right + 1]
        active_rows = np.flatnonzero(submask.any(axis=1))
        if active_rows.size == 0:
            continue
        top = int(active_rows[0])
        bottom = int(active_rows[-1])
        pad = 10
        boxes.append((
            max(0, left - pad),
            max(0, top - pad),
            min(source.width, right + pad + 1),
            min(source.height, bottom + pad + 1),
        ))

    if len(boxes) != expected:
        return []
    return boxes


def make_characters() -> None:
    if not CAST_SOURCE.exists():
        raise FileNotFoundError(f"Missing generated cast source: {CAST_SOURCE}")
    cast = Image.open(CAST_SOURCE).convert("RGB")
    keyed = remove_green_background(cast)
    boxes = sprite_component_boxes(keyed, len(CHARACTER_ORDER))
    if not boxes:
        width, height = cast.size
        boxes = [
            (round(index * width / len(CHARACTER_ORDER)), 0, round((index + 1) * width / len(CHARACTER_ORDER)), height)
            for index in range(len(CHARACTER_ORDER))
        ]
    for name, box in zip(CHARACTER_ORDER, boxes):
        normalize_sprite(keyed.crop(box), name)
    make_scammer_silhouette()
    make_guidebook_sprite()


def make_scammer_silhouette() -> None:
    img = Image.new("RGBA", (720, 920), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.ellipse((160, 815, 560, 895), fill=(0, 0, 0, 58))
    d.rounded_rectangle((190, 360, 530, 858), radius=160, fill=(13, 22, 26, 235))
    d.ellipse((250, 155, 470, 405), fill=(18, 26, 30, 245))
    d.rounded_rectangle((388, 430, 518, 666), radius=24, fill=(20, 48, 54, 250), outline=(86, 170, 160, 180), width=4)
    d.rounded_rectangle((410, 462, 496, 620), radius=14, fill=(36, 96, 98, 210))
    for y in [492, 530, 568]:
        d.rounded_rectangle((424, y, 482, y + 12), radius=6, fill=(239, 220, 166, 140))
    d.arc((280, 250, 440, 395), start=20, end=160, fill=(192, 141, 64, 130), width=7)
    img.filter(ImageFilter.GaussianBlur(0.25)).save(OUT / "characters" / "thay_scammer.png")


def make_guidebook_sprite() -> None:
    img = Image.new("RGBA", (720, 920), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.ellipse((130, 775, 590, 880), fill=(0, 0, 0, 48))
    d.rounded_rectangle((170, 190, 550, 740), radius=32, fill=COLORS["paper"], outline=COLORS["gold"], width=8)
    d.rectangle((194, 220, 526, 292), fill=COLORS["teal"])
    d.text((360, 256), "CẨM NANG", font=font(40, True), anchor="mm", fill=COLORS["paper"])
    for i, label in enumerate(["Giả danh", "Gấp gáp", "Bí mật", "Tâm linh", "Gỡ gạc"]):
        y = 340 + i * 66
        d.rounded_rectangle((230, y, 490, y + 40), radius=12, fill=(255, 244, 213), outline=(203, 157, 72), width=2)
        d.text((360, y + 22), label, font=font(24, True), anchor="mm", fill=COLORS["ink"])
    img.save(OUT / "characters" / "guidebook.png")


def load_documents() -> list[dict]:
    path = ROOT / "public" / "data" / "documents.json"
    if not path.exists():
        return []
    return json.loads(path.read_text(encoding="utf8")).get("rows", [])


def make_document_card(doc: dict) -> None:
    img = vertical_gradient(760, 1000, (255, 244, 214), (216, 186, 126))
    img = texture(img, opacity=12, seed=sum(ord(c) for c in doc["doc_id"]))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((24, 24, 736, 976), radius=34, outline=(139, 98, 46), width=10)
    d.text((380, 90), doc.get("name_vi", doc["doc_id"]), font=font(34, True), anchor="mm", fill=COLORS["ink"])
    d.rectangle((90, 138, 670, 146), fill=COLORS["red"])
    y = 205
    fields = str(doc.get("fields_summary") or "")
    tell = str(doc.get("tell_desc") or "")
    y = draw_text_box(d, (90, y), fields, 580, COLORS["ink"], font(28), 10) + 36
    if tell:
        d.text((90, y), "DẤU HIỆU", font=font(28, True), fill=COLORS["red"])
        draw_text_box(d, (90, y + 42), tell, 580, COLORS["ink"], font(25), 8)
    stamp = "CẦN XÁC MINH" if doc.get("has_tell") else "HỢP LỆ"
    stamp_color = COLORS["red"] if doc.get("has_tell") else COLORS["jade"]
    d.ellipse((498, 755, 678, 935), outline=stamp_color, width=9)
    d.text((588, 845), stamp, font=font(24, True), anchor="mm", fill=stamp_color)
    img.save(OUT / "documents" / f"{doc['doc_id']}.png")


def make_documents() -> None:
    for doc in load_documents():
        make_document_card(doc)


def write_wav(path: Path, frequency: float, duration: float, kind: str = "sine", volume: float = 0.24) -> None:
    sample_rate = 44100
    samples = int(sample_rate * duration)
    with wave.open(str(path), "wb") as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(sample_rate)
        frames = bytearray()
        for i in range(samples):
            t = i / sample_rate
            envelope = min(1, i / 600) * max(0, 1 - i / samples)
            base = math.sin(2 * math.pi * frequency * t)
            if kind == "square":
                base = 1 if base >= 0 else -1
            overtone = math.sin(2 * math.pi * frequency * 1.5 * t) * 0.22
            value = int((base + overtone) * volume * envelope * 32767)
            frames.extend(struct.pack("<h", max(-32768, min(32767, value))))
        wav.writeframes(frames)


def make_audio() -> None:
    write_wav(OUT / "audio" / "click.wav", 620, 0.09, "sine", 0.20)
    write_wav(OUT / "audio" / "reveal.wav", 330, 0.35, "sine", 0.25)
    write_wav(OUT / "audio" / "warning.wav", 165, 0.45, "square", 0.18)
    write_wav(OUT / "audio" / "soft-win.wav", 520, 0.50, "sine", 0.24)


def main() -> None:
    ensure_dirs()
    make_bank_background()
    make_home_background()
    make_temple_background()
    make_consult_background()
    make_characters()
    make_documents()
    make_audio()
    print(f"Generated raster PNG art and audio in {OUT}")


if __name__ == "__main__":
    main()
