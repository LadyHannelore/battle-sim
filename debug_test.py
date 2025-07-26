#!/usr/bin/env python3
import asyncio
import discord
from discord.ext import commands

# Test script to debug load_extension
intents = discord.Intents.default()

class DebugBot(commands.Bot):
    async def setup_hook(self):
        print("Debugging load_extension...")
        print(f"load_extension type: {type(self.load_extension)}")
        print(f"load_extension method: {self.load_extension}")
        
        # Try to call it and see what happens
        try:
            result = self.load_extension('cogs.admin')
            print(f"load_extension returned: {result}")
            if asyncio.iscoroutine(result):
                print("It's a coroutine, awaiting...")
                await result
                print("✅ Successfully awaited load_extension")
            else:
                print("✅ load_extension completed synchronously")
        except Exception as e:
            print(f"❌ Exception in load_extension: {e}")

async def debug_test():
    bot = DebugBot(command_prefix="!", intents=intents)
    await bot.setup_hook()
    print("Debug test completed!")
    
if __name__ == "__main__":
    asyncio.run(debug_test())
