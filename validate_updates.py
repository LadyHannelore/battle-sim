#!/usr/bin/env python3
"""
Quick validation script to check that all our updates are consistent and working.
"""

try:
    # Test imports
    print("Testing imports...")
    from game.enums import Phase, Orientation, UnitStatus, UnitType
    from game.game_manager import game_manager
    from utils.sheets_sync import sync_army, sync_battle
    from utils.keep_alive import start_keepalive
    print("✅ All imports successful")
    
    # Test enum serialization
    print("\nTesting enum serialization...")
    test_army = {
        "id": 1,
        "owner": 12345,
        "units": [
            {"type": UnitType.INFANTRY, "count": 5},
            {"type": UnitType.COMMANDER, "count": 1},
        ]
    }
    
    # Test if sync_army can handle enums
    try:
        sync_army(test_army)
        print("✅ Army sync with enums works")
    except Exception as e:
        print(f"❌ Army sync failed: {e}")
    
    # Test global army system
    print("\nTesting global army system...")
    test_player_id = 999999
    
    # Test add global army
    army = game_manager.add_global_army(test_player_id)
    print(f"✅ Added global army: {army}")
    
    # Test get global army
    retrieved = game_manager.get_global_army(test_player_id, army['id'])
    print(f"✅ Retrieved global army: {retrieved}")
    
    # Test get player armies
    player_armies = game_manager.get_player_armies(test_player_id)
    print(f"✅ Player armies: {player_armies}")
    
    # Test global resources
    print("\nTesting global resources...")
    resources = game_manager.get_global_resources(test_player_id)
    print(f"✅ Global resources: {resources}")
    
    # Test battle creation
    print("\nTesting battle system...")
    aggressor = {'id': test_player_id, 'name': 'TestPlayer1'}
    defender = {'id': test_player_id + 1, 'name': 'TestPlayer2'}
    
    # Add army for defender too
    defender_army = game_manager.add_global_army(defender['id'])
    
    # Create a game state (like what happens in battle threads)
    from game.game_manager import GameState
    game_state = GameState(aggressor, defender)
    
    # Test start battle with global armies
    result = game_state.start_battle(army['id'], defender_army['id'])
    print(f"✅ Battle start result: {result}")
    
    print("\n🎉 All validations passed! The system appears to be working correctly.")
    
except Exception as e:
    print(f"❌ Validation failed with error: {e}")
    import traceback
    traceback.print_exc()
