const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { gameManager } = require('../game/gameManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('treaty')
        .setDescription('Negotiate peace treaties and end wars.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('propose')
                .setDescription('Propose a peace treaty to end the war.')
                .addStringOption(option =>
                    option.setName('terms')
                        .setDescription('The terms of the peace treaty.')
                        .setRequired(true)
                        .addChoices(
                            { name: 'White Peace (Status Quo)', value: 'white_peace' },
                            { name: 'Tribute (Loser pays resources)', value: 'tribute' },
                            { name: 'Surrender (Winner takes all)', value: 'surrender' },
                            { name: 'Ceasefire (Temporary halt)', value: 'ceasefire' }
                        )))
        .addSubcommand(subcommand =>
            subcommand
                .setName('accept')
                .setDescription('Accept a proposed peace treaty.'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('reject')
                .setDescription('Reject a proposed peace treaty.'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('status')
                .setDescription('Check the current treaty status.')),

    async execute(interaction) {
        const game = gameManager.getGame(interaction.channelId);
        if (!game) {
            return interaction.reply({ content: 'This command can only be used inside a war ticket.', ephemeral: true });
        }

        const subcommand = interaction.options.getSubcommand();
        const userId = interaction.user.id;
        const isAggressor = userId === game.aggressor.id;
        const isDefender = userId === game.defender.id;

        if (!isAggressor && !isDefender) {
            return interaction.reply({ content: 'Only the warring parties can use treaty commands.', ephemeral: true });
        }

        if (subcommand === 'propose') {
            const terms = interaction.options.getString('terms');
            
            if (game.treaty && game.treaty.pending) {
                return interaction.reply({ content: 'There is already a pending treaty proposal.', ephemeral: true });
            }

            const proposer = isAggressor ? game.aggressor : game.defender;
            const recipient = isAggressor ? game.defender : game.aggressor;

            game.treaty = {
                pending: true,
                proposer: userId,
                recipient: recipient.id,
                terms: terms,
                timestamp: new Date()
            };

            let termsDescription = '';
            switch (terms) {
                case 'white_peace':
                    termsDescription = 'Both sides return to pre-war status with no gains or losses.';
                    break;
                case 'tribute':
                    termsDescription = 'The losing side pays 3 resources of each type to the winner.';
                    break;
                case 'surrender':
                    termsDescription = 'The surrendering side loses all armies and half their resources.';
                    break;
                case 'ceasefire':
                    termsDescription = 'Temporary halt to fighting for 24 hours. War can resume after.';
                    break;
            }

            const embed = new EmbedBuilder()
                .setTitle('🕊️ Peace Treaty Proposed')
                .setDescription(`**${proposer.username}** has proposed a peace treaty to **${recipient.username}**`)
                .addFields(
                    { name: 'Terms', value: `**${terms.replace('_', ' ').toUpperCase()}**\n${termsDescription}` },
                    { name: 'Response Required', value: `${recipient.username} can use \`/treaty accept\` or \`/treaty reject\`` }
                )
                .setColor(0x00FF00)
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        }
        else if (subcommand === 'accept') {
            if (!game.treaty || !game.treaty.pending) {
                return interaction.reply({ content: 'There is no pending treaty to accept.', ephemeral: true });
            }

            if (game.treaty.recipient !== userId) {
                return interaction.reply({ content: 'You are not the recipient of this treaty.', ephemeral: true });
            }

            // Apply treaty terms
            const terms = game.treaty.terms;
            let resultMessage = '';

            switch (terms) {
                case 'white_peace':
                    resultMessage = 'White peace established. Both sides return to pre-war status.';
                    break;
                case 'tribute':
                    const tributePayer = game.treaty.proposer === game.aggressor.id ? game.defender.id : game.aggressor.id;
                    const tributeReceiver = game.treaty.proposer === game.aggressor.id ? game.aggressor.id : game.defender.id;
                    
                    // Transfer resources
                    const payerResources = game.resources[tributePayer];
                    const receiverResources = game.resources[tributeReceiver];
                    
                    ['bronze', 'timber', 'mounts', 'food'].forEach(resource => {
                        const amount = Math.min(3, payerResources[resource]);
                        payerResources[resource] -= amount;
                        receiverResources[resource] += amount;
                    });
                    
                    resultMessage = 'Tribute paid. 3 resources of each type transferred to the winner.';
                    break;
                case 'surrender':
                    const surrenderer = game.treaty.proposer === game.aggressor.id ? game.aggressor.id : game.defender.id;
                    
                    // Remove all armies
                    game.armies[surrenderer] = [];
                    
                    // Halve resources
                    const surrendererResources = game.resources[surrenderer];
                    ['bronze', 'timber', 'mounts', 'food'].forEach(resource => {
                        surrendererResources[resource] = Math.floor(surrendererResources[resource] / 2);
                    });
                    
                    resultMessage = 'Surrender accepted. All armies lost and resources halved.';
                    break;
                case 'ceasefire':
                    game.ceasefire = {
                        active: true,
                        expires: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
                    };
                    resultMessage = 'Ceasefire established for 24 hours. No hostile actions allowed.';
                    break;
            }

            const proposer = game.treaty.proposer === game.aggressor.id ? game.aggressor : game.defender;
            const accepter = userId === game.aggressor.id ? game.aggressor : game.defender;

            game.treaty = null;

            const embed = new EmbedBuilder()
                .setTitle('✅ Treaty Accepted')
                .setDescription(`**${accepter.username}** has accepted the peace treaty proposed by **${proposer.username}**`)
                .addFields({ name: 'Result', value: resultMessage })
                .setColor(0x00FF00)
                .setTimestamp();

            if (terms !== 'ceasefire') {
                embed.addFields({ name: 'War Status', value: 'This war has ended peacefully.' });
            }

            await interaction.reply({ embeds: [embed] });
        }
        else if (subcommand === 'reject') {
            if (!game.treaty || !game.treaty.pending) {
                return interaction.reply({ content: 'There is no pending treaty to reject.', ephemeral: true });
            }

            if (game.treaty.recipient !== userId) {
                return interaction.reply({ content: 'You are not the recipient of this treaty.', ephemeral: true });
            }

            const proposer = game.treaty.proposer === game.aggressor.id ? game.aggressor : game.defender;
            const rejecter = userId === game.aggressor.id ? game.aggressor : game.defender;

            game.treaty = null;

            const embed = new EmbedBuilder()
                .setTitle('❌ Treaty Rejected')
                .setDescription(`**${rejecter.username}** has rejected the peace treaty proposed by **${proposer.username}**`)
                .addFields({ name: 'War Status', value: 'The war continues. Fighting may resume.' })
                .setColor(0xFF0000)
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        }
        else if (subcommand === 'status') {
            if (!game.treaty && !game.ceasefire) {
                return interaction.reply({ content: 'There are no active treaties or ceasefires.', ephemeral: true });
            }

            const embed = new EmbedBuilder()
                .setTitle('📋 Treaty Status')
                .setColor(0x0099FF);

            if (game.treaty && game.treaty.pending) {
                const proposer = game.treaty.proposer === game.aggressor.id ? game.aggressor : game.defender;
                const recipient = game.treaty.recipient === game.aggressor.id ? game.aggressor : game.defender;
                
                embed.addFields(
                    { name: 'Pending Treaty', value: `**${proposer.username}** → **${recipient.username}**` },
                    { name: 'Terms', value: game.treaty.terms.replace('_', ' ').toUpperCase() },
                    { name: 'Proposed', value: `<t:${Math.floor(game.treaty.timestamp.getTime() / 1000)}:R>` }
                );
            }

            if (game.ceasefire && game.ceasefire.active) {
                const expiresTimestamp = Math.floor(game.ceasefire.expires.getTime() / 1000);
                embed.addFields(
                    { name: 'Active Ceasefire', value: `No hostile actions allowed` },
                    { name: 'Expires', value: `<t:${expiresTimestamp}:R>` }
                );
            }

            await interaction.reply({ embeds: [embed] });
        }
    },
};
