require('dotenv').config();
const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
const keepAlive = require('./server');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.DirectMessages,
    ],
    partials: [Partials.Channel],
});

client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
    } else {
        console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
}

// Deploy commands
const deployPath = path.join(__dirname, 'deploy-commands.js');
require(deployPath);

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    console.log(`Repl URL: https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`);
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
        } else {
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
    }
});


client.login(process.env.DISCORD_TOKEN);
// Add to your main bot file (index.js)
const express = require('express');
const http = require('http');

const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Bot is running!');
});

const server = http.createServer(app);
server.listen(port, () => {
  console.log(`HTTP server running on port ${port}`);
});

// Self-ping function
function keepAlive() {
  // Ping your own server every 4 minutes
  setInterval(() => {
    fetch(`http://localhost:${port}`)
      .then(res => console.log(`Self-ping: ${res.status}`))
      .catch(err => console.error('Ping error:', err));
  }, 20000); // 4 minutes
}

// Start self-pinging when bot is ready
client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  keepAlive();
});
keepAlive();
