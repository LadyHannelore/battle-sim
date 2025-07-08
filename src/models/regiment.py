"""
Regiment with stats & abilities
"""
from enum import Enum, auto
from utils import calculate_ranged_damage, calculate_melee_damage, roll_accuracy, apply_morale_modifier
import random  # for random accuracy rolls
from models.terrain import TerrainType


class AttackType(Enum):
    MELEE = auto()
    RANGED = auto()


class SpecialAbility(Enum):
    REPAIR = auto()
    AMBUSH = auto()
    ARMOR_PENETRATE = auto()
    COUNTER_CAVALRY = auto()
    FLANK = auto()
    IGNORE_TERRAIN = auto()
    BREAK_LINES = auto()


class Regiment:
    def __init__(self, name, attack_type: AttackType, defense, health, speed, morale, ability: SpecialAbility, position=(0, 0)):
        self.name = name
        self.attack_type = attack_type
        self.defense = defense
        self.max_health = health
        self.current_health = health
        self.speed = speed
        self.base_speed = speed  # store original speed
        self.morale = morale
        self.ability = ability
        self.spawn_position = position
        self.position = position  # (x, y) tuple on the map
        self.destination = None    # target position for movement
        self.is_fleeing = False    # retreat when morale <30%

    def is_alive(self):
        return self.current_health > 0

    def move(self, new_position):
        """Update regiment position on the battlefield."""
        self.position = new_position

    def set_destination(self, position):
        """Assign a movement target for the regiment."""
        self.destination = position

    def perform_ranged_attack(self, target, terrain, distance):
        """Attack a target at range, applying damage based on accuracy and terrain."""
        # check attack type
        if self.attack_type != AttackType.RANGED:
            return  # cannot perform ranged attack
        # calculate accuracy
        acc = roll_accuracy(0.8 * 100, distance)
        if random.random() > acc:
            return  # missed
        # calculate damage and apply morale modifier
        base_damage = calculate_ranged_damage(self, target, terrain, distance)
        # apply special ability modifiers
        multiplier = 1.0
        # ambush in forests
        if self.ability == SpecialAbility.AMBUSH and terrain and terrain.terrain_type == TerrainType.FOREST:
            multiplier *= 1.5
        # armor penetrate: double damage vs low-defense targets
        if self.ability == SpecialAbility.ARMOR_PENETRATE and target.defense < 5:
            multiplier *= 2.0
        damage = base_damage * multiplier
        dmg = apply_morale_modifier(damage, self.morale)
        target.current_health -= dmg
        # morale boost on kill
        if not target.is_alive():
            self.morale = min(100, self.morale + 15)

    def perform_melee_attack(self, target, terrain):
        """Attack an adjacent target in melee, applying damage based on terrain."""
        if self.attack_type != AttackType.MELEE:
            return  # cannot perform melee attack
        base_damage = calculate_melee_damage(self, target, terrain)
        # ability modifiers
        multiplier = 1.0
        # counter cavalry bonus
        if self.ability == SpecialAbility.COUNTER_CAVALRY and 'Horsemen' in target.name:
            multiplier *= 1.5
        # flanking bonus
        if self.ability == SpecialAbility.FLANK:
            multiplier *= 1.3
        damage = base_damage * multiplier
        dmg = apply_morale_modifier(damage, self.morale)
        target.current_health -= dmg
        if not target.is_alive():
            self.morale = min(100, self.morale + 15)
        # break lines: push target back one tile
        if self.ability == SpecialAbility.BREAK_LINES:
            # compute push direction
            dx = target.position[0] - self.position[0]
            dy = target.position[1] - self.position[1]
            push = (self.position[0] + (1 if dx>0 else -1 if dx<0 else 0),
                    self.position[1] + (1 if dy>0 else -1 if dy<0 else 0))
            target.position = push
