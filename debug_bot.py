"""
Debug script to check command registration
"""
import discord
from discord.ext import commands
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def check_slash_commands():
    """Check if slash commands are properly defined in cogs"""
    print("🔍 Checking slash command definitions in cogs...")
    
    # Import cogs to check their commands
    try:
        from cogs.admin import Admin
        from cogs.army import Army  
        from cogs.battle import Battle
        
        # Create a temporary bot to check commands
        intents = discord.Intents.default()
        bot = commands.Bot(command_prefix="!", intents=intents)
        
        # Check admin commands
        admin_cog = Admin(bot)
        admin_commands = [cmd for cmd in dir(admin_cog) if hasattr(getattr(admin_cog, cmd), '__qualname__') and 'app_commands' in str(type(getattr(admin_cog, cmd)))]
        print(f"Admin commands found: {len(admin_commands)}")
        
        # Check army commands  
        army_cog = Army(bot)
        army_commands = [cmd for cmd in dir(army_cog) if hasattr(getattr(army_cog, cmd), '__qualname__') and 'app_commands' in str(type(getattr(army_cog, cmd)))]
        print(f"Army commands found: {len(army_commands)}")
        
        # Check battle commands
        battle_cog = Battle(bot)
        battle_commands = [cmd for cmd in dir(battle_cog) if hasattr(getattr(battle_cog, cmd), '__qualname__') and 'app_commands' in str(type(getattr(battle_cog, cmd)))]
        print(f"Battle commands found: {len(battle_commands)}")
        
        print("✅ All cogs imported successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Error importing cogs: {e}")
        return False

def check_env():
    """Check if environment variables are set"""
    print("🔍 Checking environment variables...")
    token = os.getenv('TOKEN')
    if token:
        print("✅ TOKEN found in environment")
        return True
    else:
        print("❌ TOKEN not found in environment")
        return False

if __name__ == "__main__":
    print("🚀 Discord Bot Debug Check")
    print("=" * 40)
    
    env_ok = check_env()
    cogs_ok = check_slash_commands()
    
    if env_ok and cogs_ok:
        print("\n✅ All checks passed! Your bot should work correctly.")
        print("\n💡 Next steps:")
        print("1. Run your bot: python main.py")
        print("2. Use the /sync command in Discord to register slash commands")
        print("3. Slash commands should appear in Discord")
    else:
        print("\n❌ Some checks failed. Please fix the issues above.")
