const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('treaty')
        .setDescription('Create or sign a treaty.'),
    async execute(interaction) {
        // Logic for treaties will go here.
        await interaction.reply('Treaty commands are under construction.');
    },
};
