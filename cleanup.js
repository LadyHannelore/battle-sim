const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');
require('dotenv').config();

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID; // Optional for guild-specific cleanup

const rest = new REST({ version: '10' }).setToken(TOKEN);

async function cleanupCommands() {
  try {
    // For global commands
    const globalCommands = await rest.get(Routes.applicationCommands(CLIENT_ID));
    
    for (const command of globalCommands) {
      await rest.delete(
        Routes.applicationCommand(CLIENT_ID, command.id)
      );
      console.log(`Deleted global command: ${command.name}`);
    }

    // For guild-specific commands (if used)
    if (GUILD_ID) {
      const guildCommands = await rest.get(
        Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID)
      );
      
      for (const command of guildCommands) {
        await rest.delete(
          Routes.applicationGuildCommand(CLIENT_ID, GUILD_ID, command.id)
        );
        console.log(`Deleted guild command: ${command.name}`);
      }
    }

    console.log('Successfully cleaned up all commands!');
  } catch (error) {
    console.error('Failed to clean up commands:', error);
  }
}

cleanupCommands();
