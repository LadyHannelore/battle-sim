import pytest
from game.game_manager import GameManager, Phase, UnitType, UnitStatus

@pytest.fixture
def setup_game():
    gm = GameManager()
    # simulate creating a channel and two players
    channel_id = 123
    aggressor = { 'id': 1, 'name': 'A' }
    defender = { 'id': 2, 'name': 'B' }
    game = gm.create_game(channel_id, aggressor, defender)
    assert game is not None
    # Add initial armies for both players so army IDs start at 1
    game.add_army(aggressor['id'])
    game.add_army(defender['id'])
    return gm, game, channel_id, aggressor, defender


def test_add_and_disband_army(setup_game):
    gm, game, channel_id, agg, defd = setup_game
    # initial army should already exist
    initial_armies = game.armies[agg['id']]
    assert len(initial_armies) == 1
    army = initial_armies[0]
    assert army['id'] == 1
    # disband it
    res = game.disband_army(agg['id'], 1)
    assert res['success']
    assert len(game.armies[agg['id']]) == 0


def test_modify_insufficient_resources(setup_game):
    gm, game, channel_id, agg, defd = setup_game
    # deplete resources
    game.resources[agg['id']]['bronze'] = 0
    res = game.modify_army(agg['id'], 1, 'shock')
    assert not res['success']
    assert 'Not enough bronze' in res['message']


def test_modify_and_sync(setup_game):
    gm, game, channel_id, agg, defd = setup_game
    res = game.modify_army(agg['id'], 1, 'archer')
    assert res['success']
    assert '3 archer' in res['message']
    assert game.resources[agg['id']]['timber'] == 4


def test_start_and_forfeit_battle(setup_game):
    gm, game, channel_id, agg, defd = setup_game
    # armies already present, start battle
    res = game.start_battle(1, 1)
    assert res['success']
    # now forfeit as aggressor
    fb = game.battle.forfeit_battle(agg['id'])
    assert fb['success']
    assert fb['battle_ended']
    # ensure manager end_battle acknowledges end
    end_res = gm.end_battle(channel_id)
    assert end_res['success']


def test_placement_to_battle_phase_transition(setup_game):
    gm, game, channel_id, agg, defd = setup_game
    # place all units for both players to move to battle
    total_units = game.battle.total_unit_count if game.battle else 0
    # manually create battle to test placement
    game.start_battle(1,1)
    b = game.battle
    # place all units (5 infantry + 1 commander per side) in alternating turns
    placed = {agg['id']: 0, defd['id']: 0}
    # continue until placement phase ends
    while b.phase == Phase.PLACEMENT:
        player = b.current_player
        # choose unit type: first 5 infantry, then commander
        if placed[player] < 5:
            unit = UnitType.INFANTRY
        else:
            unit = UnitType.COMMANDER
        x = placed[player] % 9
        y = 7 if player == agg['id'] else 0
        res = b.place_unit(player, unit, x, y, 'north')
        assert res['success'], f"Placement failed on {unit} for player {player}: {res.get('message')}"
        placed[player] += 1
    assert b.phase == Phase.BATTLE, "Battle phase did not start after placement"

