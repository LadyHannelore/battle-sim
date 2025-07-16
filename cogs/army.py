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
            await ctx.respond(
                'This command can only be used inside a battle thread.',
                ephemeral=True
            )
            return

        # In a real implementation, you would check and consume 1 labor
        # resource here.
        army = game.add_army(ctx.author.id)
        await ctx.respond(
            f"✅ **Army #{army['id']} created!** \n"
            f"Starting units: 5 infantry, 1 commander\n\n"
            f"💡 **Next steps:**\n"
            f"• Use `/army modify` to customize your army\n"
            f"• Use `/army start_battle` to fight with this army"
        )

    @army.command(description="View your current armies.")
    async def view(self, ctx: discord.ApplicationContext):
        game = game_manager.get_game(ctx.channel_id)
        if not game:
            await ctx.respond(
                'This command can only be used inside a battle thread.',
                ephemeral=True
            )
            return

        player_armies = game.armies.get(ctx.author.id, [])
        if not player_armies:
            await ctx.respond('You have no armies.', ephemeral=True)
            return

        embed = discord.Embed(
            title=f"{ctx.author.name}'s Armies",
            description=('🏹 **Ready for Battle!** Use `/battle start` '
                         'with these army IDs to begin combat.'),
            color=discord.Color.dark_red()
        )

        for army in player_armies:
            def unit_display_name(unit_type):
                # If enum, get value, else use as is
                return unit_type.value if hasattr(unit_type, 'value') else str(unit_type)
            units_string = ', '.join(
                f"{u['count']} {unit_display_name(u['type'])}" for u in army['units']
            )
            embed.add_field(
                name=f"Army #{army['id']} ⚔️",
                value=f"**Units:** {units_string}",
                inline=True
            )

        embed.add_field(
            name='Battle Instructions',
            value=('💡 Use `/battle start aggressor_army:[ID] '
                   'defender_army:[ID]` to fight!'),
            inline=False
        )

        await ctx.respond(embed=embed)

    @army.command(description="Purchase modifications for an army.")
    async def modify(
        self,
        ctx: discord.ApplicationContext,
        army_id: int,
        modification: str
    ):
        game = game_manager.get_game(ctx.channel_id)
        if not game:
            await ctx.respond(
                'This command can only be used inside a battle thread.',
                ephemeral=True
            )
            return


        from game.enums import UnitType
        mod_map = {
            "3 Shock Units (1 Bronze)": UnitType.SHOCK,
            "shock": UnitType.SHOCK,
            "3 Archer Units (1 Timber)": UnitType.ARCHER,
            "archer": UnitType.ARCHER,
            "4 Cavalry Units (1 Mount)": UnitType.CAVALRY,
            "cavalry": UnitType.CAVALRY,
            "2 Chariot Units (1 Mount)": UnitType.CHARIOT,
            "chariot": UnitType.CHARIOT
        }

        result = game.modify_army(
            ctx.author.id, army_id, mod_map[modification]
        )

        if result['success']:
            await ctx.respond(result['message'])
        else:
            await ctx.respond(result['message'], ephemeral=True)

    @army.command(description="Disband (delete) one of your armies.")
    async def disband(
        self,
        ctx: discord.ApplicationContext,
        army_id: int
    ):
        game = game_manager.get_game(ctx.channel_id)
        if not game:
            await ctx.respond(
                'This command can only be used inside a battle thread.',
                ephemeral=True
            )
            return

        result = game.disband_army(ctx.author.id, army_id)
        if result['success']:
            await ctx.respond(f"🗑️ Army #{army_id} has been disbanded.")
        else:
            await ctx.respond(result['message'], ephemeral=True)


def setup(bot):
    bot.add_cog(Army(bot))
