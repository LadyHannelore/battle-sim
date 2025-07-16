import discord
from discord.commands import SlashCommandGroup
from game.game_manager import game_manager
from utils.battlefield_renderer import BattlefieldRenderer
from typing import Optional


class Battle(discord.Cog):
    def __init__(self, bot):
        self.bot = bot

    battle = SlashCommandGroup("battle", "Initiate or manage a battle.")

    @battle.command(description="Start a battle between your armies.")
    async def start(
        self,
        ctx: discord.ApplicationContext,
        aggressor_army: int,
        defender_army: int
    ):
        game = game_manager.get_game(ctx.channel_id)
        if not game:
            return await ctx.respond(
                "This command can only be used inside a war ticket.",
                ephemeral=True
            )

        if ctx.author.id != game.aggressor['id']:
            return await ctx.respond(
                "Only the aggressor can start battles.",
                ephemeral=True
            )

        result = game.start_battle(aggressor_army, defender_army)
        if not result['success']:
            return await ctx.respond(result['message'], ephemeral=True)

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

        await ctx.respond(
            embed=embed,
            file=discord.File(image, filename="battlefield.png")
        )

    @battle.command(description="Place a unit on the battlefield.")
    async def place(
        self,
        ctx: discord.ApplicationContext,
        unit_type: str,
        x: int,
        y: int,
        orientation: str = "north"
    ):
        game = game_manager.get_game(ctx.channel_id)
        if not game or not game.battle:
            return await ctx.respond(
                "There is no battle in progress.",
                ephemeral=True
            )

        result = game.battle.place_unit(
            ctx.author.id, unit_type, x, y, orientation
        )
        if not result['success']:
            return await ctx.respond(result['message'], ephemeral=True)

        renderer = BattlefieldRenderer(game.battle.board)
        image = renderer.render_board()

        embed = discord.Embed(
            title="Unit Placed!",
            description=result['message']
        )
        embed.set_image(url="attachment://battlefield.png")

        await ctx.respond(
            embed=embed,
            file=discord.File(image, filename="battlefield.png")
        )

    @battle.command(description="Perform a battle action.")
    async def action(
        self,
        ctx: discord.ApplicationContext,
        action_type: str,
        from_x: Optional[int] = None,
        from_y: Optional[int] = None,
        to_x: Optional[int] = None,
        to_y: Optional[int] = None,
        orientation: Optional[str] = None
    ):
        game = game_manager.get_game(ctx.channel_id)
        if not game or not game.battle:
            return await ctx.respond(
                "There is no battle in progress.",
                ephemeral=True
            )

        result = None
        if action_type == 'move':
            result = game.battle.move_unit(
                ctx.author.id, from_x, from_y, to_x, to_y
            )
        elif action_type == 'turn':
            result = game.battle.turn_unit(
                ctx.author.id, from_x, from_y, orientation
            )
        elif action_type == 'end_turn':
            result = game.battle.end_turn(ctx.author.id)
        # ... other actions ...

        if not result or not result['success']:
            return await ctx.respond(
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
            game_manager.end_battle(ctx.channel_id)
        else:
            embed = discord.Embed(
                title="Action Taken!",
                description=result['message']
            )

        renderer = BattlefieldRenderer(game.battle.board)
        image = renderer.render_board()
        embed.set_image(url="attachment://battlefield.png")

        await ctx.respond(
            embed=embed,
            file=discord.File(image, filename="battlefield.png")
        )

    @battle.command(description="Forfeit the current battle.")
    async def forfeit(self, ctx: discord.ApplicationContext):
        game = game_manager.get_game(ctx.channel_id)
        if not game or not game.battle:
            return await ctx.respond(
                "There is no battle in progress.",
                ephemeral=True
            )

        result = game.battle.forfeit_battle(ctx.author.id)
        if not result['success']:
            return await ctx.respond(result['message'], ephemeral=True)

        game_manager.end_battle(ctx.channel_id)
        await ctx.respond(result['message'])


def setup(bot):
    bot.add_cog(Battle(bot))
