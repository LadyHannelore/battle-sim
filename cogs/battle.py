import discord
from discord.ext import commands
from discord import app_commands
from game.game_manager import game_manager
from utils.battlefield_renderer import BattlefieldRenderer
from typing import Optional


class Battle(commands.Cog):
    def __init__(self, bot):
        self.bot = bot

    @app_commands.command(name="battle_create_thread", description="Create a new battle thread.")
    @app_commands.describe(
        opponent="The user you want to battle against",
        thread_name="Optional custom name for the battle thread"
    )
    async def battle_create_thread(
        self,
        interaction: discord.Interaction,
        opponent: discord.Member,
        thread_name: Optional[str] = None
    ):
        if interaction.user.id == opponent.id:
            return await interaction.response.send_message(
                "You cannot start a battle with yourself!",
                ephemeral=True
            )

        if not thread_name:
            thread_name = (
                f"Battle: {interaction.user.display_name} vs "
                f"{opponent.display_name}"
            )

        # Create the thread
        thread = await interaction.channel.create_thread(  # type: ignore[reportCallIssue]
            name=thread_name,
            type=discord.ChannelType.public_thread  # type: ignore[reportCallIssue]
        )

        # Add both players to the thread
        await thread.add_user(interaction.user)
        await thread.add_user(opponent)

        # Create the game instance
        aggressor = {'id': interaction.user.id, 'name': interaction.user.display_name}
        defender = {'id': opponent.id, 'name': opponent.display_name}
        game = game_manager.create_game(thread.id, aggressor, defender)

        if not game:
            await thread.delete()
            return await interaction.response.send_message(
                "Failed to create battle thread. A game might already exist.",
                ephemeral=True
            )

        # Create initial armies for both players
        game.add_army(interaction.user.id)
        game.add_army(opponent.id)

        embed = discord.Embed(
            title="⚔️ Battle Thread Created!",
            description=(
                f"**{interaction.user.display_name}** challenges "
                f"**{opponent.display_name}** to battle!\n\n"
                f"**Initial Setup:**\n"
                f"• Both players have been given Army #1\n"
                f"• Each army starts with: 5 infantry, 1 commander\n\n"
                f"**Next Steps:**\n"
                f"• Use `/army_view` to see your armies\n"
                f"• Use `/army_modify` to customize your armies\n"
                f"• Use `/battle_start` to begin the battle\n"
                f"• INFANTRY = 5 Infantry Units (Starter)"
                f"• SHOCK = 3 Shock Units (1 Bronze)"
                f"• ARCHER = 3 Archer Units (1 Timber)"
                f"• COMMANDER = 1 Commander (Starter)"
                f"• CAVALRY = 4 Cavalry Units (1 Mount)"
                f"• CHARIOT = 2 Chariot Units (1 Mount)"
            ),
            color=discord.Color.red()
        )

        await interaction.response.send_message(
            f"Battle thread created: {thread.mention}",
            ephemeral=True
        )
        await thread.send(embed=embed)

    @app_commands.command(name="battle_start", description="Start a battle between your armies.")
    @app_commands.describe(
        aggressor_army="ID of the aggressor's army",
        defender_army="ID of the defender's army"
    )
    async def battle_start(
        self,
        interaction: discord.Interaction,
        aggressor_army: int,
        defender_army: int
    ):
        game = game_manager.get_game(interaction.channel_id)
        if not game:
            return await interaction.response.send_message(
                "This command can only be used inside a battle thread.",
                ephemeral=True
            )

        if interaction.user.id != game.aggressor['id']:
            return await interaction.response.send_message(
                "Only the aggressor can start battles.",
                ephemeral=True
            )

        result = game.start_battle(aggressor_army, defender_army)
        if not result['success']:
            return await interaction.response.send_message(result['message'], ephemeral=True)

        renderer = BattlefieldRenderer(game.battle.board)
        image = renderer.render_board()

        embed = discord.Embed(
            title="Battle Started!",
            description=(
                f"A battle has begun!\n\n**Placement Phase**\n"
                f"It is now {game.aggressor['name']}'s turn to place "
                f"their units."
            )
        )
        embed.set_image(url="attachment://battlefield.png")

        await interaction.response.send_message(
            embed=embed,
            file=discord.File(image, filename="battlefield.png")
        )

    @app_commands.command(name="battle_place", description="Place a unit on the battlefield.")
    @app_commands.describe(
        unit_type="Type of unit to place",
        x="X coordinate (0-8)",
        y="Y coordinate (0-8)",
        orientation="Direction the unit should face"
    )
    @app_commands.choices(unit_type=[
        app_commands.Choice(name="Infantry", value="infantry"),
        app_commands.Choice(name="Commander", value="commander"),
        app_commands.Choice(name="Shock", value="shock"),
        app_commands.Choice(name="Archer", value="archer"),
        app_commands.Choice(name="Cavalry", value="cavalry"),
        app_commands.Choice(name="Chariot", value="chariot")
    ])
    @app_commands.choices(orientation=[
        app_commands.Choice(name="North", value="north"),
        app_commands.Choice(name="South", value="south"),
        app_commands.Choice(name="East", value="east"),
        app_commands.Choice(name="West", value="west")
    ])
    async def battle_place(
        self,
        interaction: discord.Interaction,
        unit_type: str,
        x: int,
        y: int,
        orientation: str = "north"
    ):
        game = game_manager.get_game(interaction.channel_id)
        if not game or not game.battle:
            return await interaction.response.send_message(
                "There is no battle in progress.",
                ephemeral=True
            )

        result = game.battle.place_unit(
            interaction.user.id, unit_type, x, y, orientation
        )
        if not result['success']:
            return await interaction.response.send_message(result['message'], ephemeral=True)

        renderer = BattlefieldRenderer(game.battle.board)
        image = renderer.render_board()

        embed = discord.Embed(
            title="Unit Placed!",
            description=result['message']
        )
        embed.set_image(url="attachment://battlefield.png")

        await interaction.response.send_message(
            embed=embed,
            file=discord.File(image, filename="battlefield.png")
        )

    @app_commands.command(name="battle_action", description="Perform a battle action.")
    @app_commands.describe(
        action_type="Type of action to perform",
        from_x="Starting X coordinate",
        from_y="Starting Y coordinate",
        to_x="Target X coordinate",
        to_y="Target Y coordinate",
        orientation="Direction to face"
    )
    @app_commands.choices(action_type=[
        app_commands.Choice(name="Move", value="move"),
        app_commands.Choice(name="Turn", value="turn"),
        app_commands.Choice(name="End Turn", value="end_turn")
    ])
    async def battle_action(
        self,
        interaction: discord.Interaction,
        action_type: str,
        from_x: Optional[int] = None,
        from_y: Optional[int] = None,
        to_x: Optional[int] = None,
        to_y: Optional[int] = None,
        orientation: Optional[str] = None
    ):
        game = game_manager.get_game(interaction.channel_id)
        if not game or not game.battle:
            return await interaction.response.send_message(
                "There is no battle in progress.",
                ephemeral=True
            )

        result = None
        if action_type == 'move':
            result = game.battle.move_unit(
                interaction.user.id, from_x, from_y, to_x, to_y
            )
        elif action_type == 'turn':
            result = game.battle.turn_unit(
                interaction.user.id, from_x, from_y, orientation
            )
        elif action_type == 'end_turn':
            result = game.battle.end_turn(interaction.user.id)
        # ... other actions ...

        if not result or not result['success']:
            return await interaction.response.send_message(
                result['message'] if result else "Invalid action.",
                ephemeral=True
            )

        if result.get('battle_ended'):
            winner_user = (
                game.aggressor if result['winner'] == game.aggressor['id']
                else game.defender
            )
            embed = discord.Embed(
                title='🏆 Battle Concluded!',
                description=(
                    f"**{winner_user['name']} has won the battle!**\n\n"
                    f"{result['message']}"
                ),
                color=(
                    discord.Color.red()
                    if result['winner'] == game.aggressor['id']
                    else discord.Color.blue()
                )
            )
            game_manager.end_battle(interaction.channel_id)
        else:
            embed = discord.Embed(
                title="Action Taken!",
                description=result['message']
            )

        renderer = BattlefieldRenderer(game.battle.board)
        image = renderer.render_board()
        embed.set_image(url="attachment://battlefield.png")

        await interaction.response.send_message(
            embed=embed,
            file=discord.File(image, filename="battlefield.png")
        )

    @app_commands.command(name="battle_forfeit", description="Forfeit the current battle.")
    async def battle_forfeit(self, interaction: discord.Interaction):
        game = game_manager.get_game(interaction.channel_id)
        if not game or not game.battle:
            return await interaction.response.send_message(
                "There is no battle in progress.",
                ephemeral=True
            )

        result = game.battle.forfeit_battle(interaction.user.id)
        if not result['success']:
            return await interaction.response.send_message(result['message'], ephemeral=True)

        game_manager.end_battle(interaction.channel_id)
        # lock the thread to prevent further messages
        try:
            await interaction.channel.edit(locked=True)  # type: ignore
        except Exception:
            pass
        await interaction.response.send_message(result['message'])


async def setup(bot):
    await bot.add_cog(Battle(bot))
