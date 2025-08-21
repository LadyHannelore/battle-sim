#!/usr/bin/env python3
"""
Test the case-insensitive unit type matching fix.
"""

try:
    from game.enums import UnitType
    from game.game_manager import game_manager, GameState
    
    print("Testing case-insensitive unit type matching...")
    
    # Create test armies
    test_player_id = 777777
    army = game_manager.add_global_army(test_player_id)
    
    # Create battle
    aggressor = {'id': test_player_id, 'name': 'TestPlayer1'}
    defender = {'id': test_player_id + 1, 'name': 'TestPlayer2'}
    defender_army = game_manager.add_global_army(defender['id'])
    
    game_state = GameState(aggressor, defender)
    battle_result = game_state.start_battle(army['id'], defender_army['id'])
    
    if battle_result['success'] and game_state.battle:
        print(f"✅ Battle started successfully")
        
        # Test lowercase unit type placement (what comes from Discord command)
        place_result = game_state.battle.place_unit(test_player_id, "commander", 0, 7, "north")
        print(f"✅ Lowercase 'commander' placement: {place_result}")
        
        # Test uppercase unit type placement
        place_result2 = game_state.battle.place_unit(test_player_id, "INFANTRY", 1, 7, "north")
        print(f"✅ Uppercase 'INFANTRY' placement: {place_result2}")
        
        # Test mixed case
        place_result3 = game_state.battle.place_unit(test_player_id, "Infantry", 2, 7, "north")
        print(f"✅ Mixed case 'Infantry' placement: {place_result3}")
        
    else:
        print(f"❌ Battle failed to start: {battle_result}")
    
    print("\n🎉 Case-insensitive matching test complete!")
    
except Exception as e:
    print(f"❌ Test failed: {e}")
    import traceback
    traceback.print_exc()
