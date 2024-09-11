import { ChannelType, Client, GatewayIntentBits } from 'discord.js';
import { handlePdfSummarizeRoute } from './service/summarize.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

import { configDotenv } from 'dotenv';
configDotenv({
  path: `./.env.${process.env.NODE_ENV}`,
})

import { checkMongoDBConnection } from './api/index.js';
import { MongoClient, ServerApiVersion } from 'mongodb';
import { handleMusicChannelDelete, handleMusicInteractionRoute, handleMusicMessageDelete, handleMusicQueueInteractionRoute, handleMusicRoute, initiateMusicAppChannel } from './service/music.js';

export const mongoClient = new MongoClient(
  `mongodb+srv://${process.env.MONGO_DB_PASSWORD}@samtaegi.tkeu8.mongodb.net/?retryWrites=true&w=majority&appName=samtaegi`,
  {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  }
);

checkMongoDBConnection(mongoClient);

client.login(process.env.DISCORD_TOKEN);

process.on("uncaughtException", err => {
  console.error(err);
})

process.on("unhandledRejection", err => {
  console.error(err);
});

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  client.user.setActivity('!요약')

  // get all guilds
  const guilds = client.guilds.cache;
  guilds.forEach(guild => {
    initiateMusicAppChannel(guild);
  });
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'ping') {
    await interaction.reply('Pong!');
  }
});

client.on('messageCreate', async message => {
  if (message.channel.type !== ChannelType.GuildText) return;

  if (message.author.bot) return;

  if (message.content === 'ping') {
    message.reply('Pong!');
  }

  try {
    handlePdfSummarizeRoute(message);
    handleMusicRoute(message);

  } catch (error) {
    console.error(error);
  }
})

client.on('messageDelete', async message => {
  handleMusicMessageDelete(message);
})

client.on('channelDelete', async channel => {
  handleMusicChannelDelete(channel);
})

client.on('interactionCreate', async interaction => {
  try {
    handleMusicInteractionRoute(interaction);
    handleMusicQueueInteractionRoute(interaction);
  } catch (err) {
    console.log(err)
  }
});