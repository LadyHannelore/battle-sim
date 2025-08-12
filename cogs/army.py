import discord
from discord.ext import commands
from discord import app_commands
from game.game_manager import game_manager


class Army(commands.Cog):
    def __init__(self, bot):
        self.bot = bot

    @app_commands.command(name="army_create", description="Create a new army for 1 labor.")
    async def army_create(self, interaction: discord.Interaction):
        game = game_manager.get_game(interaction.channel_id)
        if not game:
            await interaction.response.send_message(
                'This command can only be used inside a battle thread.',
                ephemeral=True
            )
            return

        # In a real implementation, you would check and consume 1 labor
        # resource here.
        army = game.add_army(interaction.user.id)
        await interaction.response.send_message(
            f"✅ **Army #{army['id']} created!** \n"
            f"Starting units: 5 infantry, 1 commander\n\n"
            f"💡 **Next steps:**\n"
            f"• Use `/army_modify` to customize your army\n"
            f"• Use `/battle_start` to fight with this army"
        )

    @app_commands.command(name="army_view", description="View your current armies.")
    async def army_view(self, interaction: discord.Interaction):
        game = game_manager.get_game(interaction.channel_id)
        if not game:
            await interaction.response.send_message(
                'This command can only be used inside a battle thread.',
                ephemeral=True
            )
            return

        player_armies = game.armies.get(interaction.user.id, [])
        if not player_armies:
            await interaction.response.send_message('You have no armies.', ephemeral=True)
            return

        embed = discord.Embed(
            title=f"{interaction.user.name}'s Armies",
            description=('🏹 **Ready for Battle!** Use `/battle_start` '
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
            value=('💡 Use `/battle_start aggressor_army:[ID] '
                   'defender_army:[ID]` to fight!'),
            inline=False
        )

        await interaction.response.send_message(embed=embed)

    @app_commands.command(name="army_modify", description="Purchase modifications for an army.")
    @app_commands.describe(
        army_id="The ID of the army to modify",
    modification="The type of modification to purchase",
    quantity="How many of this modification to purchase (default 1)"
    )
    @app_commands.choices(modification=[
        app_commands.Choice(name="3 Shock Units (1 Bronze)", value="shock"),
        app_commands.Choice(name="3 Archer Units (1 Timber)", value="archer"),
        app_commands.Choice(name="4 Cavalry Units (1 Mount)", value="cavalry"),
        app_commands.Choice(name="2 Chariot Units (1 Mount)", value="chariot")
    ])
    async def army_modify(
        self,
        interaction: discord.Interaction,
        army_id: int,
    modification: str,
    quantity: int = 1
    ):
        game = game_manager.get_game(interaction.channel_id)
        if not game:
            await interaction.response.send_message(
                'This command can only be used inside a battle thread.',
                ephemeral=True
            )
            return

        result = game.modify_army(
            interaction.user.id, army_id, modification, quantity
        )

        if result['success']:
            await interaction.response.send_message(result['message'])
        else:
            await interaction.response.send_message(result['message'], ephemeral=True)

    @app_commands.command(name="army_disband", description="Disband (delete) one of your armies.")
    @app_commands.describe(army_id="The ID of the army to disband")
    async def army_disband(
        self,
        interaction: discord.Interaction,
        army_id: int
    ):
        game = game_manager.get_game(interaction.channel_id)
        if not game:
            await interaction.response.send_message(
                'This command can only be used inside a battle thread.',
                ephemeral=True
            )
            return

        result = game.disband_army(interaction.user.id, army_id)
        if result['success']:
            await interaction.response.send_message(f"🗑️ Army #{army_id} has been disbanded.")
        else:
            await interaction.response.send_message(result['message'], ephemeral=True)

async def setup(bot):
    await bot.add_cog(Army(bot))
