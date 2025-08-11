# Slash Commands Not Appearing? Here's the Solution!

## 🔧 Problem: Slash Commands Don't Show Up in Discord

### ✅ Solution Implemented:

1. **Automatic Sync on Startup** 
   - Bot now automatically syncs commands when it starts up
   - You'll see: `Synced X command(s) with Discord`

2. **Manual Sync Command**
   - Use `/sync` command (owner only) 
   - For faster testing: `/sync guild_id:YOUR_GUILD_ID`
   - Guild sync is instant, global sync takes up to 1 hour

## 🚀 How to Get Your Slash Commands Working:

### Step 1: Start Your Bot
```bash
python main.py
```

You should see:
```
✅ Loaded cog: admin.py
✅ Loaded cog: army.py  
✅ Loaded cog: battle.py
Synced 11 command(s) with Discord
```

### Step 2: Option A - Wait (Global Sync)
- Commands will appear automatically within 1 hour
- This is the automatic global sync

### Step 2: Option B - Fast Guild Sync
1. Get your server's Guild ID:
   - Right-click your server name in Discord
   - Click "Copy Server ID" (Developer Mode must be enabled)
2. In Discord, type: `/sync guild_id:YOUR_GUILD_ID` 
3. Commands appear instantly in that server

### Step 3: Verify Commands Work
You should see these 11 slash commands:
- `/sync` - Sync commands (admin only)
- `/army_leaderboard` - View leaderboards (admin)
- `/army_create` - Create new army
- `/army_view` - View your armies
- `/army_modify` - Modify army composition  
- `/army_disband` - Disband an army
- `/battle_create_thread` - Start a new battle
- `/battle_start` - Begin battle with armies
- `/battle_place` - Place units on battlefield
- `/battle_action` - Move, turn, or end turn
- `/battle_forfeit` - Forfeit the battle

## 🛠️ Troubleshooting:

### Commands Still Not Showing?
1. **Check Bot Permissions**:
   - Bot needs `applications.commands` scope
   - Bot needs appropriate permissions in server

2. **Check Bot Status**:
   - Bot must be online and connected
   - Check console for any error messages

3. **Force Sync**:
   - Use `/sync` command manually
   - Try guild-specific sync for testing

4. **Discord Cache**:
   - Restart Discord client
   - Clear Discord cache if needed

### Bot Owner Setup:
Make sure your Discord user ID is set as the bot owner in your bot application settings on Discord Developer Portal.

## ✅ Your Bot is Ready!

All 11 slash commands are properly configured and will appear in Discord once synced. The conversion from pycord to discord.py is complete with full functionality preserved!
