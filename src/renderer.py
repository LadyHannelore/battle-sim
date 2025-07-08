"""
Renderer for real-time battle visualization and video export using Pygame and MoviePy
"""
import pygame
import sys
import os
from moviepy.editor import ImageSequenceClip
from models.terrain import TerrainType

class Renderer:
    def __init__(self, engine, tile_size=32, fps=2, record=False, output='battle.mp4'):
        self.engine = engine
        self.tile_size = tile_size
        self.fps = fps
        self.record = record
        self.output = output
        self.frames = []
        pygame.init()
        # determine map bounds
        positions = [reg.position for reg in engine.regiments]
        xs = [p[0] for p in positions]
        ys = [p[1] for p in positions]
        self.min_x, self.max_x = min(xs), max(xs)
        self.min_y, self.max_y = min(ys), max(ys)
        width = (self.max_x - self.min_x + 3) * tile_size
        height = (self.max_y - self.min_y + 3) * tile_size
        self.screen = pygame.display.set_mode((width, height))
        pygame.display.set_caption('Battle Simulator')
        # load tile images
        base_dir = os.path.dirname(os.path.abspath(__file__))
        assets_dir = os.path.join(base_dir, 'assets')
        tile_dir = os.path.join(assets_dir, 'tiles')
        self.tile_images = {}
        for ttype in TerrainType:
            fname = f"{ttype.name.lower()}.png"
            path = os.path.join(tile_dir, fname)
            if os.path.exists(path):
                img = pygame.image.load(path).convert_alpha()
                self.tile_images[ttype] = pygame.transform.scale(img, (tile_size, tile_size))
        # load unit sprites
        unit_dir = os.path.join(assets_dir, 'units')
        self.unit_images = {}
        for fname in os.listdir(unit_dir):
            name, ext = os.path.splitext(fname)
            path = os.path.join(unit_dir, fname)
            if ext.lower() in ['.png', '.jpg']:
                img = pygame.image.load(path).convert_alpha()
                self.unit_images[name.lower()] = pygame.transform.scale(img, (tile_size, tile_size))

    def draw(self):
        # draw background tiles
        for x in range(self.min_x-1, self.max_x+2):
            for y in range(self.min_y-1, self.max_y+2):
                tile = self.engine.terrain_map.get((x, y))
                img = self.tile_images.get(tile.terrain_type) if tile else None
                px = (x - self.min_x + 1) * self.tile_size
                py = (y - self.min_y + 1) * self.tile_size
                if img:
                    self.screen.blit(img, (px, py))
                else:
                    # default fill
                    pygame.draw.rect(self.screen, (50, 50, 50), (px, py, self.tile_size, self.tile_size))
        # draw regiments with sprites
        for reg in self.engine.regiments:
            if not reg.is_alive():
                continue
            x, y = reg.position
            px = (x - self.min_x + 1) * self.tile_size
            py = (y - self.min_y + 1) * self.tile_size
            key = reg.name.lower().replace(' ', '')
            sprite = self.unit_images.get(key)
            if sprite:
                self.screen.blit(sprite, (px, py))
            else:
                # fallback colored circle
                cx = px + self.tile_size//2
                cy = py + self.tile_size//2
                color = (0, 200, 0) if reg.attack_type.name == 'MELEE' else (0, 0, 200)
                pygame.draw.circle(self.screen, color, (cx, cy), self.tile_size//3)
        pygame.display.flip()

    def capture_frame(self):
        data = pygame.surfarray.array3d(self.screen)
        # convert from (w,h,3) to (h,w,3)
        frame = data.swapaxes(0,1)
        self.frames.append(frame)

    def run(self):
        clock = pygame.time.Clock()
        running = True
        while running:
            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    running = False
            # advance one turn
            self.engine.run()
            self.draw()
            if self.record:
                self.capture_frame()
            clock.tick(self.fps)
            # stop when all enemies or allies are dead
            alive = [r for r in self.engine.regiments if r.is_alive()]
            if len(alive) <= 1:
                running = False
        pygame.quit()
        if self.record and self.frames:
            clip = ImageSequenceClip(self.frames, fps=self.fps)
            clip.write_videofile(self.output)
        sys.exit(0)
