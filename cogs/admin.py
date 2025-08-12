import discord
from discord.ext import commands
from discord import app_commands
from game.game_manager import game_manager

class Admin(commands.Cog):
    def __init__(self, bot):
        self.bot = bot

    @app_commands.command(name="sync", description="Sync slash commands with Discord (owner only)")
    @app_commands.describe(guild_id="Optional: Guild ID to sync to (faster than global)")
    async def sync(self, interaction: discord.Interaction, guild_id: str = ""):
        if interaction.user.id != self.bot.owner_id:
            await interaction.response.send_message("Only the bot owner can use this command.", ephemeral=True)
            return
        try:
            if guild_id and guild_id.strip():
                # Sync to specific guild (faster)
                guild = discord.Object(id=int(guild_id))
                self.bot.tree.copy_global_to(guild=guild)
                synced = await self.bot.tree.sync(guild=guild)
                await interaction.response.send_message(f"✅ Synced {len(synced)} commands to guild {guild_id}!", ephemeral=True)
            else:
                # Global sync (can take up to 1 hour)
                synced = await self.bot.tree.sync()
                await interaction.response.send_message(f"✅ Synced {len(synced)} commands globally (may take up to 1 hour to appear)!", ephemeral=True)
        except Exception as e:
            await interaction.response.send_message(f"❌ Error syncing commands: {e}", ephemeral=True)

    @app_commands.command(name="army_leaderboard", description="Show a leaderboard of all users' armies (admin only)")
    async def army_leaderboard(self, interaction: discord.Interaction):
        if interaction.user.id != self.bot.owner_id:
            await interaction.response.send_message("Only the bot owner can use this command.", ephemeral=True)
            return
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
            await interaction.response.send_message("No armies found.", ephemeral=True)
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
        await interaction.response.send_message(embed=embed, ephemeral=True)

    @app_commands.command(name="resources_view", description="View your resources (admin: for any user) in this game thread")
    @app_commands.describe(user_id="Optional: user id to view (admin only)")
    async def resources_view(self, interaction: discord.Interaction, user_id: str = ""):
        game = game_manager.get_game(interaction.channel_id)
        if not game:
            await interaction.response.send_message('This command can only be used inside a battle thread.', ephemeral=True)
            return
        target_id = interaction.user.id
        if user_id.strip():
            if interaction.user.id != self.bot.owner_id:
                await interaction.response.send_message("Only the bot owner can query other users.", ephemeral=True)
                return
            try:
                target_id = int(user_id)
            except Exception:
                await interaction.response.send_message("Invalid user_id.", ephemeral=True)
                return
        res = game.get_resources(target_id)
        if not res["success"]:
            await interaction.response.send_message(res["message"], ephemeral=True)
            return
        
        # Format resources nicely
        resources = res["resources"]
        basic_resources = []
        special_resources = []
        
        # Basic spawnable resources
        for key in ["food", "timber", "copper", "tin", "mounts", "books", "bronze"]:
            if key in resources:
                basic_resources.append(f"{key}: {resources[key]}")
        
        # Economy & population
        for key in ["population", "labor", "coins"]:
            if key in resources:
                special_resources.append(f"{key}: {resources[key]}")
        
        # Unique resources
        unique = resources.get("unique_resources", {})
        if unique:
            unique_list = [f"{name}" for name in unique.keys()]
            special_resources.append(f"unique: {', '.join(unique_list)}")
        
        embed = discord.Embed(title=f"Resources for <@{target_id}>", color=discord.Color.blue())
        if basic_resources:
            embed.add_field(name="Basic Resources", value="\n".join(basic_resources), inline=True)
        if special_resources:
            embed.add_field(name="Economy & Special", value="\n".join(special_resources), inline=True)
        
        await interaction.response.send_message(embed=embed, ephemeral=True)

    @app_commands.command(name="resources_set", description="Admin: set resources for a user in this game thread")
    @app_commands.describe(
        user_id="Target user id",
        resource_name="Name of the resource to set",
        value="Value to set (for unique resources, use /resources_add_unique)"
    )
    async def resources_set(self, interaction: discord.Interaction, user_id: str, resource_name: str, value: int):
        if interaction.user.id != self.bot.owner_id:
            await interaction.response.send_message("Only the bot owner can use this command.", ephemeral=True)
            return
        game = game_manager.get_game(interaction.channel_id)
        if not game:
            await interaction.response.send_message('This command can only be used inside a battle thread.', ephemeral=True)
            return
        try:
            uid = int(user_id)
        except Exception:
            await interaction.response.send_message("Invalid user_id.", ephemeral=True)
            return
        
        # Use kwargs to set any resource
        kwargs = {resource_name: value}
        res = game.set_resources(uid, **kwargs)
        await interaction.response.send_message(res.get("message", "Done."), ephemeral=True)

    @app_commands.command(name="resources_add", description="Admin: add resources (positive/negative) to a user in this game thread")
    @app_commands.describe(
        user_id="Target user id",
        resource_name="Name of the resource to modify",
        amount="Amount to add (can be negative)"
    )
    async def resources_add(self, interaction: discord.Interaction, user_id: str, resource_name: str, amount: int):
        if interaction.user.id != self.bot.owner_id:
            await interaction.response.send_message("Only the bot owner can use this command.", ephemeral=True)
            return
        game = game_manager.get_game(interaction.channel_id)
        if not game:
            await interaction.response.send_message('This command can only be used inside a battle thread.', ephemeral=True)
            return
        try:
            uid = int(user_id)
        except Exception:
            await interaction.response.send_message("Invalid user_id.", ephemeral=True)
            return
        
        # Use kwargs to modify any resource
        kwargs = {resource_name: amount}
        res = game.add_resources(uid, **kwargs)
        await interaction.response.send_message(res.get("message", "Done."), ephemeral=True)

    @app_commands.command(name="resources_add_unique", description="Admin: add a unique resource to a player")
    @app_commands.describe(
        user_id="Target user id",
        resource_name="Name of the unique resource",
        description="Description of the unique resource"
    )
    async def resources_add_unique(self, interaction: discord.Interaction, user_id: str, resource_name: str, description: str):
        if interaction.user.id != self.bot.owner_id:
            await interaction.response.send_message("Only the bot owner can use this command.", ephemeral=True)
            return
        game = game_manager.get_game(interaction.channel_id)
        if not game:
            await interaction.response.send_message('This command can only be used inside a battle thread.', ephemeral=True)
            return
        try:
            uid = int(user_id)
        except Exception:
            await interaction.response.send_message("Invalid user_id.", ephemeral=True)
            return
        
        res = game.add_unique_resource(uid, resource_name, description)
        await interaction.response.send_message(res.get("message", "Done."), ephemeral=True)

async def setup(bot):
    await bot.add_cog(Admin(bot))
