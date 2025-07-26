#!/usr/bin/env python3
import asyncio
import os
import discord
from discord.ext import commands

# Test script to verify bot functionality
intents = discord.Intents.default()
intents.messages = True
intents.guilds = True
intents.message_content = True

class TestBot(commands.Bot):
    async def setup_hook(self):
        print("Setting up cogs...")
        # Load cogs
        cog_files = os.listdir('./cogs')
        for filename in cog_files:
            if filename.endswith('.py'):
                try:
                    await self.load_extension(f'cogs.{filename[:-3]}')
                    print(f'✅ Loaded cog: {filename}')
                except Exception as e:
                    print(f'❌ Failed to load cog {filename}: {e}')
        print("Cog loading complete!")

async def test_bot():
    bot = TestBot(command_prefix="!", intents=intents)
    # Just create the bot and run setup, don't actually connect
    await bot.setup_hook()
    print("Bot test completed successfully!")
    
if __name__ == "__main__":
    asyncio.run(test_bot())
