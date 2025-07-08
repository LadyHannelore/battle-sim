"""
Helper functions: damage calc, rng, etc.
"""
import random


def calculate_ranged_damage(attacker, defender, terrain, distance):
    # ...existing code...
    return 0


def calculate_melee_damage(attacker, defender, terrain):
    # ...existing code...
    return 0


def roll_accuracy(base, distance):
    return max(0, base - distance * 10) / 100.0


def apply_morale_modifier(value, morale):
    if morale < 30:
        return 0
    if morale < 70:
        return value * 0.8
    return value
