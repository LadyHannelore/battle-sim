const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { gameManager } = require('../game/gameManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('battle')
        .setDescription('Initiate or manage a battle.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('start')
                .setDescription('Start a battle between your armies.')
                .addIntegerOption(option => option.setName('aggressor_army').setDescription('The aggressor army ID to use in battle.').setRequired(true))
                .addIntegerOption(option => option.setName('defender_army').setDescription('The defender army ID to use in battle.').setRequired(true)))
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
                            { name: 'Archer Fire', value: 'archer_fire' },
                            { name: 'Chariot Charge', value: 'chariot_charge' },
                            { name: 'Start Rally', value: 'start_rally' },
                            { name: 'Rally Unit', value: 'rally_unit' },
                            { name: 'End Rally Turn', value: 'end_rally_turn' },
                            { name: 'End Rally Phase', value: 'end_rally_phase' }
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
                        )))
        .addSubcommand(subcommand =>
            subcommand
                .setName('status')
                .setDescription('Check the current battle status and remaining units.')),

    async execute(interaction) {
        const game = gameManager.getGame(interaction.channelId);
        if (!game) {
            return interaction.reply({ content: 'This command can only be used inside a war ticket.', ephemeral: true });
        }

        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'start') {
            const aggressorArmyId = interaction.options.getInteger('aggressor_army');
            const defenderArmyId = interaction.options.getInteger('defender_army');

            // Only allow the aggressor to start battles
            if (interaction.user.id !== game.aggressor.id) {
                return interaction.reply({ content: 'Only the aggressor can start battles.', ephemeral: true });
            }

            const result = game.startBattle(aggressorArmyId, defenderArmyId);

            if (!result.success) {
                return interaction.reply({ content: result.message, ephemeral: true });
            }

            const battle = result.battle;
            const boardString = battle.renderBoard();

            const embed = new EmbedBuilder()
                .setTitle('Battle Started!')
                .setDescription(`A battle has begun between the armies!\n\n**Placement Phase**\nIt is now ${game.aggressor.username}'s turn to place their units.`)
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
            } else if (actionType === 'chariot_charge') {
                const fromX = interaction.options.getInteger('from_x');
                const fromY = interaction.options.getInteger('from_y');
                const toX = interaction.options.getInteger('to_x');
                const toY = interaction.options.getInteger('to_y');
                result = game.battle.chariotCharge(interaction.user.id, fromX, fromY, toX, toY);
            } else if (actionType === 'start_rally') {
                result = game.battle.startRallyPhase();
            } else if (actionType === 'rally_unit') {
                const x = interaction.options.getInteger('from_x');
                const y = interaction.options.getInteger('from_y');
                result = game.battle.rallyUnit(interaction.user.id, x, y);
            } else if (actionType === 'end_rally_turn') {
                result = game.battle.endRallyTurn(interaction.user.id);
            } else if (actionType === 'end_rally_phase') {
                result = game.battle.endRallyPhase(interaction.user.id);
            }

            if (!result || !result.success) {
                return interaction.reply({ content: result ? result.message : "Invalid action.", ephemeral: true });
            }

            // Check if the battle ended
            if (result.battleEnded) {
                const winnerUser = result.winner === game.aggressor.id ? game.aggressor : game.defender;
                const loserUser = result.winner === game.aggressor.id ? game.defender : game.aggressor;
                
                const embed = new EmbedBuilder()
                    .setTitle('🏆 Battle Concluded!')
                    .setDescription(`**${winnerUser.username} has won the battle!**\n\n${result.message}`)
                    .setColor(result.winner === game.aggressor.id ? 0xFF0000 : 0x0000FF)
                    .addFields({ name: 'Final Battlefield', value: '`' + game.battle.renderBoard() + '`' });

                // End the battle and update game state
                gameManager.endBattle(interaction.channelId);
                
                await interaction.reply({ embeds: [embed] });
                return;
            }

            const boardString = game.battle.renderBoard();
            const embed = new EmbedBuilder()
                .setTitle('Action Taken!')
                .setDescription(result.message)
                .addFields({ name: 'Battlefield', value: '`' + boardString + '`' });

            await interaction.reply({ embeds: [embed] });
        }
        else if (subcommand === 'status') {
            if (!game.battle) {
                return interaction.reply({ content: 'There is no battle in progress.', ephemeral: true });
            }

            const status = game.battle.getBattleStatus();
            const boardString = game.battle.renderBoard();
            const currentPlayerName = status.currentPlayer === game.aggressor.id ? game.aggressor.username : game.defender.username;
            
            const aggressorUnitsText = Object.entries(status.aggressorUnits)
                .map(([type, count]) => `${type}: ${count}`)
                .join(', ') || 'None';
            const defenderUnitsText = Object.entries(status.defenderUnits)
                .map(([type, count]) => `${type}: ${count}`)
                .join(', ') || 'None';

            const embed = new EmbedBuilder()
                .setTitle('⚔️ Battle Status')
                .setDescription(`**Phase:** ${status.phase}\n**Current Turn:** ${currentPlayerName}`)
                .addFields(
                    { name: `${game.aggressor.username}'s Units (${status.totalAggressorUnits} total)`, value: aggressorUnitsText, inline: true },
                    { name: `${game.defender.username}'s Units (${status.totalDefenderUnits} total)`, value: defenderUnitsText, inline: true },
                    { name: 'Battlefield', value: '`' + boardString + '`' }
                );

            await interaction.reply({ embeds: [embed] });
        }
    },
};
