const { SlashCommandBuilder } = require('discord.js');
const { gameManager } = require('../game/gameManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('maneuver')
        .setDescription('Army maneuvering is no longer required. Use /battle start to begin battles directly.'),

    async execute(interaction) {
        await interaction.reply({ 
            content: '⚠️ **Army maneuvering has been simplified!**\n\nYou no longer need to place or move armies on the map.\n\n**New workflow:**\n1. Use `/army create` to create armies\n2. Use `/army modify` to customize armies\n3. Use `/battle start` to begin battles directly\n\nThe battle system now works directly with your created armies!',
            ephemeral: true 
        });
    },
};
