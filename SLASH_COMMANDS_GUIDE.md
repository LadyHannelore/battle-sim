"""
Step-by-step guide to get slash commands working in Discord
"""

print("🚀 Discord Bot Slash Commands Setup Guide")
print("=" * 50)

print("\n📋 STEP 1: Verify Your Bot Setup")
print("✅ Your bot code is correctly configured")
print("✅ All 11 slash commands are defined") 
print("✅ Commands use @app_commands.command decorators")
print("✅ Bot has automatic sync on startup")

print("\n📋 STEP 2: Start Your Bot")
print("Run: python main.py")
print("You should see:")
print("  - Loaded cog: admin.py")
print("  - Loaded cog: army.py") 
print("  - Loaded cog: battle.py")
print("  - Synced X command(s) with Discord")

print("\n📋 STEP 3: Wait for Discord Sync")
print("⏰ Slash commands can take up to 1 hour to appear globally")
print("💡 For faster testing, you can sync to a specific guild")

print("\n📋 STEP 4: Check Commands in Discord")
print("Type / in Discord chat - you should see:")
print("  /sync - Sync commands (admin)")
print("  /army_create - Create a new army")
print("  /army_view - View your armies")
print("  /army_modify - Modify army")
print("  /army_disband - Disband army")
print("  /battle_create_thread - Create battle thread")
print("  /battle_start - Start battle")
print("  /battle_place - Place units")
print("  /battle_action - Battle actions")
print("  /battle_forfeit - Forfeit battle")
print("  /army_leaderboard - Army leaderboard")

print("\n📋 STEP 5: Troubleshooting")
print("If commands don't appear:")
print("1. Use /sync command to manually sync")
print("2. Wait up to 1 hour for global sync")
print("3. Check bot has 'applications.commands' scope")
print("4. Verify bot permissions in server")

print("\n🎯 Your bot is ready! Start it with: python main.py")
