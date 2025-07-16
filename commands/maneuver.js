const { SlashCommandBuilder } = require('discord.js');
const { gameManager } = require('../game/gameManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('maneuver')
        .setDescription('Maneuver your armies on the map.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('place')
                .setDescription('Place an army on the map near a settlement.')
                .addIntegerOption(option => option.setName('army_id').setDescription('The ID of the army to place.').setRequired(true))
                .addIntegerOption(option => option.setName('x').setDescription('The x-coordinate.').setRequired(true))
                .addIntegerOption(option => option.setName('y').setDescription('The y-coordinate.').setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('move')
                .setDescription('Move an army to a new tile.')
                .addIntegerOption(option => option.setName('army_id').setDescription('The ID of the army to move.').setRequired(true))
                .addIntegerOption(option => option.setName('x').setDescription('The new x-coordinate.').setRequired(true))
                .addIntegerOption(option => option.setName('y').setDescription('The new y-coordinate.').setRequired(true))),

    async execute(interaction) {
        const game = gameManager.getGame(interaction.channelId);
        if (!game) {
            return interaction.reply({ content: 'This command can only be used inside a war ticket.', ephemeral: true });
        }

        const subcommand = interaction.options.getSubcommand();
        const armyId = interaction.options.getInteger('army_id');
        const x = interaction.options.getInteger('x');
        const y = interaction.options.getInteger('y');

        let result;
        if (subcommand === 'place') {
            result = game.placeArmy(interaction.user.id, armyId, x, y);
        } else if (subcommand === 'move') {
            result = game.moveArmy(interaction.user.id, armyId, x, y);
        }

        if (result.success) {
            await interaction.reply(result.message);
        } else {
            await interaction.reply({ content: result.message, ephemeral: true });
        }
    },
};
