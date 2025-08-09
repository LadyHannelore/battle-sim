#!/usr/bin/env python3
import asyncio
import discord
from discord.ext import commands

# Test script to verify load_extension works
intents = discord.Intents.default()

class SimpleBot(commands.Bot):
    async def setup_hook(self):
        print("Testing load_extension...")
        try:
            await self.load_extension('cogs.admin')
            print("✅ Successfully loaded admin cog")
        except Exception as e:
            print(f"❌ Failed to load admin cog: {e}")

async def test_simple():
    bot = SimpleBot(command_prefix="!", intents=intents)
    await bot.setup_hook()
    print("Simple test completed!")
    
if __name__ == "__main__":
    asyncio.run(test_simple())
