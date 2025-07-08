"""
Terrain types and modifiers
"""
from enum import Enum, auto
from models.regiment import SpecialAbility, AttackType


class TerrainType(Enum):
    PLAIN = auto()
    FOREST = auto()
    HILL = auto()
    MARSH = auto()
    RIVER = auto()


class Terrain:
    def __init__(self, terrain_type: TerrainType):
        self.terrain_type = terrain_type

    def movement_cost(self, regiment):
        """
        Return movement cost (tiles) for a given regiment based on terrain and special abilities.
        """
        if self.terrain_type == TerrainType.FOREST:
            # forest slows most units
            if regiment.ability == SpecialAbility.IGNORE_TERRAIN:
                return 1
            return 2
        if self.terrain_type == TerrainType.MARSH:
            # marsh halves movement speed effectively
            return 2
        if self.terrain_type == TerrainType.RIVER:
            # rivers are impassable (handled as infinite cost)
            return float('inf')
        # plains and hills default cost
        return 1

    def combat_modifier(self, regiment):
        """
        Return additional defense value based on terrain for melee units.
        """
        if self.terrain_type == TerrainType.HILL and regiment.attack_type == AttackType.MELEE:
            # +20% defense bonus
            return regiment.defense * 0.2
        if self.terrain_type == TerrainType.FOREST and regiment.name.lower().startswith('lightfootmen'):
            # Light Footmen gain +30% defense in forests
            return regiment.defense * 0.3
        # forests give light units defense bonus vs ranged (handled elsewhere)
        # other terrains no defense modifier
        return 0.0
