from enum import Enum, auto

class Phase(Enum):
    PLACEMENT = "placement"
    BATTLE = "battle"
    RALLY = "rally"
    ENDED = "ended"

class Orientation(Enum):
    NORTH = "north"
    EAST = "east"
    SOUTH = "south"
    WEST = "west"

class UnitStatus(Enum):
    HEALTHY = "healthy"
    DAMAGED = "damaged"
    DEAD = "dead"

class UnitType(Enum):
    INFANTRY = "INFANTRY"
    SHOCK = "SHOCK"
    ARCHER = "ARCHER"
    COMMANDER = "COMMANDER"
    CAVALRY = "CAVALRY"
    CHARIOT = "CHARIOT"
