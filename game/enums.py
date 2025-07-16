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
    INFANTRY = "5 Infantry Units (Starter)"
    SHOCK = "3 Shock Units (1 Bronze)"
    ARCHER = "3 Archer Units (1 Timber)"
    COMMANDER = "1 Commander (Starter)"
    CAVALRY = "4 Cavalry Units (1 Mount)"
    CHARIOT = "2 Chariot Units (1 Mount)"
