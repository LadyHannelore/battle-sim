import os
import discord
from discord.ext import commands
from dotenv import load_dotenv

load_dotenv()

intents = discord.Intents.default()
intents.messages = True
intents.guilds = True
intents.message_content = True

bot = commands.Bot(command_prefix="!", intents=intents)


@bot.event
async def on_ready():
    if bot.user is not None:
        print(f'Logged in as {bot.user.name}')
    else:
        print('Logged in as Unknown User')
    print('-------------------')

# Load cogs
for filename in os.listdir('./cogs'):
    if filename.endswith('.py'):
        try:
            bot.load_extension(f'cogs.{filename[:-3]}')
            print(f'Loaded cog: {filename}')
        except Exception as e:
            print(f'Failed to load cog {filename}: {e}')


@bot.command()
@commands.is_owner()
async def sync(ctx):
    """Syncs slash commands with Discord."""
    try:
        await bot.sync_commands()
        await ctx.send("Commands synced successfully!")
    except Exception as e:
        await ctx.send(f"Error syncing commands: {e}")


bot.run(os.getenv('TOKEN'))
