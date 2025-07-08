import pytest
from src.engine import Engine
from src.models.regiment import Regiment, AttackType, SpecialAbility
from src.models.terrain import Terrain, TerrainType
from src.objects.walls import Gate

# Morale tests
def test_casualty_induced_morale_drop_and_clamp():
    eng = Engine(debug=False)
    r = Regiment("TestUnit", AttackType.MELEE, defense=1, health=100, speed=1, morale=100,
                ability=SpecialAbility.REPAIR, position=(0,0))
    # simulate 25% casualties
    r.current_health = 75
    eng.add_regiment(r)
    eng.morale_phase()
    # morale should drop by 10 to 90
    assert r.morale == 90

    # simulate no casualties
    r.current_health = 100
    r.morale = 90
    eng.morale_phase()
    # no further drop
    assert r.morale == 90

# Fleeing and speed reset
def test_fleeing_and_speed_restoration():
    eng = Engine()
    r = Regiment("FleeUnit", AttackType.MELEE, defense=1, health=50, speed=2, morale=25,
                ability=SpecialAbility.REPAIR, position=(2,2))
    eng.add_regiment(r)
    eng.morale_phase()
    # unit should start fleeing
    assert r.is_fleeing is True
    assert r.destination == r.spawn_position
    assert r.speed == r.base_speed * 2

    # restore morale above threshold
    r.morale = 50
    eng.morale_phase()
    assert r.is_fleeing is False
    assert r.speed == r.base_speed

# Pathfinding / movement constraint
def test_marsh_blocks_slow_units():
    eng = Engine()
    marsh = Terrain(TerrainType.MARSH)
    eng.set_terrain_at((1,0), marsh)
    # unit speed 1 cannot move into marsh cost 2
    r = Regiment("Slow", AttackType.MELEE, defense=1, health=10, speed=1, morale=100,
                ability=SpecialAbility.REPAIR, position=(0,0))
    r.set_destination((2,0))
    eng.add_regiment(r)
    eng.movement_phase()
    # should not have moved into marsh
    assert r.position == (0,0)

# Gate capture logic and morale bonus
def test_gate_capture_and_morale_bonus():
    eng = Engine()
    gate = Gate()
    pos = (1,0)
    eng.set_siege_object_at(pos, gate)
    ram = Regiment("Battering Ram", AttackType.MELEE, defense=0, health=20, speed=1, morale=50,
                   ability=SpecialAbility.REPAIR, position=(0,0))
    ram.set_destination(pos)
    eng.add_regiment(ram)
    # move adjacent
    eng.movement_phase()
    # first ram attack
    eng.siege_phase()
    assert gate.current_hp == 25
    assert gate.capture_progress == 0
    # second ram attack
    eng.siege_phase()
    # gate HP <=0 and capture_progress incremented
    assert gate.current_hp <= 0
    assert gate.capture_progress == 1
    # third ram attack to complete capture
    eng.siege_phase()
    assert gate.capture_progress >= 2
    # morale boost for ram
    assert ram.morale >= 50 + 25
