"""
Generate placeholder unit sprites for each regiment using Pillow.
"""
from PIL import Image, ImageDraw, ImageFont
import os

UNIT_NAMES = [
    'peasants', 'lightfootmen', 'bowmen', 'pikemen',
    'lighthorsemen', 'armoredfootmen', 'armoredhorsemen', 'batteringram'
]
COLORS = {
    'peasants': (150, 75, 0),
    'lightfootmen': (0, 100, 0),
    'bowmen': (0, 128, 255),
    'pikemen': (128, 0, 128),
    'lighthorsemen': (255, 215, 0),
    'armoredfootmen': (192, 192, 192),
    'armoredhorsemen': (255, 165, 0),
    'batteringram': (139, 69, 19)
}

def generate_sprites(tile_size=64):
    assets_dir = os.path.dirname(os.path.abspath(__file__))
    unit_dir = os.path.join(assets_dir, 'units')
    os.makedirs(unit_dir, exist_ok=True)
    try:
        font = ImageFont.truetype("arial.ttf", 12)
    except IOError:
        font = ImageFont.load_default()

    for name in UNIT_NAMES:
        img = Image.new('RGBA', (tile_size, tile_size), COLORS.get(name, (255, 0, 0)))
        draw = ImageDraw.Draw(img)
        bbox = draw.textbbox((0, 0), name, font=font)
        w = bbox[2] - bbox[0]
        h = bbox[3] - bbox[1]
        draw.text(((tile_size - w) / 2, (tile_size - h) / 2), name, fill=(255,255,255), font=font)
        path = os.path.join(unit_dir, f"{name}.png")
        img.save(path)
        print(f"Generated sprite: {path}")

if __name__ == '__main__':
    generate_sprites()
