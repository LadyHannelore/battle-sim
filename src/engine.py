"""
Core engine: controls turn loop and combat phases
"""
from src.models.regiment import Regiment, AttackType
from src.models.terrain import Terrain
import math


class Engine:
    def __init__(self, debug=False):
        self.debug = debug
        # battlefield state
        self.regiments = []                # list of Regiment
        self.terrain_map = {}              # dict[(x,y)] -> Terrain
        self.siege_objects = {}            # dict[(x,y)] -> Wall or Gate
        self.turn = 0

    def add_regiment(self, regiment):
        """Register a regiment for simulation."""
        self.regiments.append(regiment)

    def set_terrain_at(self, position, terrain):
        """Define terrain at a specific map coordinate."""
        self.terrain_map[position] = terrain
    
    def set_siege_object_at(self, position, obj):
        """Place a siege object (Wall or Gate) at the specified position."""
        self.siege_objects[position] = obj

    def run(self):
        """
        Run simulation for one turn through all phases.
        """
        self.movement_phase()
        self.siege_phase()
        self.ranged_combat_phase()
        self.melee_combat_phase()
        self.morale_phase()
        self.turn += 1
        if self.debug:
            print(f"Turn {self.turn} completed.")

    def movement_phase(self):
        """Move each regiment toward its destination if set and within speed limits."""
        for reg in self.regiments:
            # skip if no destination or already at target
            if not getattr(reg, 'destination', None) or reg.position == reg.destination:
                continue
            movement_points = reg.speed
            # move stepwise until out of movement or reached destination
            while movement_points > 0 and reg.position != reg.destination:
                cx, cy = reg.position
                tx, ty = reg.destination
                dx = tx - cx
                dy = ty - cy
                step_x = cx + (1 if dx > 0 else -1 if dx < 0 else 0)
                step_y = cy + (1 if dy > 0 else -1 if dy < 0 else 0)
                next_pos = (step_x, step_y)
                terrain = self.terrain_map.get(next_pos)
                cost = terrain.movement_cost(reg) if terrain else 1
                # check if enough movement points
                if cost <= movement_points:
                    reg.move(next_pos)
                    movement_points -= cost
                    if self.debug:
                        print(f"Moved {reg.name} to {next_pos} (cost {cost}, remaining {movement_points})")
                else:
                    if self.debug:
                        print(f"{reg.name} blocked at {next_pos}: requires {cost}, has {movement_points}")
                    break

    def siege_phase(self):
        # Repair walls by peasants
        for pos, obj in list(self.siege_objects.items()):
            # repair walls only if no enemy adjacent
            if hasattr(obj, 'repair'):
                under_attack = any(
                    reg.is_alive() and reg.position in self._adjacent(pos) and reg.attack_type != AttackType.RANGED
                    for reg in self.regiments
                )
                if under_attack:
                    continue
                for reg in self.regiments:
                    if reg.ability.name == 'REPAIR' and reg.position in self._adjacent(pos):
                        obj.repair(15)
                        if self.debug:
                            print(f"{reg.name} repaired object at {pos} to {obj.current_hp} HP")
        # Battering Ram attacks on gates
        for pos, obj in list(self.siege_objects.items()):
            if obj.__class__.__name__ == 'Gate':
                for reg in self.regiments:
                    if reg.is_alive() and reg.name == 'Battering Ram' and reg.position in self._adjacent(pos):
                        obj.current_hp -= 25
                        if self.debug:
                            print(f"{reg.name} dealt 25 damage to gate at {pos}, HP now {obj.current_hp}")
                        if obj.current_hp <= 0:
                            obj.advance_capture()
                            if self.debug:
                                print(f"Gate at {pos} capture progress: {obj.capture_progress}")
                            # morale boost for capturing
                            if obj.is_captured():
                                for r in self.regiments:
                                    if r.position in self._adjacent(pos):
                                        r.morale = min(100, r.morale + 25)
                                        if self.debug:
                                            print(f"{r.name} gained +25 morale for capturing gate")

    def ranged_combat_phase(self):
        """Perform ranged attacks for all eligible regiments."""
        for attacker in self.regiments:
            if not attacker.is_alive() or attacker.attack_type != AttackType.RANGED or getattr(attacker, 'is_fleeing', False):
                continue
            for target in self.regiments:
                if target is attacker or not target.is_alive():
                    continue
                # compute Euclidean distance
                dist = math.dist(attacker.position, target.position)
                # valid range 3-5
                if 3 <= dist <= 5:
                    terrain = self.terrain_map.get(attacker.position)
                    attacker.perform_ranged_attack(target, terrain, dist)
                    if self.debug:
                        print(f"{attacker.name} ranged attacked {target.name} at distance {dist}")
                    break

    def melee_combat_phase(self):
        """Perform melee attacks for adjacent regiments."""
        for attacker in self.regiments:
            if not attacker.is_alive() or attacker.attack_type != AttackType.MELEE or getattr(attacker, 'is_fleeing', False):
                continue
            for target in self.regiments:
                if target is attacker or not target.is_alive():
                    continue
                dist = math.dist(attacker.position, target.position)
                if dist <= 1:
                    terrain = self.terrain_map.get(attacker.position)
                    attacker.perform_melee_attack(target, terrain)
                    if self.debug:
                        print(f"{attacker.name} melee attacked {target.name}")
                    break

    def morale_phase(self):
        # Morale adjustments: drop, fleeing behavior
        for reg in self.regiments:
            if not reg.is_alive():
                continue
            # casualty-induced morale drop
            loss_ratio = 1 - (reg.current_health / reg.max_health)
            if loss_ratio > 0.2:
                reg.morale = max(0, reg.morale - 10)
                if self.debug:
                    print(f"{reg.name} morale dropped by 10% due to casualties ({loss_ratio*100:.0f}% lost)")
            # fleeing state
            if reg.morale < 30:
                if not reg.is_fleeing:
                    reg.is_fleeing = True
                    reg.set_destination(reg.spawn_position)
                    # double movement speed while fleeing
                    reg.speed *= 2
                    if self.debug:
                        print(f"{reg.name} is fleeing towards {reg.spawn_position}")
            else:
                # recover if morale restored
                if reg.is_fleeing:
                    reg.is_fleeing = False
                    # reset speed to base if stored
                    # assumes original speed stored in max_speed
                    if hasattr(reg, 'base_speed'):
                        reg.speed = reg.base_speed
            # clamp morale
            reg.morale = min(100, max(0, reg.morale))
        if self.debug:
            print("Morale phase completed")

    def _adjacent(self, position):
        """Return list of orthogonally adjacent map coordinates."""
        x, y = position
        return [(x+1, y), (x-1, y), (x, y+1), (x, y-1)]
