from game.enums import Phase, Orientation, UnitStatus, UnitType

class Battle:
    def __init__(self, aggressor_id, defender_id, armies):
        self.aggressor_id = aggressor_id
        self.defender_id = defender_id
        self.armies = armies
        self.board = [[None for _ in range(9)] for _ in range(9)]
        self.phase = Phase.PLACEMENT
        self.current_player = aggressor_id
        self.placed_units = {aggressor_id: [], defender_id: []}
        self.total_unit_count = self.count_total_units()
        self.log = []

    def count_total_units(self):
        return sum(sum(unit['count'] for unit in army['units']) for army in self.armies)

    def place_unit(self, player_id, unit_type, x, y, orientation):
        if self.phase != Phase.PLACEMENT:
            return {"success": False, "message": "It is not the placement phase."}
        if self.current_player != player_id:
            return {"success": False, "message": "It's not your turn to place units."}

        is_aggressor = player_id == self.aggressor_id
        valid_y = (y >= 7 and y <= 8) if is_aggressor else (y >= 0 and y <= 1)
        if not valid_y or x < 0 or x > 8:
            return {"success": False, "message": f"You can only place units in your deployment zone. Your zone is y: {'7-8' if is_aggressor else '0-1'}."}

        if self.board[y][x]:
            return {"success": False, "message": "This tile is already occupied."}

        player_armies = [a for a in self.armies if a['owner'] == player_id]
        unit_source = None
        for army in player_armies:
            for unit in army['units']:
                if unit['type'] == unit_type and unit['count'] > 0:
                    unit_source = unit
                    break
            if unit_source:
                break
        
        if not unit_source:
            return {"success": False, "message": f"You do not have any available {unit_type} units to place."}

        unit_source['count'] -= 1
        self.board[y][x] = {
            "type": UnitType(unit_type) if not isinstance(unit_type, UnitType) else unit_type,
            "owner": player_id,
            "orientation": Orientation(orientation) if orientation else Orientation.NORTH,
            "has_acted": False,
            "status": UnitStatus.HEALTHY
        }
        self.placed_units[player_id].append({"type": unit_type, "x": x, "y": y})
        self.log.append({
            "type": 'place',
            "player_id": player_id,
            "unit_type": unit_type,
            "x": x,
            "y": y,
            "orientation": orientation or 'north',
            "message": f"Placed {unit_type} at ({x},{y}) facing {orientation or 'north'}."
        })

        # Calculate units left for this player and total units left
        from collections import Counter
        # Player's units left by type
        player_units_counter = Counter()
        for army in self.armies:
            if army['owner'] == player_id:
                for unit in army['units']:
                    player_units_counter[unit['type']] += unit['count']
        # All units left by type
        all_units_counter = Counter()
        for army in self.armies:
            for unit in army['units']:
                all_units_counter[unit['type']] += unit['count']
        # Placed units by type
        placed_units_counter = Counter()
        for pid, placed_list in self.placed_units.items():
            for placed in placed_list:
                placed_units_counter[placed['type']] += 1
        # Remaining units to place by type
        units_left_to_place = all_units_counter - placed_units_counter
        # Format info
        def fmt_counter(counter):
            return ', '.join(f"{v} {k.value if hasattr(k, 'value') else k}" for k, v in counter.items() if v > 0) or "None"
        total_placed = sum(placed_units_counter.values())
        total_units_left = self.total_unit_count - total_placed

        if total_placed >= self.total_unit_count:
            self.phase = Phase.BATTLE
            self.current_player = self.aggressor_id
            return {
                "success": True,
                "phase": Phase.BATTLE.value,
                "message": (
                    f"Placed {unit_type} at ({x},{y}).\n"
                    f"All units have been placed! The battle phase begins. It is now the aggressor's turn."
                )
            }

        self.current_player = self.defender_id if self.current_player == self.aggressor_id else self.aggressor_id
        return {
            "success": True,
            "phase": Phase.PLACEMENT.value,
            "message": (
                f"Placed {unit_type} at ({x},{y}).\n"
                f"You have {sum(player_units_counter.values())} units left to place: {fmt_counter(player_units_counter)}.\n"
                f"Total units left to place: {total_units_left} ({fmt_counter(units_left_to_place)}).\n"
                f"It is now the other player's turn to place a unit."
            )
        }

    def get_unit_properties(self, unit_type):
        properties = {
            UnitType.INFANTRY: {"movement": 1, "hp": 1, "can_attack": True},
            UnitType.SHOCK: {"movement": 1, "hp": 1, "can_attack": True, "immune_to": [UnitType.INFANTRY, UnitType.CAVALRY, UnitType.COMMANDER]},
            UnitType.ARCHER: {"movement": 1, "cardinal_only": True, "hp": 1, "can_attack": False, "range": 3},
            UnitType.COMMANDER: {"movement": 1, "hp": 1, "can_attack": True, "immune_to": [UnitType.INFANTRY, UnitType.CAVALRY]},
            UnitType.CAVALRY: {"movement": 3, "hp": 1, "can_attack": True},
            UnitType.CHARIOT: {"movement": 3, "hp": 1, "can_attack": True, "charge_bonus": True, "can_trample": True},
        }
        key = unit_type if isinstance(unit_type, UnitType) else UnitType(unit_type)
        return properties.get(key, {"movement": 0, "hp": 1})

    def forfeit_battle(self, player_id):
        if self.phase == Phase.ENDED:
            return {"success": False, "message": 'The battle has already ended.'}
        
        winner, loser = (None, None)
        if player_id == self.aggressor_id:
            winner = self.defender_id
        elif player_id == self.defender_id:
            winner = self.aggressor_id
        else:
            return {"success": False, "message": 'You are not a participant in this battle.'}
        
        self.phase = Phase.ENDED
        # record winner for later reference
        self.winner = winner
        self.log.append({
            "type": 'forfeit',
            "player_id": player_id,
            "message": f"Player <@{player_id}> forfeited the battle. <@{winner}> is the winner!"
        })
        return {"success": True, "battle_ended": True, "winner": winner, "message": f"<@{player_id}> forfeited. <@{winner}> wins the battle!"}

    def move_unit(self, player_id, from_x, from_y, to_x, to_y):
        if self.phase != Phase.BATTLE:
            return {"success": False, "message": "It is not the battle phase."}
        if self.current_player != player_id:
            return {"success": False, "message": "It's not your turn."}

        unit = self.board[from_y][from_x]
        if not unit:
            return {"success": False, "message": "There is no unit at the specified starting position."}
        if unit['owner'] != player_id:
            return {"success": False, "message": "You do not own that unit."}
        if unit['has_acted']:
            return {"success": False, "message": "That unit has already acted this turn."}
        
        props = self.get_unit_properties(unit['type'])
        distance = abs(from_x - to_x) + abs(from_y - to_y)

        if props.get('cardinal_only') and (from_x != to_x and from_y != to_y):
            return {"success": False, "message": f"{unit['type']} can only move in cardinal directions (not diagonally)."}
        if distance > props['movement']:
            return {"success": False, "message": f"{unit['type']} can only move {props['movement']} tile(s). You tried to move {distance}."}

        self.board[to_y][to_x] = unit
        self.board[from_y][from_x] = None
        unit['has_acted'] = True
        self.log.append({
            "type": 'move',
            "player_id": player_id,
            "unit_type": unit['type'],
            "from_x": from_x,
            "from_y": from_y,
            "to_x": to_x,
            "to_y": to_y,
            "message": f"Moved {unit['type']} from ({from_x},{from_y}) to ({to_x},{to_y})."
        })
        return {"success": True, "message": f"Moved {unit['type']} from ({from_x},{from_y}) to ({to_x},{to_y})."}

    def end_turn(self, player_id):
        if self.phase != Phase.BATTLE:
            return {"success": False, "message": "It is not the battle phase."}
        if self.current_player != player_id:
            return {"success": False, "message": "It's not your turn."}

        to_remove = []
        for y in range(9):
            for x in range(9):
                unit = self.board[y][x]
                if not unit or not self.get_unit_properties(unit['type']).get('can_attack'):
                    continue
                
                tx, ty = x, y
                if unit['orientation'] == Orientation.NORTH:
                    ty -= 1
                elif unit['orientation'] == Orientation.SOUTH:
                    ty += 1
                elif unit['orientation'] == Orientation.EAST:
                    tx += 1
                elif unit['orientation'] == Orientation.WEST:
                    tx -= 1

                if not (0 <= tx <= 8 and 0 <= ty <= 8):
                    continue

                target = self.board[ty][tx]
                if not target or target['owner'] == unit['owner']:
                    continue

                props = self.get_unit_properties(target['type'])
                if 'immune_to' in props and unit['type'] in props['immune_to']:
                    if target.get('status') == UnitStatus.DAMAGED:
                        to_remove.append((tx, ty))
                    else:
                        target['status'] = UnitStatus.DAMAGED
                else:
                    to_remove.append((tx, ty))

        for x, y in to_remove:
            self.log.append({
                "type": 'destroy',
                "x": x,
                "y": y,
                "message": f"Unit at ({x},{y}) was destroyed during attack resolution."
            })
            self.board[y][x] = None

        battle_result = self.check_battle_end()
        if battle_result['ended']:
            self.phase = Phase.ENDED
            self.log.append({
                "type": 'end',
                "winner": battle_result['winner'],
                "message": battle_result['message']
            })
            return {"success": True, "battle_ended": True, "winner": battle_result['winner'], "message": battle_result['message']}

        self.current_player = self.defender_id if self.current_player == self.aggressor_id else self.aggressor_id
        for y in range(9):
            for x in range(9):
                unit = self.board[y][x]
                if unit and unit['owner'] == self.current_player:
                    unit['has_acted'] = False
        
        self.log.append({
            "type": 'end_turn',
            "player_id": player_id,
            "message": "Turn ended. Attacks resolved. It is now the other player's turn."
        })
        return {"success": True, "message": "Turn ended. Attacks resolved. It is now the other player's turn."}

    def check_battle_end(self):
        aggressor_commander = None
        defender_commander = None
        aggressor_units = 0
        defender_units = 0

        for y in range(9):
            for x in range(9):
                unit = self.board[y][x]
                if not unit:
                    continue

                if unit['owner'] == self.aggressor_id:
                    aggressor_units += 1
                    if unit['type'] == UnitType.COMMANDER:
                        aggressor_commander = unit
                elif unit['owner'] == self.defender_id:
                    defender_units += 1
                    if unit['type'] == UnitType.COMMANDER:
                        defender_commander = unit

        if not aggressor_commander:
            return {"ended": True, "winner": self.defender_id, "message": "The aggressor's commander has fallen! The defender wins!"}
        if not defender_commander:
            return {"ended": True, "winner": self.aggressor_id, "message": "The defender's commander has fallen! The aggressor wins!"}
        if aggressor_units == 0:
            return {"ended": True, "winner": self.defender_id, "message": "All aggressor units have been eliminated! The defender wins!"}
        if defender_units == 0:
            return {"ended": True, "winner": self.aggressor_id, "message": "All defender units have been eliminated! The aggressor wins!"}
        if aggressor_units == 1 and defender_units == 1 and aggressor_commander and defender_commander:
            return {"ended": True, "winner": self.defender_id, "message": "Only commanders remain! The battle ends in a stalemate - the defender wins!"}
        
        return {"ended": False}


class GameState:
    def __init__(self, aggressor, defender):
        self.aggressor = aggressor
        self.defender = defender
        self.turn = 1
        self.phase = Phase.PLACEMENT
        self.current_player = aggressor['id']
        self.armies = {
            aggressor['id']: [],
            defender['id']: []
        }
        self.resources = {
            aggressor['id']: self._create_initial_resources(),
            defender['id']: self._create_initial_resources()
        }
        self.battle = None
        self.treaty = None
        self.ceasefire = None

    def _create_initial_resources(self):
        """Create default resource allocation for a new player."""
        return {
            # Basic spawnable resources
            "food": 10,
            "timber": 5,
            "copper": 2,
            "tin": 2,
            "mounts": 3,
            "books": 0,
            
            # Crafted resources
            "bronze": 5,  # starts with some bronze
            
            # Population & economy
            "population": 5,
            "labor": 5,
            "coins": 10,
            
            # Unique resources (dict of resource_name: description)
            "unique_resources": {},
            
            # Land & tiles (for spawning)
            "total_tiles": 10,
            "farmland_tiles": 3,
            "forest_tiles": 2,
            "copper_tiles": 1,
            "tin_tiles": 1,
            "mount_tiles": 2,
            "metropolis_tiles": 1,
        }

    def add_army(self, player_id):
        army = {
            "id": len(self.armies[player_id]) + 1,
            "owner": player_id,
            "units": [
                {"type": UnitType.INFANTRY, "count": 5},
                {"type": UnitType.COMMANDER, "count": 1},
            ],
        }
        self.armies[player_id].append(army)
        try:
            from utils.sheets_sync import sync_army
            sync_army(army)
        except Exception as e:
            print(f"[Sheets Sync] Failed to sync army: {e}")
        return army

    def get_army(self, player_id, army_id):
        for army in self.armies.get(player_id, []):
            if army['id'] == army_id:
                return army
        return None

    def disband_army(self, player_id, army_id):
        armies = self.armies.get(player_id)
        if not armies:
            return {"success": False, "message": 'No armies found for this player.'}
        initial_len = len(armies)
        self.armies[player_id] = [a for a in armies if a['id'] != army_id]
        if len(self.armies[player_id]) == initial_len:
            return {"success": False, "message": f"Army #{army_id} not found."}
        # Detailed info: show remaining armies
        remaining = self.armies[player_id]
        if not remaining:
            return {"success": True, "message": f"Army #{army_id} has been disbanded. You have no armies left."}
        army_list = '\n'.join(f"Army #{a['id']}: " + ', '.join(f"{u['count']} {u['type']}" for u in a['units']) for a in remaining)
        try:
            from utils.sheets_sync import sync_army
            for a in remaining:
                sync_army(a)
        except Exception as e:
            print(f"[Sheets Sync] Failed to sync armies after disband: {e}")
        return {"success": True, "message": f"Army #{army_id} has been disbanded.\nYour remaining armies:\n{army_list}"}

    def modify_army(self, player_id, army_id, modification, quantity: int = 1):
        army = self.get_army(player_id, army_id)
        if not army:
            return {"success": False, "message": "Army not found."}

        player_resources = self.resources[player_id]
        cost = {}
        new_units = []

        # sanitize quantity
        try:
            quantity = int(quantity)
        except Exception:
            quantity = 1
        if quantity < 1:
            quantity = 1
        if quantity > 50:
            quantity = 50  # simple safety cap

        if modification == 'shock':
            cost = {"bronze": 1}
            new_units = [{"type": 'shock', "count": 3}]
        elif modification == 'archer':
            cost = {"timber": 1}
            new_units = [{"type": 'archer', "count": 3}]
        elif modification == 'cavalry':
            cost = {"mounts": 1}
            new_units = [{"type": 'cavalry', "count": 4}]
        elif modification == 'chariot':
            cost = {"mounts": 1}
            new_units = [{"type": 'chariot', "count": 2}]
        else:
            return {"success": False, "message": "Invalid modification."}

        # scale cost and units by quantity
        cost = {k: v * quantity for k, v in cost.items()}
        for u in new_units:
            u["count"] *= quantity

        for resource, amount in cost.items():
            if player_resources.get(resource, 0) < amount:
                return {"success": False, "message": f"Not enough {resource}. Required: {amount}, You have: {player_resources.get(resource, 0)}."}

        for resource, amount in cost.items():
            player_resources[resource] -= amount

        for new_unit in new_units:
            existing_unit = next((u for u in army['units'] if u['type'] == new_unit['type']), None)
            if existing_unit:
                existing_unit['count'] += new_unit['count']
            else:
                army['units'].append(new_unit)

        try:
            from utils.sheets_sync import sync_army
            sync_army(army)
        except Exception as e:
            print(f"[Sheets Sync] Failed to sync army: {e}")

        # Detailed info: show new army composition and resources
        unit_descriptions = []
        for u in new_units:
            unit_descriptions.append(f"{u['count']} {u['type']}")
        units_text = ', '.join(unit_descriptions)
        army_comp = ', '.join(f"{u['count']} {u['type']}" for u in army['units'])
        resources_text = ', '.join(f"{k}: {v}" for k, v in player_resources.items())
        return {
            "success": True,
            "message": (
                f"Army #{army_id} successfully modified with {units_text}.\n"
                f"New composition: {army_comp}.\n"
                f"Your resources: {resources_text}."
            )
        }

    def get_resources(self, player_id):
        res = self.resources.get(player_id)
        if res is None:
            return {"success": False, "message": "Player not found in this game."}
        return {"success": True, "resources": dict(res)}

    def set_resources(self, player_id, **kwargs):
        """Set specific resource values for a player. Accepts any resource name as keyword arg."""
        res = self.resources.get(player_id)
        if res is None:
            return {"success": False, "message": "Player not found in this game."}
        
        for key, val in kwargs.items():
            if val is not None:
                try:
                    if key == "unique_resources":
                        # Handle unique resources dict separately
                        if isinstance(val, dict):
                            res[key] = val
                        else:
                            return {"success": False, "message": f"unique_resources must be a dict."}
                    else:
                        iv = int(val)
                        res[key] = max(0, iv)
                except (ValueError, TypeError):
                    return {"success": False, "message": f"Invalid value for {key}."}
        return {"success": True, "resources": dict(res), "message": "Resources updated."}

    def add_resources(self, player_id, **kwargs):
        """Add/subtract resource values for a player. Accepts any resource name as keyword arg."""
        res = self.resources.get(player_id)
        if res is None:
            return {"success": False, "message": "Player not found in this game."}
        
        for key, delta in kwargs.items():
            if delta != 0:  # Skip zero deltas
                try:
                    if key == "unique_resources":
                        return {"success": False, "message": "Use set_resources for unique_resources."}
                    iv = int(delta)
                    res[key] = max(0, res.get(key, 0) + iv)
                except (ValueError, TypeError):
                    return {"success": False, "message": f"Invalid delta for {key}."}
        return {"success": True, "resources": dict(res), "message": "Resources adjusted."}

    def spawn_resource(self, player_id, resource_type: str, tile_count: int = 1):
        """Spawn resources from tiles using labor. Returns success/failure."""
        res = self.resources.get(player_id)
        if res is None:
            return {"success": False, "message": "Player not found in this game."}
        
        # Check labor availability
        if res.get("labor", 0) < tile_count:
            return {"success": False, "message": f"Not enough labor. Need {tile_count}, have {res.get('labor', 0)}."}
        
        # Check tile availability
        tile_key = f"{resource_type}_tiles"
        if res.get(tile_key, 0) < tile_count:
            return {"success": False, "message": f"Not enough {resource_type} tiles. Need {tile_count}, have {res.get(tile_key, 0)}."}
        
        # Spawn the resource
        res["labor"] -= tile_count
        res[resource_type] = res.get(resource_type, 0) + tile_count
        
        return {"success": True, "message": f"Spawned {tile_count} {resource_type} using {tile_count} labor."}

    def craft_bronze(self, player_id, amount: int = 1):
        """Convert copper + tin to bronze (1 copper + 1 tin = 2 bronze)."""
        res = self.resources.get(player_id)
        if res is None:
            return {"success": False, "message": "Player not found in this game."}
        
        copper_needed = amount
        tin_needed = amount
        bronze_produced = amount * 2
        
        if res.get("copper", 0) < copper_needed:
            return {"success": False, "message": f"Not enough copper. Need {copper_needed}, have {res.get('copper', 0)}."}
        if res.get("tin", 0) < tin_needed:
            return {"success": False, "message": f"Not enough tin. Need {tin_needed}, have {res.get('tin', 0)}."}
        
        res["copper"] -= copper_needed
        res["tin"] -= tin_needed
        res["bronze"] = res.get("bronze", 0) + bronze_produced
        
        return {"success": True, "message": f"Crafted {bronze_produced} bronze from {copper_needed} copper and {tin_needed} tin."}

    def add_unique_resource(self, player_id, resource_name: str, description: str):
        """Add a unique resource to a player's collection."""
        res = self.resources.get(player_id)
        if res is None:
            return {"success": False, "message": "Player not found in this game."}
        
        if "unique_resources" not in res:
            res["unique_resources"] = {}
        
        res["unique_resources"][resource_name] = description
        return {"success": True, "message": f"Added unique resource: {resource_name}"}

    def calculate_food_production(self, player_id):
        """Calculate food production for next cycle based on farmland and domestic lifeforms."""
        res = self.resources.get(player_id)
        if res is None:
            return {"success": False, "message": "Player not found in this game."}
        
        farmland = res.get("farmland_tiles", 0)
        population = res.get("population", 0)
        
        # Simplified calculation - you can adjust modifiers as needed
        food_produced = farmland * 2 + population  # Basic formula
        food_consumed = population  # 1 food per population
        net_food = food_produced - food_consumed
        
        return {
            "success": True,
            "food_produced": food_produced,
            "food_consumed": food_consumed,
            "net_food": net_food,
            "message": f"Food production: +{food_produced}, consumption: -{food_consumed}, net: {net_food}"
        }

    def start_battle(self, aggressor_army_id, defender_army_id):
        aggressor_army = self.get_army(self.aggressor['id'], aggressor_army_id)
        defender_army = self.get_army(self.defender['id'], defender_army_id)
        if not aggressor_army:
            return {"success": False, "message": "Aggressor army not found."}
        if not defender_army:
            return {"success": False, "message": "Defender army not found."}
        if self.battle:
            return {"success": False, "message": "A battle is already in progress in this war."}
        battle_armies = [aggressor_army, defender_army]
        self.battle = Battle(self.aggressor['id'], self.defender['id'], battle_armies)
        # Detailed info: show both armies' compositions
        def army_comp(army):
            return ', '.join(f"{u['count']} {u['type']}" for u in army['units'])
        try:
            from utils.sheets_sync import sync_battle
            sync_battle({
                "id": f"{self.aggressor['id']}_{aggressor_army_id}_vs_{self.defender['id']}_{defender_army_id}",
                "aggressor": self.aggressor['id'],
                "defender": self.defender['id'],
                "winner": None,
                "armies": battle_armies,
                "log": []
            })
        except Exception as e:
            print(f"[Sheets Sync] Failed to sync battle: {e}")
        return {
            "success": True,
            "message": (
                "Battle initiated! The placement phase begins.\n"
                f"Aggressor Army: {army_comp(aggressor_army)}\n"
                f"Defender Army: {army_comp(defender_army)}"
            ),
            "battle": self.battle
        }


class GameManager:
    def __init__(self):
        self.games = {}

    def create_game(self, channel_id, aggressor, defender):
        if channel_id in self.games:
            return None
        new_game = GameState(aggressor, defender)
        self.games[channel_id] = new_game
        return new_game

    def get_game(self, channel_id):
        return self.games.get(channel_id)

    def end_game(self, channel_id):
        if channel_id in self.games:
            del self.games[channel_id]
            return True
        return False

    def end_battle(self, channel_id):
        game = self.get_game(channel_id)
        if not game or not game.battle:
            return {"success": False, "message": "No active battle found."}
        
        battle = game.battle
        if battle.phase != Phase.ENDED:
            return {"success": False, "message": "Battle is not finished yet."}
        
        loser_id = game.defender['id'] if battle.winner == game.aggressor['id'] else game.aggressor['id']
        
        loser_armies = game.armies[loser_id]
        battle_army_ids = [army['id'] for army in battle.armies if army['owner'] == loser_id]
        
        game.armies[loser_id] = [army for army in loser_armies if army['id'] not in battle_army_ids]

        # Sync battle result to Google Sheets
        try:
            from utils.sheets_sync import sync_battle
            sync_battle({
                "id": f"{game.aggressor['id']}_{battle.armies[0]['id']}_vs_{game.defender['id']}_{battle.armies[1]['id']}",
                "aggressor": game.aggressor['id'],
                "defender": game.defender['id'],
                "winner": battle.winner if hasattr(battle, 'winner') else None,
                "armies": battle.armies,
                "log": getattr(battle, 'log', [])
            })
        except Exception as e:
            print(f"[Sheets Sync] Failed to sync battle result: {e}")

        game.battle = None

        return {"success": True, "message": "Battle concluded. Defeated army has been removed."}


game_manager = GameManager()
