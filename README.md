# Battle Simulator Discord Bot

A Discord bot that provides a tactical battle simulation game with army management, battlefield visualization, and strategic combat mechanics.

## Features

- **Army Management**: Create, view, modify, and disband armies
- **Battle Thread System**: Create dedicated Discord threads for battles
- **Tactical Combat**: Engage in turn-based battles with unit placement and actions
- **Battlefield Visualization**: Generate visual representations of battles using rendered images
- **Unit Types**: Multiple unit types including infantry, commanders, shock troops, archers, cavalry, and chariots
- **Strategic Gameplay**: Place units strategically and engage in tactical warfare

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
TOKEN=your_discord_bot_token_here
```
**Note**: Replace `your_discord_bot_token_here` with your actual Discord bot token.

**For Replit users**: Instead of creating a `.env` file, use Replit's Secrets feature:
- Go to the "Secrets" tab in your Replit project
- Add a new secret with key `TOKEN` and your bot token as the value

4. Run the bot:
```bash
python main.py
```

5. Clear old commands and sync new ones (run this in Discord as the bot owner):
```
!force_sync
```

This will remove any old slash commands that might still be cached by Discord and register only the current commands.

## Dependencies

- `discord.py` - Discord API wrapper
- `python-dotenv` - Environment variable management
- `Pillow` - Image processing for battlefield rendering

## Commands

### Battle Commands (`/battle`)

- **create_thread** - Create a new battle thread with an opponent
- **start** - Start a new battle
- **place** - Place units on the battlefield
- **action** - Perform actions during battle
- **forfeit** - Forfeit the current battle

### Army Commands (`/army`)

- **create** - Create a new army
- **view** - View your current army
- **modify** - Modify your army composition
- **disband** - Disband your current army

## Game Mechanics

### 📖 Complete Battle Tutorial

**🗡️ [Read the Complete Battle System Tutorial](BATTLE_TUTORIAL.md)** for detailed gameplay instructions, strategies, and tactics!

### Unit Types

- **Infantry** 🛡️ - Basic ground units
- **Commander** 👑 - Leadership units  
- **Shock** ⚡ - Fast attack units
- **Archer** 🏹 - Ranged units
- **Cavalry** 🐎 - Mounted units
- **Chariot** 🏛️ - Heavy assault units

### Battle System Overview

1. **Battle Thread Creation**: Use `/battle create_thread` to create a dedicated thread for your battle
2. **Army Creation**: Both players automatically get starting armies, or create custom ones
3. **Battle Initiation**: Use `/battle start` to begin the tactical battle
4. **Unit Placement**: Strategic placement of units on a 9x9 grid
5. **Combat Resolution**: Turn-based combat with tactical decisions
6. **Victory Conditions**: Defeat enemy commander or eliminate all units

> 💡 **New to the battle system?** Check out the [Battle Tutorial](BATTLE_TUTORIAL.md) for step-by-step instructions and winning strategies!

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
│   └── battle.py         # Battle system commands
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

### Framework

Built with **discord.py** for reliable Discord integration and modern async/await patterns.

### Testing

To test the battlefield renderer:
```bash
python utils/battlefield_renderer.py
```

This will generate a test image showing the battlefield visualization.

## Troubleshooting

### Token Error (NoneType)
If you get `TypeError: token must be of type str, not NoneType`:

1. **Check your `.env` file exists** and contains:
   ```env
   TOKEN=your_actual_bot_token_here
   ```

2. **For Replit users**: Use the Secrets feature instead of `.env`:
   - Go to Secrets tab → Add `TOKEN` with your bot token

3. **Check file location**: The `.env` file must be in the same directory as `main.py`

### Old Commands Still Appear
If you see old slash commands when typing `/` that are no longer in the code:

1. Use `!force_sync` in Discord (as bot owner) to clear old commands
2. If that doesn't work, use `!clear_commands` then `!sync`
3. Discord can take up to 1 hour to update slash commands globally

### Bot Commands
- `!sync` - Sync current slash commands with Discord
- `!clear_commands` - Clear all slash commands from Discord
- `!force_sync` - Clear old commands and sync new ones

## Replit keep-alive

This project includes a tiny HTTP server and optional self-pinger to help keep the Replit instance awake.

Environment variables (add them in Replit Secrets):

- `KEEP_ALIVE=true` – starts a lightweight HTTP server on the port Replit provides
- `KEEPALIVE_URL=https://<your-repl-subdomain>.<owner>.repl.co` – optional; if omitted, we try to auto-detect
- `KEEPALIVE_INTERVAL_S=240` – optional; how often to ping (seconds)

Health endpoints served by the built-in server:

- `GET /` → 200 OK
- `GET /health` → 200 OK
- `GET /ping` → 200 OK

Recommended: set up an external uptime monitor (e.g., UptimeRobot) to ping `https://<your-repl>/health` every 5 minutes. Self-pinging may not always prevent sleep on free tiers; an external monitor is more reliable.

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

- Built with discord.py for Discord integration
- Uses Pillow for image processing
- Inspired by tactical strategy games
