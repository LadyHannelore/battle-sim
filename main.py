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
        # Load cogs
        for filename in os.listdir('./cogs'):
            if filename.endswith('.py'):
                try:
                    # await self.load_extension(f'cogs.{filename[:-3]}')  # moved to setup_hook
                    print(f'Loaded cog: {filename}')
                except Exception as e:
                    print(f'Failed to load cog {filename}: {e}')

bot = BattleBot(command_prefix="!", intents=intents)

# Slash command syncing
@bot.tree.command(name="sync", description="Syncs slash commands with Discord.")
@commands.is_owner()
async def slash_sync(interaction: discord.Interaction):  # type: ignore
    """Syncs slash commands with Discord via slash command."""
    try:
        await bot.tree.sync()
        await interaction.response.send_message("Slash commands synced successfully!", ephemeral=True)
    except Exception as e:
        await interaction.response.send_message(f"Error syncing commands: {e}", ephemeral=True)


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
        # sync slash commands via app_commands
        await bot.tree.sync()
        await ctx.send("Commands synced successfully!")
    except Exception as e:
        await ctx.send(f"Error syncing commands: {e}")


@bot.command()
@commands.is_owner()
async def clear_commands(ctx):
    """Clears all slash commands from Discord."""
    try:
        # Clear all global slash commands
        bot.tree.clear_commands(guild=None)
        await bot.tree.sync()
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
        # Clear all commands and resync
        bot.tree.clear_commands(guild=None)
        await bot.tree.sync()
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
