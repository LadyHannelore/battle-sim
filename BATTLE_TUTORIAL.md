# 🗡️ Battle System Tutorial

Welcome to the Battle Simulator! This tutorial will guide you through everything you need to know about the tactical battle system, from creating armies to winning battles.

## 📚 Table of Contents

1. [Getting Started](#getting-started)
2. [Army Management](#army-management)
3. [Battle Basics](#battle-basics)
4. [Unit Types & Strategies](#unit-types--strategies)
5. [Battle Phases](#battle-phases)
6. [Combat Mechanics](#combat-mechanics)
7. [Advanced Tactics](#advanced-tactics)
8. [Tips for Victory](#tips-for-victory)

---

## 🚀 Getting Started

### Prerequisites
- The bot must be invited to your Discord server
- You need permissions to create threads in the channel
- Basic understanding of Discord slash commands

### Your First Battle

1. **Challenge an opponent** using `/battle create_thread @opponent`
2. **Customize your army** (optional) with `/army modify`
3. **Start the battle** with `/battle start`
4. **Place your units** strategically during placement phase
5. **Fight tactically** during battle phase

---

## 🏰 Army Management

### Creating Armies

Every player starts with **Army #1** automatically when a battle thread is created:
- **5 Infantry units** 🛡️ (basic ground troops)
- **1 Commander** 👑 (your leader - protect at all costs!)

### Viewing Your Armies

```
/army view
```
This shows all your armies with their unit compositions.

### Modifying Armies

You can purchase additional units to strengthen your army:

```
/army modify army_id:[number] modification:[unit_type]
```

**Available Modifications:**
- `shock` - 3 Shock Units (1 Bronze) ⚡
- `archer` - 3 Archer Units (1 Timber) 🏹
- `cavalry` - 4 Cavalry Units (1 Mount) 🐎
- `chariot` - 2 Chariot Units (1 Mount) 🏛️

**Example:**
```
/army modify army_id:1 modification:archer
```

### Creating Additional Armies

```
/army create
```
Creates a new army for 1 labor resource (each army starts with basic units).

---

## ⚔️ Battle Basics

### Starting a Battle

1. **Create Battle Thread:**
   ```
   /battle create_thread opponent:@username thread_name:"Epic Battle"
   ```

2. **Start the Battle:**
   ```
   /battle start aggressor_army:1 defender_army:1
   ```
   - The aggressor (challenger) chooses which armies fight
   - Both army IDs refer to the respective players' armies

### Battle Layout

Battles take place on a **9x9 grid battlefield**:
- **Aggressor deployment zone:** Rows 7-8 (bottom)
- **Defender deployment zone:** Rows 0-1 (top)
- **Combat zone:** Rows 2-6 (middle)

```
Defender Zone    [0][1][2][3][4][5][6][7][8]  ← Row 0
Defender Zone    [0][1][2][3][4][5][6][7][8]  ← Row 1
Combat Zone      [0][1][2][3][4][5][6][7][8]  ← Row 2
Combat Zone      [0][1][2][3][4][5][6][7][8]  ← Row 3
Combat Zone      [0][1][2][3][4][5][6][7][8]  ← Row 4
Combat Zone      [0][1][2][3][4][5][6][7][8]  ← Row 5
Combat Zone      [0][1][2][3][4][5][6][7][8]  ← Row 6
Aggressor Zone   [0][1][2][3][4][5][6][7][8]  ← Row 7
Aggressor Zone   [0][1][2][3][4][5][6][7][8]  ← Row 8
```

---

## 🛡️ Unit Types & Strategies

### Unit Overview

| Unit | Emoji | Strengths | Weaknesses | Best Use |
|------|-------|-----------|------------|----------|
| **Infantry** | 🛡️ | Tanky, reliable | Slow, basic damage | Front line defense |
| **Commander** | 👑 | Leadership, victory condition | High value target | Protected position |
| **Shock** | ⚡ | Fast, high mobility | Lower defense | Flanking, quick strikes |
| **Archer** | 🏹 | Ranged attacks | Weak in melee | Back line support |
| **Cavalry** | 🐎 | High mobility, charge attacks | Vulnerable to spears | Hit-and-run tactics |
| **Chariot** | 🏛️ | Heavy assault, area damage | Slow, expensive | Breaking enemy lines |

### Unit Orientations

Units face in four directions, affecting their combat effectiveness:
- **North** ⬆️ - Facing toward defender zone
- **South** ⬇️ - Facing toward aggressor zone  
- **East** ➡️ - Facing right
- **West** ⬅️ - Facing left

**Strategic Note:** Units perform better when attacking enemies they're facing!

---

## 🎯 Battle Phases

### Phase 1: Placement Phase

**Goal:** Deploy all your units strategically in your deployment zone.

**Commands:**
```
/battle place unit_type:infantry x:4 y:8 orientation:north
```

**Placement Strategy:**
- **Front Line:** Place infantry and shock troops forward
- **Back Line:** Keep archers and commanders protected
- **Flanks:** Position cavalry for mobility
- **Center:** Strong units to hold the line

**Example Deployment (Aggressor):**
```
Row 8: [Archer] [Infantry] [Commander] [Infantry] [Archer]
Row 7: [Shock]  [Infantry] [Infantry]  [Infantry]  [Shock]
```

### Phase 2: Battle Phase

**Goal:** Outmaneuver and defeat your opponent through tactical combat.

**Available Actions:**
- **Move:** Reposition units on the battlefield
- **Turn:** Change unit orientation
- **Attack:** Engage enemy units (automatic when in range)
- **End Turn:** Pass your turn to opponent

### Phase 3: Victory Conditions

**You win by:**
1. **Defeating the enemy commander** 👑 (instant victory)
2. **Eliminating all enemy units** (total annihilation)

---

## ⚔️ Combat Mechanics

### Turn-Based System

- **Aggressor goes first** in battle phase
- **Alternating turns** between players
- **One action per turn** (move, turn, or end turn)

### Movement & Actions

**Move Units:**
```
/battle action action_type:move from_x:4 from_y:8 to_x:4 to_y:6
```

**Turn Units:**
```
/battle action action_type:turn from_x:4 from_y:6 orientation:east
```

**End Your Turn:**
```
/battle action action_type:end_turn
```

### Combat Resolution

- **Automatic attacks** when units are in range
- **Facing matters** - units fight better when facing their target
- **Unit type advantages** - some units are stronger against others
- **Positioning is key** - flanking and surrounding provides benefits

### Unit Status

Units can be in different states:
- **Healthy** 💚 - Full combat effectiveness
- **Damaged** 🟡 - Reduced effectiveness
- **Dead** ❌ - Removed from battlefield

---

## 🧠 Advanced Tactics

### Formation Strategies

**1. Phalanx Formation**
```
Infantry - Infantry - Infantry
Infantry - Commander - Infantry
```
- Strong frontal defense
- Protects commander
- Good against cavalry charges

**2. Archer Screen**
```
Archer - Archer - Archer
Infantry - Infantry - Infantry
```
- Ranged superiority
- Infantry protects archers
- Effective against slow units

**3. Cavalry Wings**
```
Cavalry - Infantry - Infantry - Infantry - Cavalry
   X    - Infantry - Commander - Infantry -    X
```
- Mobile flanking force
- Central infantry core
- Good for hit-and-run

### Tactical Maneuvers

**Flanking:** Attack enemy sides or rear for bonuses
**Pincer Movement:** Surround enemies with multiple units
**Fighting Withdrawal:** Trade space for time while preserving units
**Breakthrough:** Concentrate force to punch through enemy lines

### Map Control

- **High Ground:** Control center of battlefield
- **Chokepoints:** Force enemies into narrow passages
- **Flanking Routes:** Use battlefield edges for surprise attacks
- **Commander Safety:** Keep your commander behind front lines

---

## 🏆 Tips for Victory

### Strategic Planning

1. **Know Your Enemy:** Study opponent's army composition
2. **Plan Deployment:** Think 3-4 moves ahead
3. **Protect the Commander:** Your #1 priority
4. **Use Unit Strengths:** Play to each unit type's advantages
5. **Control Initiative:** Force opponent to react to your moves

### Common Mistakes to Avoid

❌ **Exposing your commander** too early
❌ **Spreading units too thin** across the battlefield  
❌ **Ignoring unit orientations** when placing/moving
❌ **Rushing forward** without a plan
❌ **Leaving flanks undefended**

### Winning Combinations

✅ **Archer + Infantry:** Ranged support with melee protection
✅ **Cavalry + Shock:** Fast, mobile strike force
✅ **Infantry + Commander:** Solid defensive core
✅ **Chariot + Support:** Heavy breakthrough with backup

### Psychological Warfare

- **Feints:** Threaten one area while attacking another
- **Pressure:** Force opponent into difficult decisions
- **Patience:** Wait for opponent mistakes
- **Adaptability:** Change tactics based on battlefield situation

---

## 🔧 Troubleshooting

### Common Issues

**"It's not your turn"**
- Wait for opponent to complete their action
- Check if you need to place more units

**"Invalid placement"**
- Ensure you're placing in your deployment zone
- Check if the tile is already occupied

**"Unit not available"**
- Verify you have that unit type in your army
- Check if all units of that type are already placed

**"No battle in progress"**
- Make sure you're in a battle thread
- Confirm battle has been started with `/battle start`

### Getting Help

If you encounter issues:
1. Check this tutorial for guidance
2. Use `/army view` to check your army status
3. Ask your opponent or server moderators
4. Report bugs to the bot developers

---

## 🎮 Quick Reference

### Essential Commands

| Command | Purpose |
|---------|---------|
| `/battle create_thread` | Start a new battle |
| `/battle start` | Begin the tactical phase |
| `/battle place` | Deploy units during placement |
| `/battle action` | Move, turn, or end turn |
| `/battle forfeit` | Surrender the battle |
| `/army view` | See your armies |
| `/army modify` | Buy unit upgrades |
| `/army create` | Make a new army |

### Unit Quick Reference

| Symbol | Unit | HP | Move | Special |
|--------|------|----|----- |---------|
| 🛡️ | Infantry | High | 1 | Defensive |
| 👑 | Commander | Medium | 1 | Victory target |
| ⚡ | Shock | Medium | 2 | Fast attack |
| 🏹 | Archer | Low | 1 | Ranged |
| 🐎 | Cavalry | Medium | 3 | Charge |
| 🏛️ | Chariot | High | 2 | Area damage |

---

## 🏁 Conclusion

The Battle Simulator combines strategic army building with tactical battlefield combat. Success requires:

- **Strategic thinking** in army composition
- **Tactical awareness** in unit placement  
- **Adaptive planning** during combat
- **Patience and practice** to master the system

Remember: Every great general started as a beginner. Learn from each battle, adapt your strategies, and soon you'll be leading your armies to glorious victory!

**Good luck, Commander! May your tactics be sound and your victories legendary!** ⚔️🏆

---

*For more information, check the main README.md or ask questions in your server's help channels.*
