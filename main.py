import os
import discord
from discord.ext import commands
from dotenv import load_dotenv

load_dotenv()

intents = discord.Intents.default()
intents.messages = True
intents.guilds = True
intents.message_content = True

# Subclass Bot to load extensions asynchronously  
class BattleBot(commands.Bot):
    async def setup_hook(self):
        # Load cogs - in py-cord load_extension is synchronous
        cog_files = os.listdir('./cogs')
        for filename in cog_files:
            if filename.endswith('.py'):
                try:
                    self.load_extension(f'cogs.{filename[:-3]}')
                    print(f'Loaded cog: {filename}')
                except Exception as e:
                    print(f'Failed to load cog {filename}: {e}')

bot = BattleBot(command_prefix="!", intents=intents)


@bot.event
async def on_ready():
    if bot.user is not None:
        print(f'Logged in as {bot.user.name}')
    else:
        print('Logged in as Unknown User')
    print('-------------------')



@bot.command()
@commands.is_owner()
async def sync(ctx):
    """Syncs slash commands with Discord."""
    try:
        # sync slash commands via py-cord
        await bot.sync_commands()
        await ctx.send("Commands synced successfully!")
    except Exception as e:
        await ctx.send(f"Error syncing commands: {e}")


@bot.command()
@commands.is_owner()
async def clear_commands(ctx):
    """Clears all slash commands from Discord."""
    try:
        # Clear all global slash commands (py-cord method)
        await bot.sync_commands(delete_existing=True)
        await ctx.send(
            "All slash commands cleared! "
            "Use `!sync` to register current commands."
        )
    except Exception as e:
        await ctx.send(f"Error clearing commands: {e}")


@bot.command()
@commands.is_owner()
async def force_sync(ctx):
    """Clears old commands and syncs current ones."""
    try:
        # Clear all commands and resync (py-cord method)
        await bot.sync_commands(delete_existing=True)
        await ctx.send(
            "Force sync completed! "
            "This should clear old commands and register new ones."
        )
    except Exception as e:
        await ctx.send(f"Error during force sync: {e}")


# Check if token is available
token = os.getenv('TOKEN')
if not token:
    print("Error: TOKEN environment variable not found!")
    print("Please check your .env file or set the TOKEN environment variable.")
    exit(1)

bot.run(token)
