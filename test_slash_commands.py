"""
Test script to verify slash commands are properly registered
Run this after starting your bot to check command registration
"""
import asyncio
import discord
from discord.ext import commands
from dotenv import load_dotenv
import os

load_dotenv()

intents = discord.Intents.default()
intents.messages = True
intents.guilds = True
intents.message_content = True

bot = commands.Bot(command_prefix="!", intents=intents)

@bot.event
async def on_ready():
    print(f'Logged in as {bot.user.name}')
    
    # Get all registered slash commands
    commands_list = bot.tree.get_commands()
    print(f"\n📋 Registered slash commands ({len(commands_list)}):")
    for cmd in commands_list:
        print(f"  /{cmd.name} - {cmd.description}")
    
    # Check if commands are synced with Discord
    try:
        synced_commands = await bot.tree.fetch_commands()
        print(f"\n🔄 Synced with Discord ({len(synced_commands)}):")
        for cmd in synced_commands:
            print(f"  /{cmd.name} - {cmd.description}")
    except Exception as e:
        print(f"\n❌ Error fetching synced commands: {e}")
    
    await bot.close()

if __name__ == "__main__":
    token = os.getenv('TOKEN')
    if not token:
        print("Error: TOKEN environment variable not found!")
        exit(1)
    
    print("Testing slash command registration...")
    bot.run(token)
