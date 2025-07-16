
// Load environment variables from .env
require('dotenv').config();

// Discord.js and utility imports
const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
// (Optional) keepAlive for legacy hosting, not used in this file
// const keepAlive = require('./server');


// Create Discord client with required intents and partials
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


// Load all command modules from the commands directory
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



// --- Register slash commands directly from this file ---
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

// Prepare command data for registration
const commands = [];
for (const command of client.commands.values()) {
    if (command.data) {
        commands.push(command.data.toJSON ? command.data.toJSON() : command.data);
    }
}

async function registerCommands() {
    try {
        const rest = new REST({ version: '10' }).setToken(TOKEN);
        console.log('Registering commands...');
        if (GUILD_ID) {
            await rest.put(
                Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
                { body: commands }
            );
            console.log(`Registered commands to guild: ${GUILD_ID}`);
        } else {
            await rest.put(
                Routes.applicationCommands(CLIENT_ID),
                { body: commands }
            );
            console.log('Registered commands globally');
        }
    } catch (error) {
        console.error('Failed to register commands:', error);
    }
}


// Bot ready event

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);
    await registerCommands();
    // If running on Replit, print the public URL
    if (process.env.REPL_SLUG && process.env.REPL_OWNER) {
        console.log(`Repl URL: https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`);
    }
});



// Utility function for consistent error handling
async function handleCommandError(interaction, error) {
    console.error(error);
    if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
    } else {
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
}

// Handle all slash command interactions
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
        await handleCommandError(interaction, error);
    }
});



// Log in to Discord
client.login(TOKEN);

// --- Optional: Express HTTP server for uptime monitoring (e.g., Replit, UptimeRobot) ---
const express = require('express');
const http = require('http');
const app = express();
const port = process.env.PORT || 3000;

// Simple health check endpoint
app.get('/', (req, res) => {
  res.send('Bot is running!');
});

const server = http.createServer(app);
server.listen(port, () => {
  console.log(`HTTP server running on port ${port}`);
});

// Self-ping function to keep the bot alive on free hosting
function keepAlive() {
  // Ping your own server every 4 minutes
  setInterval(() => {
    fetch(`http://localhost:${port}`)
      .then(res => console.log(`Self-ping: ${res.status}`))
      .catch(err => console.error('Ping error:', err));
  }, 20000); // 4 minutes
}

// Start self-pinging when bot is ready (for Replit/UptimeRobot)
client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  keepAlive();
});
// If not using Replit, you can comment out keepAlive();
keepAlive();
