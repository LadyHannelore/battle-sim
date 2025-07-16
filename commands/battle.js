const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { gameManager } = require('../game/gameManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('battle')
        .setDescription('Initiate or manage a battle.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('start')
                .setDescription('Start a battle on a tile where opposing armies are present.')
                .addIntegerOption(option => option.setName('x').setDescription('The x-coordinate of the battle tile.').setRequired(true))
                .addIntegerOption(option => option.setName('y').setDescription('The y-coordinate of the battle tile.').setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('place')
                .setDescription('Place a unit on the battlefield during the placement phase.')
                .addStringOption(option =>
                    option.setName('unit_type')
                        .setDescription('The type of unit to place.')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Infantry', value: 'infantry' },
                            { name: 'Commander', value: 'commander' },
                            { name: 'Shock', value: 'shock' },
                            { name: 'Archer', value: 'archer' },
                            { name: 'Cavalry', value: 'cavalry' },
                            { name: 'Chariot', value: 'chariot' }
                        ))
                .addIntegerOption(option => option.setName('x').setDescription('The x-coordinate.').setRequired(true))
                .addIntegerOption(option => option.setName('y').setDescription('The y-coordinate.').setRequired(true))
                .addStringOption(option =>
                    option.setName('orientation')
                        .setDescription('The direction the unit will face.')
                        .setRequired(false)
                        .addChoices(
                            { name: 'North', value: 'north' },
                            { name: 'East', value: 'east' },
                            { name: 'South', value: 'south' },
                            { name: 'West', value: 'west' }
                        )))
        .addSubcommand(subcommand =>
            subcommand
                .setName('action')
                .setDescription('Perform an action with a unit during the battle phase.')
                .addStringOption(option =>
                    option.setName('type')
                        .setDescription('The type of action to perform.')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Move', value: 'move' },
                            { name: 'Turn', value: 'turn' },
                            { name: 'End Turn', value: 'end_turn' },
                            { name: 'Archer Fire', value: 'archer_fire' }
                        ))
                .addIntegerOption(option => option.setName('from_x').setDescription('The starting x-coordinate of your unit.'))
                .addIntegerOption(option => option.setName('from_y').setDescription('The starting y-coordinate of your unit.'))
                .addIntegerOption(option => option.setName('to_x').setDescription('The destination x-coordinate (for moving).'))
                .addIntegerOption(option => option.setName('to_y').setDescription('The destination y-coordinate (for moving).'))
                .addStringOption(option =>
                    option.setName('orientation')
                        .setDescription('The new orientation (for turning).')
                        .addChoices(
                            { name: 'North', value: 'north' },
                            { name: 'East', value: 'east' },
                            { name: 'South', value: 'south' },
                            { name: 'West', value: 'west' }
                        ))),

    async execute(interaction) {
        const game = gameManager.getGame(interaction.channelId);
        if (!game) {
            return interaction.reply({ content: 'This command can only be used inside a war ticket.', ephemeral: true });
        }

        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'start') {
            const x = interaction.options.getInteger('x');
            const y = interaction.options.getInteger('y');

            const result = game.startBattle(x, y);

            if (!result.success) {
                return interaction.reply({ content: result.message, ephemeral: true });
            }

            const battle = result.battle;
            const boardString = battle.renderBoard();

            const embed = new EmbedBuilder()
                .setTitle('Battle Started!')
                .setDescription(`A battle has begun at tile (${x}, ${y}).\n\n**Placement Phase**\nIt is now ${game.aggressor.username}'s turn to place their units.`)
                .addFields({ name: 'Battlefield', value: '`' + boardString + '`' });

            await interaction.reply({ embeds: [embed] });
        }
        else if (subcommand === 'place') {
            if (!game.battle) {
                return interaction.reply({ content: 'There is no battle in progress.', ephemeral: true });
            }

            const unitType = interaction.options.getString('unit_type');
            const x = interaction.options.getInteger('x');
            const y = interaction.options.getInteger('y');
            const orientation = interaction.options.getString('orientation') || 'north';

            const result = game.battle.placeUnit(interaction.user.id, unitType, x, y, orientation);

            if (!result.success) {
                return interaction.reply({ content: result.message, ephemeral: true });
            }

            const boardString = game.battle.renderBoard();
            const embed = new EmbedBuilder()
                .setTitle('Unit Placed!')
                .setDescription(result.message)
                .addFields({ name: 'Battlefield', value: '`' + boardString + '`' });

            await interaction.reply({ embeds: [embed] });
        }
        else if (subcommand === 'action') {
            if (!game.battle) {
                return interaction.reply({ content: 'There is no battle in progress.', ephemeral: true });
            }

            const actionType = interaction.options.getString('type');
            let result;

            if (actionType === 'move') {
                const fromX = interaction.options.getInteger('from_x');
                const fromY = interaction.options.getInteger('from_y');
                const toX = interaction.options.getInteger('to_x');
                const toY = interaction.options.getInteger('to_y');
                result = game.battle.moveUnit(interaction.user.id, fromX, fromY, toX, toY);
            } else if (actionType === 'turn') {
                const fromX = interaction.options.getInteger('from_x');
                const fromY = interaction.options.getInteger('from_y');
                const orientation = interaction.options.getString('orientation');
                result = game.battle.turnUnit(interaction.user.id, fromX, fromY, orientation);
            } else if (actionType === 'end_turn') {
                result = game.battle.endTurn(interaction.user.id);
            } else if (actionType === 'archer_fire') {
                const fromX = interaction.options.getInteger('from_x');
                const fromY = interaction.options.getInteger('from_y');
                const toX = interaction.options.getInteger('to_x');
                const toY = interaction.options.getInteger('to_y');
                result = game.battle.archerFire(interaction.user.id, fromX, fromY, toX, toY);
            }

            if (!result || !result.success) {
                return interaction.reply({ content: result ? result.message : "Invalid action.", ephemeral: true });
            }

            const boardString = game.battle.renderBoard();
            const embed = new EmbedBuilder()
                .setTitle('Action Taken!')
                .setDescription(result.message)
                .addFields({ name: 'Battlefield', value: '`' + boardString + '`' });

            await interaction.reply({ embeds: [embed] });
        }
    },
};
