# Battle Simulation System

A web-based tactical battle system inspired by strategic warfare mechanics, featuring a 9×9 chess-like battlefield with multiple unit types and war declaration systems.

## 🎮 Features

### War Declaration System
- **4 Casus Belli Types:**
  - **Skirmish:** Capture 1-20 tiles (4 turns)
  - **Conquest:** Capture 1-3 settlements (6 turns) 
  - **Raid:** Capture 1-15 loot (4 turns)
  - **Subjugation:** Capture enemy capital (6 turns)

### Tactical Combat
- **9×9 battlefield** with strategic positioning
- **6 unit types** with unique abilities:
  - 🛡️ **Infantry:** Basic melee unit
  - ⚡ **Shock:** Heavy defensive unit immune to single attacks
  - 🏹 **Archer:** Ranged unit that causes injuries
  - 👑 **Commander:** Critical leadership unit
  - 🐎 **Cavalry:** Fast-moving assault unit
  - 🏛️ **Chariot:** Heavy unit with rider combinations

### Battle Phases
1. **Placement Phase:** Deploy units in starting zones
2. **Battle Phase:** Move, turn, attack, or hold position
3. **Rally Phase:** Reorganize surviving forces

## 🚀 Quick Start

### Playing Locally
1. Clone or download this repository
2. Open `index.html` in any modern web browser
3. No additional setup required!

### Hosting on GitHub Pages
1. Fork this repository to your GitHub account
2. Go to repository Settings → Pages
3. Select "Deploy from a branch" → `main` branch → `/ (root)`
4. Your battle sim will be available at: `https://yourusername.github.io/battle-sim`

## 🎯 How to Play

### Starting a War
1. Navigate to **War Declaration**
2. Choose your **Casus Belli** (war justification)
3. Fill in opponent details and objectives
4. Create your declaration message
5. Click **Declare War** to enter battle

### Battle Controls
- **Click units** in the army panel to select them
- **Choose actions:** Move, Turn, Attack, or Do Nothing
- **Click battlefield cells** to execute actions
- **End Turn** when finished with all units
- **Victory condition:** Eliminate enemy commander

### Unit Abilities
- **Infantry/Shock/Commander:** Attack 1 tile in front direction
- **Archer:** Fire arrows up to 3 tiles away, causes injury
- **Cavalry:** Move up to 3 tiles, fast assault capability
- **Chariot:** Move 3 tiles in cardinal directions, high defense

### Strategic Tips
- Position archers behind front-line units
- Use shock troops to absorb enemy attacks
- Protect your commander at all costs
- Injured units have reduced effectiveness
- Control key battlefield positions

## 🛠️ Technical Details

### Technologies Used
- **HTML5** - Structure and semantics
- **CSS3** - Modern styling with grid layouts and animations
- **Vanilla JavaScript** - Game logic and interactivity
- **Google Fonts** - Typography (Cinzel + Inter)

### Browser Compatibility
- Chrome/Edge 88+
- Firefox 85+
- Safari 14+
- Mobile browsers supported

### File Structure
```
battle-sim/
├── index.html          # Main application page
├── styles.css          # Complete styling and animations
├── script.js           # Game logic and battle system
└── README.md           # This documentation
```

## 🎨 Customization

### Adding New Unit Types
1. Add unit properties to `Unit.setUnitProperties()`
2. Define icon, attack, defense, movement values
3. Implement special abilities in unit methods
4. Update UI elements in `createUnitElement()`

### Modifying Battle Rules
- Adjust battlefield size in `createBattlefield()`
- Change turn limits in war declaration logic
- Modify victory conditions in `endBattle()`
- Add new phases in `GameState.nextPhase()`

### Styling Changes
- Update CSS variables in `:root` for color schemes
- Modify grid layouts for different screen sizes
- Add new animations in the animations section
- Customize unit icons and battlefield appearance

## 📱 Mobile Support

The application is fully responsive and optimized for:
- **Desktop:** Full feature experience with hover effects
- **Tablet:** Touch-optimized controls and layouts
- **Mobile:** Compact UI with essential functionality

## 🔧 Development

### Local Development
```bash
# Clone the repository
git clone https://github.com/yourusername/battle-sim.git

# Navigate to directory
cd battle-sim

# Open in browser (no build process needed)
open index.html
```

### Adding Features
1. **New Game Modes:** Extend `GameState` class
2. **AI Opponents:** Implement computer player logic
3. **Multiplayer:** Add WebSocket communication
4. **Campaigns:** Create scenario system
5. **Army Customization:** Add unit purchase system

## 📋 Game Rules Reference

### War Restrictions
- Only 1 war at a time per player
- 2-week cooldown after war completion
- Auto-protection for 2 weeks after spawning
- Players can refuse full annexation

### Army Composition
- Base army: 5 infantry + 1 commander
- Purchasable upgrades:
  - 1 bronze → 3 shock units
  - 1 timber → 3 archer units  
  - 1 mount → 4 cavalry units
  - 1 mount → 2 chariot units

### Siege Rules
- Special battles on settlement tiles
- Defender gains loot based on settlement size:
  - Town: 1 loot
  - City: 4 loot
  - Metropolis: 9 loot

### Loot Values
1 loot can be exchanged for:
- 1 labor
- 30 coins
- 2 resources of choice

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🎯 Future Enhancements

- [ ] AI opponent system
- [ ] Campaign mode with story
- [ ] Multiplayer battles
- [ ] Army customization shop
- [ ] Tournament system
- [ ] Battle replays
- [ ] Advanced unit types
- [ ] Terrain effects
- [ ] Weather system
- [ ] Achievement system

---

**Ready to command your armies?** Deploy now and lead your forces to victory! ⚔️
