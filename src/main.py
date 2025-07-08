"""
Entry point for Battle Simulator
"""
import argparse
from engine import Engine
from models.regiment import Regiment
from models.terrain import Terrain, TerrainType
from models.regiment import Regiment, AttackType, SpecialAbility
import sys


def parse_args():
    parser = argparse.ArgumentParser("Battle Simulator")
    parser.add_argument('-d', '--debug', action='store_true', help='Enable debug logging')
    parser.add_argument('--render', action='store_true', help='Enable real-time visualization')
    parser.add_argument('--record', action='store_true', help='Record video of simulation')
    parser.add_argument('--fps', type=int, default=2, help='Frames per second for rendering')
    parser.add_argument('--tile-size', type=int, default=32, help='Tile size in pixels')
    parser.add_argument('--output', type=str, default='battle.mp4', help='Output video filename')
    return parser.parse_args()


def load_scenario(engine):
    """Load a sample scenario: terrain and regiments."""
    plain = Terrain(TerrainType.PLAIN)
    forest = Terrain(TerrainType.FOREST)
    for x in range(6):
        for y in range(3):
            engine.set_terrain_at((x, y), forest if (x, y) == (2, 1) else plain)
    archers = Regiment(
        name="Bowmen", attack_type=AttackType.RANGED,
        defense=2, health=30, speed=3, morale=100,
        ability=SpecialAbility.AMBUSH, position=(0, 1)
    )
    cavalry = Regiment(
        name="Light Horsemen", attack_type=AttackType.MELEE,
        defense=4, health=40, speed=4, morale=100,
        ability=SpecialAbility.FLANK, position=(5, 1)
    )
    archers.set_destination((5, 1))
    cavalry.set_destination((0, 1))
    engine.add_regiment(archers)
    engine.add_regiment(cavalry)


def main():
    args = parse_args()
    engine = Engine(debug=args.debug)
    # load default scenario (terrain & regiments)
    load_scenario(engine)
    # TODO: initialize terrain and regiments here or load scenario
    if args.render:
        try:
            from renderer import Renderer
        except ImportError:
            print("Renderer dependencies not installed. Please install pygame and moviepy.")
            sys.exit(1)
        renderer = Renderer(
            engine,
            tile_size=args.tile_size,
            fps=args.fps,
            record=args.record,
            output=args.output
        )
        renderer.run()
    else:
        # run turns until only one side remains
        while True:
            engine.run()
            alive = [r for r in engine.regiments if r.is_alive()]
            if len(alive) <= 1:
                if args.debug:
                    print("Simulation ended.")
                break


if __name__ == '__main__':
    main()
