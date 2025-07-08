"""
Wall and gate objects
"""


class Wall:
    def __init__(self, hp=100):
        self.max_hp = hp
        self.current_hp = hp

    def is_destroyed(self):
        return self.current_hp <= 0

    def repair(self, amount):
        self.current_hp = min(self.max_hp, self.current_hp + amount)


class Gate(Wall):
    def __init__(self, hp=50):
        super().__init__(hp)
        self.capture_progress = 0

    def is_captured(self):
        return self.current_hp <= 0 and self.capture_progress >= 2

    def advance_capture(self):
        self.capture_progress += 1
