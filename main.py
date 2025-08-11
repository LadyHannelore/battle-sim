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
        # Load cogs - in discord.py load_extension is async
        cog_files = os.listdir('./cogs')
        for filename in cog_files:
            if filename.endswith('.py'):
                try:
                    await self.load_extension(f'cogs.{filename[:-3]}')
                    print(f'Loaded cog: {filename}')
                except Exception as e:
                    print(f'Failed to load cog {filename}: {e}')
        
        # Sync slash commands automatically on startup
        try:
            synced = await self.tree.sync()
            print(f'Synced {len(synced)} command(s) with Discord')
        except Exception as e:
            print(f'Failed to sync commands: {e}')

bot = BattleBot(command_prefix="!", intents=intents)


@bot.event
async def on_ready():
    if bot.user is not None:
        print(f'Logged in as {bot.user.name}')
    else:
        print('Logged in as Unknown User')
    print('-------------------')


# Check if token is available
token = os.getenv('TOKEN')
if not token:
    print("Error: TOKEN environment variable not found!")
    print("Please check your .env file or set the TOKEN environment variable.")
    exit(1)

bot.run(token)
