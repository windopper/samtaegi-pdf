import { ButtonInteraction, GuildMember, Message } from "discord.js";
import { client } from "../index.js";
import { getUserAndBotNotInSameVoiceChannel, getUserNotInVoiceChannel } from "../embeds/music.js";

/**
 * 
 * @param {ButtonInteraction} interaction 
 */
export async function validateSameVoiceChannel(interaction) {
    // get the voice channel of the user who clicked the button

    /**
     * @type {GuildMember}
     */
    const member = interaction.member;
    const voiceChannel = member.voice.channel;

    // get the voice channel of the bot
    const botVoiceChannel = interaction.guild.voiceStates.cache.get(client.user.id)?.channel;

    if (voiceChannel === botVoiceChannel) {
        return true;
    }

    const reply = await interaction.reply({
        embeds: [getUserAndBotNotInSameVoiceChannel(interaction.user)],
        ephemeral: true
    });

    setTimeout(() => {
        reply.delete().catch(() => null);
    }, 5000);

    return false;
}

/**
 * 
 * @param {Message | ButtonInteraction} message 
 */
export async function validateInMusicChannel(message) {
    if (message.member.voice.channelId) return true;

    const reply = await message.reply({
        embeds: [getUserNotInVoiceChannel(message.author ? message.author : message.user)],
        ephemeral: true
    });

    setTimeout(() => {
        reply.delete().catch(() => null);
    }, 5000);

    return false;
}