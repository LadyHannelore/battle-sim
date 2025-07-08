"""
Generate placeholder tile images for each terrain type using Pillow.
"""
from PIL import Image, ImageDraw, ImageFont
import os

TILES = {
    'plain': (144, 238, 144),      # light green
    'forest': (34, 139, 34),       # forest green
    'hill': (205, 133, 63),        # peru
    'marsh': (143, 188, 143),      # dark sea green
    'river': (30, 144, 255)        # dodger blue
}


def generate_tiles(tile_size=64):
    assets_dir = os.path.dirname(os.path.abspath(__file__))
    tile_dir = os.path.join(assets_dir, 'tiles')
    os.makedirs(tile_dir, exist_ok=True)
    try:
        font = ImageFont.truetype("arial.ttf", 12)
    except IOError:
        font = ImageFont.load_default()

    for name, color in TILES.items():
        img = Image.new('RGBA', (tile_size, tile_size), color)
        draw = ImageDraw.Draw(img)
        bbox = draw.textbbox((0, 0), name, font=font)
        w = bbox[2] - bbox[0]
        h = bbox[3] - bbox[1]
        draw.text(((tile_size - w) / 2, (tile_size - h) / 2), name, fill=(255,255,255), font=font)
        path = os.path.join(tile_dir, f"{name}.png")
        img.save(path)
        print(f"Generated tile: {path}")

if __name__ == '__main__':
    generate_tiles()
