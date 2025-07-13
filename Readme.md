# Grand-Tactical Battle System - Digital Implementation

![Battle System](https://img.shields.io/badge/Status-Fully%20Functional-brightgreen)
![Version](https://img.shields.io/badge/Version-1.0-blue)
![License](https://img.shields.io/badge/License-MIT-yellow)

A comprehensive digital implementation of a hex-based tactical wargame featuring deep strategic gameplay, realistic combat mechanics, and beautiful modern UI design.

## 🎯 Live Demo

Open `index.html` in your browser to start playing immediately!

## ✨ Features Implemented

### 🎮 **Core Game Systems**
- ✅ **Turn-based gameplay** with proper phase sequence (Initiative → Command → Movement → Combat)
- ✅ **Complete unit roster** - 12 different regiment types with unique stats
- ✅ **Terrain effects** - Hills, forests, marshes, roads affect movement and combat
- ✅ **Formation system** - Line, column, square, and wedge formations
- ✅ **Supply mechanics** - Ammunition tracking and resupply system
- ✅ **Command system** - Commander units with leadership abilities
- ✅ **Morale system** - Unit morale affects combat effectiveness
- ✅ **Weather system** - Dynamic weather affecting visibility and combat

### ⚔️ **Combat System**
- ✅ **Ranged and melee combat** with proper range calculations
- ✅ **One unit per tile** - No stacking, realistic tactical positioning
- ✅ **Movement validation** - Units cannot move through occupied spaces
- ✅ **Attack mechanics** - Damage calculation based on unit stats
- ✅ **Stamina system** - Movement costs stamina, affects unit performance
- ✅ **Experience levels** - Units gain experience through combat
- ✅ **Visual feedback** - Green tiles for valid moves, red for attacks

### 🎨 **User Interface**
- ✅ **Modern responsive design** with gradient backgrounds and animations
- ✅ **Comprehensive tutorial** - 6 sections covering all game mechanics
- ✅ **Interactive game board** - Hover effects and visual feedback
- ✅ **Army composition builder** - Drag-and-drop unit selection interface
- ✅ **Real-time statistics** - Turn counter, phase indicator, player status
- ✅ **Tab-based navigation** - Clean separation of Battle, Tutorial, and Setup
- ✅ **Notification system** - Informative messages for all game events
- ✅ **Save/Load system** - Persistent game state in browser storage

### 🏰 **Battle Types & Modes**
- ✅ **Open field battles** - Control objectives to achieve victory
- ✅ **Siege battles** - Attackers vs defenders with fortifications
- ✅ **Custom army builder** - Choose your own force composition
- ✅ **Practice mode** - Pre-configured balanced armies for learning
- ✅ **Interactive tutorial** - Step-by-step guided gameplay
- ✅ **Multiple board sizes** - 8x8, 16x16, or 30x30 battlefields

## 🚀 Quick Start

### Installation
1. Clone or download this repository
2. Open `index.html` in any modern web browser
3. No additional setup required!

### First Battle
1. Click the **Tutorial** tab to learn the basics
2. Go to **Setup** tab to configure your army
3. Use the **Army Composition** section to select units
4. Click **Start Battle** to begin fighting!

## 🎮 How to Play

### Game Controls
- **Click units** to select them (green highlight shows valid moves)
- **Click green tiles** to move selected units
- **Click red tiles** to attack enemy units
- **Use control panel** to advance through game phases
- **Right sidebar** shows detailed unit information when selected

### Game Flow
1. **Initiative Phase** - Roll initiative to determine turn order
2. **Command Phase** - Issue orders to your commanders
3. **Movement Phase** - Move units within their movement range
4. **Combat Phase** - Attack enemies within range
5. **End Turn** - Recover stamina and check victory conditions

### Unit Types Available

| Unit Type | Role | Special Abilities |
|-----------|------|------------------|
| **Peasants** | Cheap infantry | Low cost, expendable |
| **Light Foot** | Standard infantry | Balanced stats |
| **Bowmen** | Ranged troops | Long range attacks |
| **Pikemen** | Anti-cavalry | First strike ability |
| **Light Horse** | Fast cavalry | High mobility |
| **Armored Foot** | Heavy infantry | High defense |
| **Armored Horse** | Heavy cavalry | Devastating charges |
| **Catapult** | Siege artillery | Extreme range |
| **Ballista** | Precision artillery | Anti-personnel |
| **Battering Ram** | Siege engine | Anti-structure |
| **Siege Tower** | Mobile cover | Troop transport |
| **Commander** | Leadership | Command radius |

## 🏆 Victory Conditions

### Open Field Battles
- **Objective Control**: Control 60% of battlefield objectives
- **Enemy Rout**: Force 50% of enemy units to flee

### Siege Battles
- **Attacker Victory**: Capture and hold the central keep
- **Defender Victory**: Survive for 30 turns

## 🛠️ Technical Features

### Architecture
- **Pure HTML5/CSS3/JavaScript** - No frameworks required
- **Modular design** - Clean separation of concerns
- **Event-driven** - Responsive user interactions
- **Local storage** - Persistent game saves
- **Mobile-friendly** - Responsive design for all devices

### Performance
- **Optimized rendering** - Smooth animations and transitions
- **Efficient algorithms** - Fast pathfinding and combat resolution
- **Memory management** - Clean object lifecycle
- **Cross-browser compatibility** - Works in all modern browsers

## 📚 Game Mechanics Reference
## 📚 Game Mechanics Reference

### Unit Statistics
Each unit has the following core stats:
- **ATK (Attack)** - Combat effectiveness in battle
- **DEF (Defense)** - Resistance to damage
- **HP (Health Points)** - Damage unit can sustain
- **MV (Movement)** - Tiles unit can move per turn
- **MOR (Morale)** - Resistance to routing
- **RNG (Range)** - Attack range (0 = melee only)
- **STA (Stamina)** - Actions per turn before exhaustion
- **Cost** - Supply points required to field unit

### Terrain Effects
- **Open** - No movement penalty, no defensive bonus
- **Forest** - +2 movement cost, +2 defense, -2 missile accuracy
- **Hills** - +2 movement cost, +3 defense, missile advantage
- **Marsh** - +3 movement cost, cavalry penalty
- **Roads** - Half movement cost, no defensive bonus

### Combat Resolution
1. **Range Check** - Is target within weapon range?
2. **Line of Sight** - Can attacker see target?
3. **Attack Roll** - Modified by terrain, formation, morale
4. **Damage Calculation** - Based on attack vs defense
5. **Morale Check** - Units may rout if heavily damaged

### Phase Sequence
1. **Initiative** - Determine turn order
2. **Weather** - Roll for weather effects
3. **Command** - Issue orders to units
4. **Movement** - Move units within range
5. **Combat** - Resolve all attacks
6. **Rally** - Attempt to restore morale
7. **Supply** - Check ammunition and stamina
8. **Victory** - Check winning conditions

## 🎯 Strategy Tips

### Beginner Tips
- **Use terrain wisely** - Hills and forests provide defensive bonuses
- **Protect your flanks** - Don't let enemies surround you
- **Combine arms** - Mix infantry, cavalry, and ranged units
- **Watch your stamina** - Exhausted units fight poorly
- **Control commanders** - They boost nearby unit performance

### Advanced Tactics
- **Formation fighting** - Use pike squares against cavalry
- **Concentration of force** - Focus attacks on weak points
- **Strategic reserves** - Keep fresh units for decisive moments
- **Supply lines** - Ensure units can resupply ammunition
- **Psychological warfare** - Breaking enemy morale wins battles

## 🔧 Development & Customization

### File Structure
```
battle-sim/
├── index.html          # Main application file
├── script.js           # Game logic and mechanics
├── styles.css          # UI styling and animations
└── README.md          # This documentation
```

### Customization Options
- **Unit Stats** - Modify `REGIMENT_CATALOGUE` in script.js
- **Board Sizes** - Add new sizes to setup options
- **Terrain Types** - Extend `TERRAIN_EFFECTS` object
- **UI Themes** - Customize CSS color schemes
- **Victory Conditions** - Modify win condition logic

### Browser Compatibility
- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Safari 13+
- ✅ Edge 80+

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues for:
- Bug fixes
- New features
- UI improvements
- Documentation updates
- Balance suggestions

## 🎖️ Credits

Based on the comprehensive Grand-Tactical Battle System rules. Digital implementation features modern web technologies and responsive design principles.

---

**Ready to command your army to victory? Open `index.html` and begin your tactical conquest!**

---

## Original Rule System Reference

*The following is the complete mechanical chassis that this digital implementation is based on:*
GRAND-TACTICAL BATTLE SYSTEM
Comprehensive rules for 30 × 30 hex-based battles that can be either open-field or siege actions.
Everything is expressed as raw mechanics; no code is implied.
Use, ignore, or tweak any subsystem as desired.

────────────────────────────────────────

UNIVERSAL FRAMEWORK
────────────────────────────────────────
1.1 Scale
• 1 hex = 30 m.
• 1 regiment ≈ 200–400 actual soldiers but is treated as a single “piece”.
• 1 turn = 5–7 minutes of real time.
• A full battle lasts until: (a) one side concedes, (b) all objectives are taken, or (c) 40 turns elapse.
1.2 Sequence of Play (per turn)

Initiative Phase – roll d100 + commander skill; winner chooses first or second activation.
Weather & Visibility Phase – may reduce missile range or cancel flying units.
Command Phase – issue up to 3 standing orders per commander; each order has a 2-hex command radius.
Activation Phase – alternate single-regiment activations until all have acted.
End Phase – check victory, rout, supply, fire spread, etc.
────────────────────────────────────────
2. REGIMENT CATALOGUE
────────────────────────────────────────
Stat block for every regiment:
Attack (ATK) | Defense (DEF) | Health (HP) | Speed (MV) | Morale (MOR) | Range (RNG) | Stamina (STA) | Cost (Supply)

Base values

Peasants 4 | 3 | 60 | 3 | 60 | 0 | 3 | 1
Light Foot 7 | 5 | 50 | 4 | 70 | 0 | 4 | 2
Bowmen 6 | 3 | 40 | 4 | 65 | 5 | 3 | 2
Pikemen 8 | 6 | 55 | 3 | 75 | 1* | 4 | 3
Light Horse 8 | 4 | 45 | 6 | 75 | 0 | 5 | 3
Armored Foot 10 | 9 | 70 | 2 | 80 | 0 | 5 | 4
Armored Horse 12 | 7 | 60 | 5 | 85 | 0 | 6 | 5
*Pikemen have 1-hex “first strike” vs charging cavalry.

2.1 Experience Levels
Green → Regular → Veteran → Elite → Legendary.
Each step gives +1 ATK, +1 DEF, +10 MOR, +10 HP, and unlocks one Doctrine (see 5.1).

2.2 Fatigue
Every move or combat costs 1 STA. STA = 0 → −2 MV, −2 ATK, MOR −10. STA recovers 2 per turn if the regiment neither moves nor fights.

────────────────────────────────────────
3. TERRAIN & FEATURES
────────────────────────────────────────
Hex Terrain Table (MV cost / DEF bonus / Missile penalty)
Open 1 / 0 / 0
Forest 2 / +2 / −2 range
Hill 2 / +3 / −1 range
Marsh 3 / 0 / 0 (cavalry −1 ATK)
River Impassable except at fords/bridges; ford costs 3 MV.
Road 0.5 MV (round down) through any terrain.

3.1 Elevation
Each full contour level gives:
+1 range to missiles firing downhill, −1 range firing uphill.
Charging downhill gives +2 ATK.

3.2 Structures
Palisade (wood wall) 40 HP, DEF +4, blocks movement.
Stone Wall 100 HP, DEF +6, blocks movement.
Gate (wood) 60 HP, DEF +2, must be occupied to open/close.
Gate (iron) 100 HP, DEF +4.
Siege Tower – moves 2 hex/turn, carries 1 regiment, ignores walls for 1 turn when placed.
Battering Ram – moves 2 hex/turn, 25 wall damage/turn if adjacent and unengaged.
Catapult – stationary, range 4-10, 1d20 damage to wall sections or 15 splash to units.
Ballista – range 3-8, 1d12 vs cavalry or 1d8 vs foot, no splash.

3.3 Fire & Destruction
Each wall/gate section reduced to 0 HP becomes rubble (rough terrain, costs 2 MV).
Buildings can catch fire (roll 1d6 each turn; on 6 it spreads to adjacent hex).
Fire deals 5 HP/turn to any regiment inside and blocks LOS.

────────────────────────────────────────
4. FORMATIONS & TACTICAL ORDERS
────────────────────────────────────────
4.1 Pre-battle Deployment
Open field: each side deploys in a 5-hex deep zone on opposite edges.
Siege: defender deploys inside fortifications; attacker outside.

4.2 Formation Types
Line – no modifiers.
Column – +2 MV on roads, −2 DEF.
Phalanx – pikemen only; front 3 hexes gain +50% DEF vs mounted, cannot turn quickly (costs 2 MV to change facing).
Schiltron – circular pike formation; cannot move, +100% DEF vs cavalry, −50% vs missiles.
Wedge – cavalry only; +3 ATK on first charge, −2 DEF thereafter.
Skirmish – light foot/bow; −30% damage taken from missiles, +1 MV, cannot melee.
Shieldwall – heavy foot; +3 DEF vs missiles, −1 MV.
Square – anti-cavalry; same as Schiltron but mobile at cost 3 MV.

Changing formation costs 1 STA and 1 MV.

4.3 Facing & Flanking
Each regiment has a front arc (3 hexes), flanks (2 hexes), rear (1 hex).
Attacking flank: +15% damage.
Attacking rear: +30% damage, defender MOR −10.
Turning 60° costs 1 MV; turning 180° costs 2 MV.

4.4 Zone of Control (ZOC)
Every regiment exerts a 1-hex ZOC. Entering an enemy ZOC ends movement unless the moving regiment has “Skirmish” or is withdrawing. Cavalry may “breakthrough” – if they destroy or rout a regiment, they may continue movement up to remaining MV.

────────────────────────────────────────
5. COMMAND & CONTROL
────────────────────────────────────────
5.1 Commander Profiles
Each army has 1–3 commanders with ratings 1–5 in:
Leadership (affects MOR), Tactics (affects initiative), Logistics (affects supply).
Command radius = rating × 2 hexes. Orders issued outside cost 1 extra STA to the regiment.

5.2 Doctrines (choose 1 per veteran+ regiment)
Shield Drill – ignore first missile hit each turn.
Pavise – bowmen deploy mobile cover; +2 DEF vs missiles, cannot move same turn.
Feigned Flight – cavalry may retreat 2 hexes after melee, enemy may pursue.
Sapper – regiment may destroy 1 wall segment in 2 turns instead of 3.
Trailblazer – ignore first 2 MV of rough terrain each turn.

5.3 Supply & Ammunition
Missile units carry 10 volleys; resupply from baggage trains (cost 1 action adjacent).
Besieged defenders consume 1 supply/turn; attackers consume 1 supply/regiment every 3 turns.
If supply runs out: −2 ATK, −2 DEF, −20 MOR per turn.

────────────────────────────────────────
6. COMBAT PROCEDURE
────────────────────────────────────────
6.1 Ranged Combat

Check range and LOS.
Determine cover (walls, forests, elevation).
Roll 1d100 ≤ modified accuracy (base 70 ± modifiers).
Damage = ATK × (1 + elevation bonus) – (DEF + cover).
Apply to HP; if HP ≤ 0, regiment routs.
6.2 Melee Combat

Declare charge (if cavalry/foot moving 2+ hexes straight into contact). Charge gives +2 ATK first round.
Simultaneous strike.
Compare damage; defender may counter (pikemen always counter cavalry).
Morale test: 1d100 > current MOR → rout 2d6 hexes toward map edge.
Pursuit: cavalry may follow up 1 hex and attack again if enemy routs.
6.3 Catastrophic Events
• Commander casualty – all regiments in command radius take −20 MOR.
• Standard lost – regiment MOR halved.
• Elephant rampage (if added) – moves randomly 1d6 hex, trampling friend and foe.

────────────────────────────────────────
7. MORALE & ROUT
────────────────────────────────────────
Morale state table
Steady (100-70) – full power.
Wavering (69-40) – −2 ATK/DEF.
Disordered (39-20) – −4 ATK/DEF, may not charge.
Rout (19-0) – flee 2d6 hex per turn; if they exit map, regiment is removed.
Rally: A commander adjacent may attempt 1d100 ≤ Leadership×15 to raise MOR by 20.

────────────────────────────────────────
8. SIEGE-SPECIFIC RULES
────────────────────────────────────────
8.1 Siege Timeline
Day 0: attacker arrives, may begin circumvallation (1 hex of entrenchment per turn).
Every 3rd turn: defender must test supply; failure gives −10 MOR army-wide.
Mining: Sappers dig a 3-hex tunnel in 6 turns; when complete, a wall section collapses automatically.

8.2 Sorties
Defender may open a gate and launch a limited counter-attack; regiments sortie with +10 MOR but must return within 5 turns or lose supply.

8.3 Artillery Duels
Catapults and ballista may target each other at −30% accuracy. Destroying attacker artillery removes 1 siege point per engine.

────────────────────────────────────────
9. OPEN-FIELD SPECIAL RULES
────────────────────────────────────────
9.1 Strategic Points
At setup, place 3–5 objective markers (road junctions, hills, bridges). Each controlled objective gives +5 MOR to the owner each turn.

9.2 Ambush Deployment
Up to 25% of army points may start hidden in forests or behind hills; reveal when enemy enters 2-hex range or when they choose to activate.

9.3 Night Fighting
After 20 turns roll 1d6; on 4+ dusk falls. Missile range halved, ZOC reduced to 0, commander radius −1. Battle ends after 5 night turns if no decisive result.

9.4 Reinforcements
Both sides may have delayed wings arriving on a random board edge on turn 6+ (roll 1d6 each turn, arrive on 6).

────────────────────────────────────────
10. VICTORY & SCORING
────────────────────────────────────────
10.1 Primary Objectives
Open Field: Control ≥ 60% objectives at end OR rout ≥ 50% enemy regiments.
Siege: Attacker breaches and occupies the central keep; defender holds for 30 turns.

10.2 Secondary Objectives (decide before battle)
• Kill enemy commander.
• Keep all own artillery intact.
• Prevent any enemy regiment from exiting your baseline.

10.3 Glory Points
Award 1 point per: enemy regiment destroyed, objective held at end, commander slain, gate breached.
Highest total wins if time expires.

────────────────────────────────────────
11. OPTIONAL MODULES
────────────────────────────────────────
11.1 Weather
Rain – missiles −2 range, marsh MV +1.
Snow – all MV −1, STA cost +1.
Fog – LOS reduced to 3 hex, ambush easier.

11.2 Magic / Religion
Cleric regiment – once per battle may heal 20 HP to adjacent regiment.
Battle prayer – commander may sacrifice 1 turn to give all units +10 MOR for 3 turns.

11.3 Mercenaries
Random availability before battle; cost double supply but come elite.

11.4 Sea & Riverine
Add barges and bridges; units on water have HP 20, DEF 2, sink on rout.

────────────────────────────────────────
12. QUICK-REFERENCE TABLES
────────────────────────────────────────
Missile Modifiers
Target in shieldwall −20% accuracy
Target behind wall −40%
Firing uphill −20%
Firing from hill +20%
Target in forest −30%

Charge Modifiers
Downhill +2 ATK
Across river −3 ATK
Into forest −2 ATK

Morale Modifiers
Enemy commander slain +20
Friendly standard lost −25
Flanked −15
In fortifications +10

────────────────────────────────────────
13. ONE-PAGE SUMMARY FOR PLAYERS
────────────────────────────────────────

Alternate moving one regiment at a time.
Terrain matters more than stats.
Keep commanders alive and inside radius.
Watch STA and ammo.
Flank, rally, and concentrate force.
In sieges, bring sappers and patience.
In open field, seize the high ground and the clock.
This is the full mechanical chassis; every knob (die size, modifier, cost) can be tuned for balance without breaking the framework.