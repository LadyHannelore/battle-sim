
from PIL import Image, ImageDraw, ImageFont
from typing import List, Optional, Dict, Any
from game.enums import UnitType, Orientation


class BattlefieldRenderer:
    def __init__(self, board: List[List[Optional[Dict[str, Any]]]],
                 tile_size: int = 64):
        self.board = board
        self.tile_size = tile_size
        self.width = 9 * tile_size
        self.height = 9 * tile_size
        self.image = Image.new('RGB', (self.width, self.height), 'white')
        self.draw = ImageDraw.Draw(self.image)
        # Use a larger font size for better emoji visibility
        try:
            self.font = ImageFont.truetype("seguiemj.ttf", self.tile_size // 2)
        except Exception:
            # Fallback to default font if truetype font is not available
            self.font = ImageFont.load_default()
        self.unit_emojis = {
            UnitType.INFANTRY: '🛡️',
            UnitType.COMMANDER: '👑',
            UnitType.SHOCK: '⚡',
            UnitType.ARCHER: '🏹',
            UnitType.CAVALRY: '🐎',
            UnitType.CHARIOT: '🏛️',
        }

    def draw_grid(self):
        for i in range(10):
            self.draw.line(
                [(i * self.tile_size, 0), (i * self.tile_size, self.height)],
                fill='black'
            )
            self.draw.line(
                [(0, i * self.tile_size), (self.width, i * self.tile_size)],
                fill='black'
            )

    def draw_units(self):
        for y, row in enumerate(self.board):
            for x, unit in enumerate(row):
                if unit:
                    unit_type = unit['type'] if isinstance(unit['type'], UnitType) else UnitType(unit['type'])
                    emoji = self.unit_emojis.get(unit_type, '❓')
                    pos_x = x * self.tile_size + self.tile_size // 4
                    pos_y = y * self.tile_size + self.tile_size // 4

                    # This is a simplified way to draw emojis.
                    # For better quality, you might need a library
                    # that can handle emoji rendering properly,
                    # or use images for units.
                    try:
                        self.draw.text(
                            (pos_x, pos_y), emoji, font=self.font,
                            fill="black"
                        )
                    except Exception as e:
                        print(f"Could not render emoji {emoji}: {e}")
                        self.draw.text(
                            (pos_x, pos_y), "?", font=self.font,
                            fill="black"
                        )

    def render_board(self):
        self.draw_grid()
        self.draw_units()

        # In-memory buffer
        import io
        img_byte_arr = io.BytesIO()
        self.image.save(img_byte_arr, format='PNG')
        img_byte_arr.seek(0)
        return img_byte_arr


if __name__ == '__main__':
    # Example usage
    mock_board: List[List[Optional[Dict[str, Any]]]] = [
        [None for _ in range(9)] for _ in range(9)
    ]
    mock_board[0][0] = {"type": UnitType.INFANTRY, "owner": 1}
    mock_board[8][8] = {"type": UnitType.COMMANDER, "owner": 2}

    renderer = BattlefieldRenderer(mock_board)
    image_buffer = renderer.render_board()

    with open("battlefield_test.png", "wb") as f:
        f.write(image_buffer.read())
