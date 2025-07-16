const { SlashCommandBuilder, ChannelType, EmbedBuilder } = require('discord.js');
const { gameManager } = require('../../game/gameManager');

function getWarDetails(casusBelli, details, aggressor, defender) {
    const embed = new EmbedBuilder()
        .setTitle(`War Declaration: ${aggressor.username} vs. ${defender.username}`)
        .setColor('#FF0000')
        .addFields({ name: 'Aggressor', value: aggressor.toString(), inline: true })
        .addFields({ name: 'Defender', value: defender.toString(), inline: true })
        .setTimestamp();

    switch (casusBelli) {
        case 'skirmish':
            embed
                .setTitle('⚔️ War Declaration: Skirmish ⚔️')
                .setDescription(`A border conflict has begun over the following tiles: **${details}**`)
                .addFields(
                    { name: 'Victory Requirement', value: `The aggressor must hold all declared tiles by the end of the 4th turn.` },
                    { name: 'Victory Condition', value: `The aggressor captures the declared tiles.` },
                    { name: 'Defeat Condition', value: `The defender may demand to keep tiles they successfully hold by the end of the 4th turn.` }
                );
            break;
        case 'conquest':
            embed
                .setTitle('🏰 War Declaration: Conquest 🏰')
                .setDescription(`A war of conquest has been declared for the settlement(s): **${details}**`)
                .addFields(
                    { name: 'Victory Requirement', value: `The aggressor must capture the declared settlement(s) within 6 turns.` },
                    { name: 'Victory Condition', value: `The aggressor captures the settlement(s) and 3 adjacent tiles per settlement.` },
                    { name: 'Defeat Condition', value: `The defender captures the same number of the aggressor's settlements if they can hold them by the end of the 6th turn.` }
                );
            break;
        case 'raid':
            embed
                .setTitle('💰 War Declaration: Raid 💰')
                .setDescription(`A raid has been initiated to acquire loot. Target: **${details}**`)
                .addFields(
                    { name: 'Victory Requirement', value: `The aggressor must capture the specified loot within 4 turns.` },
                    { name: 'Victory Condition', value: `The aggressor gains the specified loot.` },
                    { name: 'Defeat Condition', value: `The defender gains any loot they manage to capture from the aggressor by the end of the 4th turn.` }
                );
            break;
        case 'subjugation':
            embed
                .setTitle('👑 War Declaration: Subjugation 👑')
                .setDescription(`A war of subjugation has been declared! Goal: **${details}**`)
                .addFields(
                    { name: 'Victory Requirement', value: `The aggressor must capture the opponent's capital within 6 turns.` },
                    { name: 'Victory Condition', value: `The opponent is subjugated to follow the declared condition.` },
                    { name: 'Defeat Condition', value: `The defender may demand reparations or even subjugate the aggressor if they capture the aggressor's capital.` }
                );
            break;
    }
    return embed;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('war')
        .setDescription('Declare war on another nation.')
        .addStringOption(option =>
            option.setName('casus_belli')
                .setDescription('The reason for the war.')
                .setRequired(true)
                .addChoices(
                    { name: 'Skirmish', value: 'skirmish' },
                    { name: 'Conquest', value: 'conquest' },
                    { name: 'Raid', value: 'raid' },
                    { name: 'Subjugation', value: 'subjugation' },
                ))
        .addUserOption(option =>
            option.setName('opponent')
                .setDescription('The user you are declaring war on.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('details')
                .setDescription('The specific tiles, settlements, or loot to target.')
                .setRequired(true)),
    async execute(interaction) {
        const casusBelli = interaction.options.getString('casus_belli');
        const opponent = interaction.options.getUser('opponent');
        const details = interaction.options.getString('details');
        const aggressor = interaction.user;

        if (opponent.bot) {
            return interaction.reply({ content: "You cannot declare war on a bot.", ephemeral: true });
        }
        if (opponent.id === aggressor.id) {
            return interaction.reply({ content: "You cannot declare war on yourself.", ephemeral: true });
        }

        try {
            await interaction.reply({ content: `Creating a war ticket for your conflict with ${opponent.username}...`, ephemeral: true });

            const thread = await interaction.channel.threads.create({
                name: `War: ${aggressor.username} vs ${opponent.username}`,
                type: ChannelType.PrivateThread,
                invitable: false, // Only the bot can add users
            });

            await thread.members.add(aggressor.id);
            await thread.members.add(opponent.id);

            // Create a new game state for this war
            gameManager.createGame(thread.id, aggressor, opponent);

            const warEmbed = getWarDetails(casusBelli, details, aggressor, opponent);

            await thread.send({
                content: `The war has begun! ${aggressor} has declared war on ${opponent}.`,
                embeds: [warEmbed]
            });

            await interaction.followUp({ content: `Your war ticket has been created: ${thread}`, ephemeral: true });

        } catch (error) {
            console.error("Failed to create war thread:", error);
            await interaction.followUp({ content: 'There was an error creating the war ticket. Please ensure I have permissions to create private threads.', ephemeral: true });
        }
    },
};
