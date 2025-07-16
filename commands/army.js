const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { gameManager } = require('../game/gameManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('army')
        .setDescription('Manage your armies.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('Create a new army for 1 labor.'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('view')
                .setDescription('View your current armies.'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('modify')
                .setDescription('Purchase modifications for an army.')
                .addIntegerOption(option =>
                    option.setName('army_id')
                        .setDescription('The ID of the army to modify.')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('modification')
                        .setDescription('The unit modification to purchase.')
                        .setRequired(true)
                        .addChoices(
                            { name: '3 Shock Units (1 Bronze)', value: 'shock' },
                            { name: '3 Archer Units (1 Timber)', value: 'archer' },
                            { name: '4 Cavalry Units (1 Mount)', value: 'cavalry' },
                            { name: '2 Chariot Units (1 Mount)', value: 'chariot' }
                        ))),
    async execute(interaction) {
        const game = gameManager.getGame(interaction.channelId);

        if (!game) {
            return interaction.reply({ content: 'This command can only be used inside a war ticket.', ephemeral: true });
        }

        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'create') {
            // In a real implementation, you would check and consume 1 labor resource here.
            const army = game.addArmy(interaction.user.id);
            await interaction.reply(`You have created Army #${army.id}. It starts with 5 infantry and 1 commander.`);
        } else if (subcommand === 'view') {
            const playerArmies = game.armies[interaction.user.id];
            if (!playerArmies || playerArmies.length === 0) {
                return interaction.reply({ content: 'You have no armies.', ephemeral: true });
            }

            const embed = new EmbedBuilder()
                .setTitle(`${interaction.user.username}'s Armies`)
                .setColor('#A52A2A');

            playerArmies.forEach(army => {
                const unitsString = army.units.map(u => `${u.count} ${u.type}`).join(', ');
                embed.addFields({ name: `Army #${army.id}`, value: `Units: ${unitsString}` });
            });

            await interaction.reply({ embeds: [embed] });
        }
        else if (subcommand === 'modify') {
            const armyId = interaction.options.getInteger('army_id');
            const modification = interaction.options.getString('modification');

            const result = game.modifyArmy(interaction.user.id, armyId, modification);

            if (result.success) {
                await interaction.reply(result.message);
            } else {
                await interaction.reply({ content: result.message, ephemeral: true });
            }
        }
    },
};
