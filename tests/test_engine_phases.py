import pytest
from src.engine import Engine
from src.models.regiment import Regiment, AttackType, SpecialAbility
from src.models.terrain import Terrain, TerrainType
from src.objects.walls import Wall, Gate

@pytest.fixture
def engine():
    eng = Engine(debug=False)
    # simple 3x1 plain map
    for x in range(3):
        eng.set_terrain_at((x, 0), Terrain(TerrainType.PLAIN))
    return eng

def test_movement_phase(engine):
    r = Regiment("Peasants", AttackType.MELEE, 1, 10, 2, 100, SpecialAbility.REPAIR, position=(0,0))
    r.set_destination((2,0))
    engine.add_regiment(r)
    engine.movement_phase()
    assert r.position != (0,0)

def test_ranged_combat_phase(engine):
    a = Regiment("Bowmen", AttackType.RANGED, 1, 10, 1, 100, SpecialAbility.AMBUSH, position=(0,0))
    b = Regiment("Target", AttackType.MELEE, 1, 10, 1, 100, SpecialAbility.REPAIR, position=(3,0))
    engine.add_regiment(a)
    engine.add_regiment(b)
    engine.ranged_combat_phase()
    assert b.current_health < b.max_health

def test_melee_combat_phase(engine):
    a = Regiment("Footmen", AttackType.MELEE, 2, 10, 1, 100, SpecialAbility.COUNTER_CAVALRY, position=(1,0))
    b = Regiment("Horsemen", AttackType.MELEE, 2, 10, 1, 100, SpecialAbility.FLANK, position=(2,0))
    engine.add_regiment(a)
    engine.add_regiment(b)
    engine.melee_combat_phase()
    assert b.current_health < b.max_health

def test_siege_phase_repair_and_ram(engine):
    wall = Wall()
    engine.set_siege_object_at((1,0), wall)
    p = Regiment("Peasants", AttackType.MELEE, 1, 10, 1, 100, SpecialAbility.REPAIR, position=(0,0))
    p.set_destination((1,0))
    engine.add_regiment(p)
    engine.movement_phase()
    engine.siege_phase()
    assert wall.current_hp > wall.max_hp - 1

