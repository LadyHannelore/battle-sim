"""
Helper functions: damage calc, rng, etc.
"""
import random


def calculate_ranged_damage(attacker, defender, terrain, distance):
    """
    Compute ranged damage as a function of attacker speed and defender defense.
    """
    base = attacker.speed * 1.0
    # reduce damage by half of defender defense
    dmg = base - (defender.defense * 0.5)
    return max(1, int(dmg))


def calculate_melee_damage(attacker, defender, terrain):
    """
    Compute melee damage based on attacker speed and defense values.
    """
    base = attacker.speed + attacker.defense
    dmg = base - defender.defense
    return max(1, int(dmg))


def roll_accuracy(base, distance):
    return max(0, base - distance * 10) / 100.0


def apply_morale_modifier(value, morale):
    if morale < 30:
        return 0
    if morale < 70:
        return value * 0.8
    return value
