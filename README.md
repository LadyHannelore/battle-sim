# Battle Simulator Discord Bot

A Discord bot that provides a tactical battle simulation game with army management, battlefield visualization, and strategic combat mechanics.

## Features

- **Army Management**: Create, view, modify, and disband armies
- **Battle System**: Engage in tactical battles with unit placement and actions
- **Battlefield Visualization**: Generate visual representations of battles using rendered images
- **Unit Types**: Multiple unit types including infantry, commanders, shock troops, archers, cavalry, and chariots
- **Strategic Gameplay**: Maneuver units, form treaties, and engage in warfare

## Setup

### Prerequisites

- Python 3.8 or higher
- Discord Bot Token
- Discord Application with Bot permissions

### Installation

1. Clone the repository:
```bash
git clone https://github.com/LadyHannelore/battle-sim.git
cd battle-sim
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Create a `.env` file in the root directory:
```env
DISCORD_TOKEN=your_discord_bot_token_here
```

4. Run the bot:
```bash
python main.py
```

## Dependencies

- `py-cord` - Discord API wrapper
- `python-dotenv` - Environment variable management
- `Pillow` - Image processing for battlefield rendering

## Commands

### Army Commands (`/army`)

- **create** - Create a new army
- **view** - View your current army
- **modify** - Modify your army composition
- **disband** - Disband your current army

### Battle Commands (`/battle`)

- **start** - Start a new battle
- **place** - Place units on the battlefield
- **action** - Perform actions during battle
- **forfeit** - Forfeit the current battle

### Other Commands

- **ping** - Check bot responsiveness
- **maneuver** - Execute tactical maneuvers
- **treaty** - Manage diplomatic relations
- **war** - Declare war or manage conflicts

## Game Mechanics

### Unit Types

- **Infantry** 🛡️ - Basic ground units
- **Commander** 👑 - Leadership units
- **Shock** ⚡ - Fast attack units
- **Archer** 🏹 - Ranged units
- **Cavalry** 🐎 - Mounted units
- **Chariot** 🏛️ - Heavy assault units

### Battle System

1. **Army Creation**: Players create armies with different unit compositions
2. **Battle Initiation**: Players can start battles against each other
3. **Unit Placement**: Strategic placement of units on a 9x9 grid
4. **Combat Resolution**: Turn-based combat with tactical decisions
5. **Victory Conditions**: Defeat enemy commander or eliminate all units

### Battlefield Visualization

The bot generates visual representations of battles showing:
- 9x9 grid battlefield
- Unit positions with emoji representations
- Clear distinction between different unit types
- Real-time battle state updates

## Project Structure

```
battle-sim/
├── main.py                 # Bot entry point
├── requirements.txt        # Python dependencies
├── .env                   # Environment variables (create this)
├── cogs/                  # Discord command modules
│   ├── army.py           # Army management commands
│   ├── battle.py         # Battle system commands
│   ├── maneuver.py       # Tactical maneuver commands
│   ├── ping.py           # Utility commands
│   ├── treaty.py         # Diplomatic commands
│   └── war.py            # War management commands
├── game/                  # Game logic modules
│   └── game_manager.py   # Core game mechanics
└── utils/                 # Utility modules
    └── battlefield_renderer.py  # Image rendering
```

## Development

### Code Quality

This project follows PEP 8 standards and includes:
- Type annotations for better code clarity
- Proper error handling
- Modular design with separation of concerns
- Comprehensive documentation

### Testing

To test the battlefield renderer:
```bash
python utils/battlefield_renderer.py
```

This will generate a test image showing the battlefield visualization.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes following PEP 8 standards
4. Test your changes
5. Submit a pull request

## License

This project is open source and available under the MIT License.

## Support

For issues, questions, or contributions, please open an issue on the GitHub repository.

## Acknowledgments

- Built with py-cord for Discord integration
- Uses Pillow for image processing
- Inspired by tactical strategy games
