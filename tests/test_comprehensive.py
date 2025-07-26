import pytest
from game.game_manager import GameManager, Phase, UnitType, UnitStatus, Orientation

@pytest.fixture
def setup_game():
    gm = GameManager()
    channel_id = 123
    aggressor = {'id': 1, 'name': 'A'}
    defender = {'id': 2, 'name': 'B'}
    game = gm.create_game(channel_id, aggressor, defender)
    assert game is not None
    game.add_army(aggressor['id'])
    game.add_army(defender['id'])
    return gm, game, channel_id, aggressor, defender

def test_enum_values():
    """Test that all enum values are correct"""
    assert UnitType.INFANTRY.value == "INFANTRY"
    assert UnitType.SHOCK.value == "SHOCK"
    assert UnitType.ARCHER.value == "ARCHER"
    assert UnitType.COMMANDER.value == "COMMANDER"
    assert UnitType.CAVALRY.value == "CAVALRY"
    assert UnitType.CHARIOT.value == "CHARIOT"
    
    assert Phase.PLACEMENT.value == "placement"
    assert Phase.BATTLE.value == "battle"
    assert Phase.ENDED.value == "ended"
    
    assert UnitStatus.HEALTHY.value == "healthy"
    assert UnitStatus.DAMAGED.value == "damaged"

def test_unit_properties(setup_game):
    """Test that unit properties are correctly defined"""
    gm, game, channel_id, aggressor, defender = setup_game
    
    result = game.start_battle(1, 1)
    assert result['success']
    
    battle = game.battle
    
    # Test unit properties
    infantry_props = battle.get_unit_properties(UnitType.INFANTRY)
    assert infantry_props['movement'] == 1
    assert infantry_props['can_attack'] == True
    
    archer_props = battle.get_unit_properties(UnitType.ARCHER)
    assert archer_props['movement'] == 1
    assert archer_props['can_attack'] == False
    assert archer_props['range'] == 3
    assert archer_props.get('cardinal_only') == True
    
    cavalry_props = battle.get_unit_properties(UnitType.CAVALRY)
    assert cavalry_props['movement'] == 3

def test_battle_placement_zones(setup_game):
    """Test that units can only be placed in correct zones"""
    gm, game, channel_id, aggressor, defender = setup_game
    
    result = game.start_battle(1, 1)
    battle = game.battle
    
    # Aggressor should only place in y 7-8
    result = battle.place_unit(aggressor['id'], UnitType.INFANTRY, 0, 6, 'north')
    assert not result['success']
    assert "deployment zone" in result['message']
    
    result = battle.place_unit(aggressor['id'], UnitType.INFANTRY, 0, 7, 'north')
    assert result['success']
    
    # Defender should only place in y 0-1
    result = battle.place_unit(defender['id'], UnitType.INFANTRY, 1, 2, 'north')
    assert not result['success']
    assert "deployment zone" in result['message']
    
    result = battle.place_unit(defender['id'], UnitType.INFANTRY, 1, 0, 'north')
    assert result['success']

def test_battle_end_conditions(setup_game):
    """Test that battle ends correctly when commander is killed"""
    gm, game, channel_id, aggressor, defender = setup_game
    
    result = game.start_battle(1, 1)
    battle = game.battle
    
    # Place all units in alternating turns to reach battle phase
    battle.place_unit(aggressor['id'], UnitType.COMMANDER, 0, 7, 'north')
    battle.place_unit(defender['id'], UnitType.COMMANDER, 0, 0, 'south')
    
    for i in range(5):
        battle.place_unit(aggressor['id'], UnitType.INFANTRY, i+1, 7, 'north')
        battle.place_unit(defender['id'], UnitType.INFANTRY, i+1, 0, 'south')
    
    assert battle.phase == Phase.BATTLE
    
    # Manually remove defender's commander to test end condition
    battle.board[0][0] = None
    
    result = battle.check_battle_end()
    assert result['ended'] == True
    assert result['winner'] == aggressor['id']
    assert "commander has fallen" in result['message']

def test_move_validation(setup_game):
    """Test unit movement validation"""
    gm, game, channel_id, aggressor, defender = setup_game
    
    result = game.start_battle(1, 1)
    battle = game.battle
    
    # Place all units in alternating turns to reach battle phase
    battle.place_unit(aggressor['id'], UnitType.COMMANDER, 0, 7, 'north')
    battle.place_unit(defender['id'], UnitType.COMMANDER, 0, 0, 'south')
    
    for i in range(5):
        battle.place_unit(aggressor['id'], UnitType.INFANTRY, i+1, 7, 'north')
        battle.place_unit(defender['id'], UnitType.INFANTRY, i+1, 0, 'south')
    
    assert battle.phase == Phase.BATTLE
    
    # Test infantry movement (1 tile max)
    result = battle.move_unit(aggressor['id'], 1, 7, 1, 5)  # Try to move 2 tiles
    assert not result['success']
    assert "can only move 1 tile" in result['message']
    
    result = battle.move_unit(aggressor['id'], 1, 7, 1, 6)  # Move 1 tile
    assert result['success']
    
    # Test that unit can't act twice
    result = battle.move_unit(aggressor['id'], 1, 6, 1, 5)
    assert not result['success']
    assert "already acted" in result['message']

def test_orientation_and_attacks(setup_game):
    """Test unit orientation and attack mechanics"""
    gm, game, channel_id, aggressor, defender = setup_game
    
    result = game.start_battle(1, 1)
    battle = game.battle
    
    # Place units in alternating turns - need to place all 12 units to enter battle phase
    # Each army has 5 infantry + 1 commander = 6 units total = 12 units
    
    # Aggressor starts first
    battle.place_unit(aggressor['id'], UnitType.COMMANDER, 0, 7, 'north')
    battle.place_unit(defender['id'], UnitType.COMMANDER, 0, 0, 'south')
    
    # Place infantry alternating turns
    for i in range(5):
        battle.place_unit(aggressor['id'], UnitType.INFANTRY, i+1, 7, 'north')
        battle.place_unit(defender['id'], UnitType.INFANTRY, i+1, 0, 'south')
    
    assert battle.phase == Phase.BATTLE
    
    # Test that units are placed with correct orientation
    agg_commander = battle.board[7][0]
    def_commander = battle.board[0][0]
    
    assert agg_commander['orientation'] == Orientation.NORTH
    assert def_commander['orientation'] == Orientation.SOUTH
