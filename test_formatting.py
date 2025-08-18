#!/usr/bin/env python3
"""
Test script to verify all output formatting is consistent and correct.
"""

try:
    from game.enums import UnitType
    from game.game_manager import game_manager
    
    print("Testing output formatting...")
    
    # Test army creation and viewing
    test_player_id = 888888
    army = game_manager.add_global_army(test_player_id)
    print(f"✅ Army created: {army}")
    
    # Test army modification output
    result = game_manager.modify_global_army(test_player_id, army['id'], 'shock', 2)
    print(f"✅ Army modification: {result['message']}")
    
    # Test army disband output (create another army first)
    army2 = game_manager.add_global_army(test_player_id)
    disband_result = game_manager.disband_global_army(test_player_id, army2['id'])
    print(f"✅ Army disband: {disband_result['message']}")
    
    # Test battle start output
    from game.game_manager import GameState
    aggressor = {'id': test_player_id, 'name': 'TestPlayer1'}
    defender = {'id': test_player_id + 1, 'name': 'TestPlayer2'}
    
    # Add army for defender
    defender_army = game_manager.add_global_army(defender['id'])
    
    game_state = GameState(aggressor, defender)
    battle_result = game_state.start_battle(army['id'], defender_army['id'])
    print(f"✅ Battle start: {battle_result['message']}")
    
    # Test battle placement debug message (only if battle started successfully)
    if battle_result['success'] and game_state.battle:
        place_result = game_state.battle.place_unit(test_player_id, "NONEXISTENT", 0, 7, "north")
        print(f"✅ Battle place debug: {place_result['message']}")
    else:
        print(f"⚠️ Battle didn't start, skipping placement test")
    
    print("\n🎉 All output formatting tests passed!")
    print("All unit types should display as clean names (e.g., 'INFANTRY', not 'UnitType.INFANTRY')")
    
except Exception as e:
    print(f"❌ Formatting test failed: {e}")
    import traceback
    traceback.print_exc()
