import discord
from discord.commands import slash_command
from discord.ext import commands

class Admin(commands.Cog):
    def __init__(self, bot):
        self.bot = bot

    @slash_command(description="Sync slash commands with Discord (owner only)")
    @commands.is_owner()
    async def sync(self, ctx: discord.ApplicationContext):
        try:
            await self.bot.sync_commands()
            await ctx.respond("✅ Slash commands synced successfully!", ephemeral=True)
        except Exception as e:
            await ctx.respond(f"❌ Error syncing commands: {e}", ephemeral=True)

def setup(bot):
    bot.add_cog(Admin(bot))
