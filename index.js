import { Client, GatewayIntentBits } from 'discord.js';
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});
import 'dotenv/config'
import { handlePdfSummarizeRoute } from './src/service/summarize.js';


client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'ping') {
    await interaction.reply('Pong!');
  }
});

client.on('messageCreate', async message => {
  if (message.author.bot) return;

  if (message.content === 'ping') {
    message.reply('Pong!');
  }

  try {
    handlePdfSummarizeRoute(message);
  
    if (message.channel.isThread()) {
      const thread = message.channel;
      const owner = thread.ownerId;
  
      if (owner === client.user.id) {
        const allMessages = await thread.messages.fetch();
        const allMessagesArray = allMessages;
        console.log(allMessagesArray);
      }
    }

  } catch (error) {
    console.error(error);
    message.reply('에러가 발생했어요! 다시 시도해주세요.');
  }
})

client.login(process.env.DISCORD_TOKEN);