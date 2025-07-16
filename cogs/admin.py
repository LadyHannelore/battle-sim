import discord
from discord.commands import slash_command
from discord.ext import commands
from game.game_manager import game_manager

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

    @slash_command(description="Show a leaderboard of all users' armies (admin only)")
    @commands.is_owner()
    async def army_leaderboard(self, ctx: discord.ApplicationContext):
        # Aggregate all armies from all games
        user_stats = {}
        for game in game_manager.games.values():
            for user_id, armies in game.armies.items():
                if user_id not in user_stats:
                    user_stats[user_id] = {"army_count": 0, "unit_count": 0}
                user_stats[user_id]["army_count"] += len(armies)
                for army in armies:
                    user_stats[user_id]["unit_count"] += sum(u["count"] for u in army["units"])

        if not user_stats:
            await ctx.respond("No armies found.", ephemeral=True)
            return

        # Sort by army count, then by unit count
        leaderboard = sorted(user_stats.items(), key=lambda x: (-x[1]["army_count"], -x[1]["unit_count"]))

        # Fetch usernames
        lines = []
        for idx, (user_id, stats) in enumerate(leaderboard, 1):
            try:
                user = await self.bot.fetch_user(user_id)
                name = user.display_name if hasattr(user, 'display_name') else user.name
            except Exception:
                name = f"User {user_id}"
            lines.append(f"**{idx}. {name}** — {stats['army_count']} armies, {stats['unit_count']} units")

        embed = discord.Embed(
            title="🏆 Army Leaderboard",
            description="\n".join(lines),
            color=discord.Color.gold()
        )
        await ctx.respond(embed=embed, ephemeral=True)

def setup(bot):
    bot.add_cog(Admin(bot))
