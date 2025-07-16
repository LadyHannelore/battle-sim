import discord
from discord.commands import SlashCommandGroup
from game.game_manager import game_manager

class Army(discord.Cog):
    def __init__(self, bot):
        self.bot = bot

    army = SlashCommandGroup("army", "Manage your armies.")

    @army.command(description="Create a new army for 1 labor.")
    async def create(self, ctx: discord.ApplicationContext):
        game = game_manager.get_game(ctx.channel_id)
        if not game:
            await ctx.respond('This command can only be used inside a war ticket.', ephemeral=True)
            return

        # In a real implementation, you would check and consume 1 labor resource here.
        army = game.add_army(ctx.author.id)
        await ctx.respond(f"✅ **Army #{army['id']} created!** \nStarting units: 5 infantry, 1 commander\n\n💡 **Next steps:**\n• Use `/army modify` to customize your army\n• Use `/army start_battle` to fight with this army")

    @army.command(description="View your current armies.")
    async def view(self, ctx: discord.ApplicationContext):
        game = game_manager.get_game(ctx.channel_id)
        if not game:
            await ctx.respond('This command can only be used inside a war ticket.', ephemeral=True)
            return

        player_armies = game.armies.get(ctx.author.id, [])
        if not player_armies:
            await ctx.respond('You have no armies.', ephemeral=True)
            return

        embed = discord.Embed(
            title=f"{ctx.author.name}'s Armies",
            description='🏹 **Ready for Battle!** Use `/battle start` with these army IDs to begin combat.',
            color=discord.Color.dark_red()
        )

        for army in player_armies:
            units_string = ', '.join(f"{u['count']} {u['type']}" for u in army['units'])
            embed.add_field(
                name=f"Army #{army['id']} ⚔️",
                value=f"**Units:** {units_string}",
                inline=True
            )

        embed.add_field(
            name='Battle Instructions',
            value='💡 Use `/battle start aggressor_army:[ID] defender_army:[ID]` to fight!',
            inline=False
        )

        await ctx.respond(embed=embed)

    @army.command(description="Purchase modifications for an army.")
    async def modify(self, ctx: discord.ApplicationContext,
                     army_id: discord.Option(int, "The ID of the army to modify.", required=True),
                     modification: discord.Option(str, "The unit modification to purchase.", required=True, choices=[
                         '3 Shock Units (1 Bronze)', '3 Archer Units (1 Timber)', '4 Cavalry Units (1 Mount)', '2 Chariot Units (1 Mount)'
                     ])):
        game = game_manager.get_game(ctx.channel_id)
        if not game:
            await ctx.respond('This command can only be used inside a war ticket.', ephemeral=True)
            return
        
        mod_map = {
            '3 Shock Units (1 Bronze)': 'shock',
            '3 Archer Units (1 Timber)': 'archer',
            '4 Cavalry Units (1 Mount)': 'cavalry',
            '2 Chariot Units (1 Mount)': 'chariot'
        }
        
        result = game.modify_army(ctx.author.id, army_id, mod_map[modification])

        if result['success']:
            await ctx.respond(result['message'])
        else:
            await ctx.respond(result['message'], ephemeral=True)

    @army.command(description="Disband (delete) one of your armies.")
    async def disband(self, ctx: discord.ApplicationContext,
                      army_id: discord.Option(int, "The ID of the army to disband.", required=True)):
        game = game_manager.get_game(ctx.channel_id)
        if not game:
            await ctx.respond('This command can only be used inside a war ticket.', ephemeral=True)
            return
            
        result = game.disband_army(ctx.author.id, army_id)
        if result['success']:
            await ctx.respond(f"🗑️ Army #{army_id} has been disbanded.")
        else:
            await ctx.respond(result['message'], ephemeral=True)

def setup(bot):
    bot.add_cog(Army(bot))
