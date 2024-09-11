import {
  ChannelType,
  Guild,
  Message,
  TextChannel,
  ButtonInteraction,
  StringSelectMenuInteraction,
  ComponentType,
} from "discord.js";
import {
  getMusicAppChannelId,
  getMusicAppDashboardId,
  getMusicChannelCache,
  setMusicChannelCache,
  setMusicModel,
} from "../api/music.js";
import {
  join,
  leave,
  addQueue,
  pause,
  resume,
  skip,
  queueList,
  checkHasMusicQueue,
  getCurrentSong,
  isPaused,
  getQueueMaxPage,
  getMusicQueue,
  PlayListItemSelector,
  remove,
  top,
  findSongById,
} from "../libs/music.js";
import {
  getDefaultMusicDashboardEmbed,
  getMusicCannotFindReplyMessageEmbed,
  getMusicDashboardEmbedButton,
  getMusicPlayReplyMessageEmbed,
  getMusicQueueItemSelectMenu,
  getMusicQueueReplyMessageButton,
  getMusicQueueReplyMessageEmbed,
  getMusicRemoveReplyMessageEmbed,
  getMusicSkipReplyMessageEmbed,
  getMusicTopReplyMessageEmbed,
  getNowPlayingMusicDashboardEmbed,
  getPausedMusicDashboardEmbed,
} from "../embeds/music.js";

/**
 *
 * @param {Guild} guild
 */
export async function initiateMusicAppChannel(guild) {
  const applicationChannel = await getOrCreateMusicAppChannel(guild);
  const applicationDashboard = await getOrCreateAppDashboard(
    guild,
    applicationChannel
  );
  const guildId = guild.id;

  await setMusicModel(guildId, applicationChannel.id, applicationDashboard.id);

  // cache the application channel
  setMusicChannelCache(guildId, {
    channel: applicationChannel,
    dashboard: applicationDashboard,
  });

  return applicationChannel;
}

/**
 *
 * @param {Guild} guild
 * @returns {TextChannel}
 */
async function getOrCreateMusicAppChannel(guild) {
  const guildId = guild.id;

  // check if the application channel exists
  const applicationChannelId = await getMusicAppChannelId(guildId);

  if (applicationChannelId) {
    const applicationChannel = await guild.channels
      .fetch(applicationChannelId)
      .catch(() => null);
    if (applicationChannel) {
      return applicationChannel;
    }
  }

  const applicationChannel = await guild.channels.create({
    name: "삼태기 음악 채널",
    type: ChannelType.GuildText,
    reason: "삼태기 음악 채널 생성",
  });

  return applicationChannel;
}

/**
 * @param {Guild} guild
 * @param {TextChannel} applicationChannel
 * @returns {Message}
 */
async function getOrCreateAppDashboard(guild, applicationChannel) {
  const applicationDashboardId = await getMusicAppDashboardId(guild.id);

  // check if the application dashboard exists
  if (applicationDashboardId) {
    const applicationDashboard = await applicationChannel.messages
      .fetch(applicationDashboardId)
      .catch(() => null);
    if (applicationDashboard) {
      return applicationDashboard;
    }
  }

  let dashboard = null;

  // check if musicQueue exists
  if (checkHasMusicQueue(guild.id)) {
    const queue = getMusicQueue(guild.id);
    const currentSong = getCurrentSong(guild.id);

    if (isPaused(guild.id)) {
      dashboard = await applicationChannel.send({
        embeds: getPausedMusicDashboardEmbed(currentSong),
        components: [getMusicDashboardEmbedButton(false)],
      });
    } else {
      dashboard = await applicationChannel.send({
        embeds: getNowPlayingMusicDashboardEmbed(currentSong),
        components: [getMusicDashboardEmbedButton(true)],
      });
    }
  } else {
    dashboard = await applicationChannel.send({
      embeds: getDefaultMusicDashboardEmbed(),
    });
  }

  return dashboard;
}

/**
 *
 * @param {Message} message
 * @returns
 */
export async function handleMusicMessageDelete(message) {
  if (message.channel.type !== ChannelType.GuildText) return;

  const channelId = message.channel.id;
  const guildId = message.guild.id;

  const { channel: applicationChannel, dashboard: applicationDashboard } =
    getMusicChannelCache(guildId);

  if (applicationDashboard.id !== message.id) return;
  initiateMusicAppChannel(message.guild);
}

/**
 *
 * @param {TextChannel} message
 * @returns
 */
export async function handleMusicChannelDelete(channel) {
  if (channel.type !== ChannelType.GuildText) return;

  const channelId = channel.id;
  const guildId = channel.guild.id;

  const { channel: applicationChannel } = getMusicChannelCache(guildId);

  if (applicationChannel.id !== channelId) return;
  initiateMusicAppChannel(channel.guild);
}

/**
 *
 * @param {Message} message
 */
export async function handleMusicRoute(message) {
  if (message.channel.type !== ChannelType.GuildText) return;
  if (message.author.bot) return;

  try {
    const channelId = message.channel.id;
    const guildId = message.guild.id;

    const { channel: applicationChannel } = getMusicChannelCache(guildId);

    if (applicationChannel?.id !== channelId) return;

    await playMusic(message);
  } catch (err) {
  } finally {
    await message.delete();
  }
}

/**
 *
 * @param {ButtonInteraction} interaction
 */
export async function handleMusicInteractionRoute(interaction) {
  if (!interaction.isButton()) return;

  try {
    const channelId = interaction.channel.id;
    const guildId = interaction.guild.id;

    const { channel: applicationChannel, dashboard } =
      getMusicChannelCache(guildId);

    if (applicationChannel?.id !== channelId) return;
    if (dashboard.id !== interaction.message.id) return;

    const customId = interaction.customId;

    await dashboard.edit({
      embeds: dashboard.embeds,
      components: [getMusicDashboardEmbedButton(!isPaused(guildId), true)],
    });

    if (customId === "skip") {
      await skipMusic(interaction);
    } else if (customId === "stop") {
      await leaveVoiceChannel(interaction);
    } else if (customId === "pause") {
      await pauseMusic(interaction);
    } else if (customId === "resume") {
      await resumeMusic(interaction);
    } else if (customId === "queue") {
      await queue(interaction);
      await dashboard.edit({
        embeds: dashboard.embeds,
        components: [getMusicDashboardEmbedButton(!isPaused(guildId))],
      });
    } else if (customId === "function") {
    }
  } catch (error) {
    console.error(error);
  }
}

/**
 *
 * @param {ButtonInteraction | StringSelectMenuInteraction} interaction
 */
export async function handleMusicQueueInteractionRoute(interaction) {
  const channelId = interaction.channel.id;
  const guildId = interaction.guild.id;

  const { channel: applicationChannel, dashboard } =
    getMusicChannelCache(guildId);

  if (applicationChannel?.id !== channelId) return;

  const customId = interaction.customId;

  if (interaction.isButton()) {
    const split = customId.split("/");
    const action = split[0];
    const page = parseInt(split[1]);

    if (action === "musicQueuePage") {
      await queuePage(interaction, page);
    } else if (action === "musicQueueDelete") {
      const musicId = PlayListItemSelector.getSelectedId(interaction.user);
      await removeMusic(interaction, musicId);
    } else if (action === "musicQueueTop") {
      const musicId = PlayListItemSelector.getSelectedId(interaction.user);
      await topMusic(interaction, musicId);
    }
  } else if (interaction.isStringSelectMenu()) {
    const customId = interaction.customId;

    if (customId === "musicQueueSelect") {
      await queueSelect(interaction);
    }
  }
}

/**
 * @param {Message} message
 */
export async function joinVoiceChannel(message) {
  const queue = join(message);

  // 자동 재생 될 때 대시보드 업데이트
  queue.on("play", async (song) => {
    const { dashboard } = getMusicChannelCache(message.guild.id);
    await dashboard.edit({
      embeds: getNowPlayingMusicDashboardEmbed(song),
      components: [getMusicDashboardEmbedButton(true)],
    });
  });

  queue.on("destroy", async () => {
    const { dashboard } = getMusicChannelCache(message.guild.id);
    await dashboard.edit({
      embeds: getDefaultMusicDashboardEmbed(),
      components: [],
    });
  });

  queue.on("clear", async () => {
    const { dashboard } = getMusicChannelCache(message.guild.id);
    await dashboard.edit({
      embeds: getDefaultMusicDashboardEmbed(),
      components: [],
    });
  });

  queue.on("playEnd", async () => {
    const { dashboard } = getMusicChannelCache(message.guild.id);
    await dashboard.edit({
      embeds: getDefaultMusicDashboardEmbed(),
      components: [],
    });
  });
}

export async function leaveVoiceChannel(message) {
  await leave(message);
}

/**
 *
 * @param {Message} message
 */
export async function playMusic(message) {
  if (!checkHasMusicQueue(message.guild.id)) joinVoiceChannel(message);
  const queueItem = await addQueue(message);

  const replied = await message.reply({
    embeds: getMusicPlayReplyMessageEmbed(message.author, queueItem),
  });

  // delete the message after 5 seconds
  setTimeout(() => {
    replied.delete().catch(() => null);
  }, 5000);
}

/**
 *
 * @param {ButtonInteraction} message
 */
export async function pauseMusic(message) {
  const currentSong = getCurrentSong(message.guild.id);

  pause(message);

  updateDashboardOnQueueState(message);
}

/**
 *
 * @param {ButtonInteraction} message
 */
export async function resumeMusic(message) {
  const currentSong = getCurrentSong(message.guild.id);

  resume(message);

  updateDashboardOnQueueState(message);
}

/**
 *
 * @param {ButtonInteraction} message
 */
export async function skipMusic(message) {
  await skip(message);

  const currentSong = getCurrentSong(message.guild.id);
  const res = await message.reply({
    embeds: getMusicSkipReplyMessageEmbed(message.user, currentSong),
    ephemeral: true,
  });

  setTimeout(() => {
    res.delete().catch(() => null);
  }, 5000);
}

/**
 *
 * @param {ButtonInteraction} message
 */
export async function queue(message) {
  const { dashboard } = getMusicChannelCache(message.guild.id);
  const q = queueList(message.channel, 1);
  const queueLength = getQueueMaxPage(message.guild.id);

  await message.reply({
    embeds: getMusicQueueReplyMessageEmbed(message.user, q, 1, queueLength),
    components: [
      getMusicQueueReplyMessageButton(false, queueLength > 1, 1),
      getMusicQueueItemSelectMenu(q),
    ],
    ephemeral: true,
  });

  PlayListItemSelector.remove(message.user);
}

/**
 *
 * @param {ButtonInteraction} interaction
 * @param {number} page
 */
async function queuePage(interaction, page) {
  const { dashboard } = getMusicChannelCache(interaction.guild.id);
  const q = queueList(interaction.channel, page);
  const queueLength = getQueueMaxPage(interaction.guild.id);

  await interaction.update({
    embeds: getMusicQueueReplyMessageEmbed(
      interaction.user,
      q,
      page,
      queueLength
    ),
    components: [
      getMusicQueueReplyMessageButton(page > 1, page < queueLength, page),
      getMusicQueueItemSelectMenu(q),
    ],
  });
}

/**
 *
 * @param {StringSelectMenuInteraction} interaction
 */
async function queueSelect(interaction) {
  const value = interaction.values[0];
  const user = interaction.user;
  PlayListItemSelector.select(user, value);

  // update nothing
  await interaction.deferUpdate();
}

export async function clear(message) {}

export async function nowPlaying(message) {}

export async function loop(message) {}

export async function shuffle(message) {}

export async function volume(message) {}

export async function seek(message) {}

/**
 *
 * @param {ButtonInteraction} message
 * @param {string} musicId
 */
export async function removeMusic(message, musicId) {
  const song = findSongById(message.guild.id, musicId);
  let reply = null;
  if (!song) {
    reply = await message.update({
      embeds: getMusicCannotFindReplyMessageEmbed(message.user),
      components: [],
      ephemeral: true,
    });
  } else {
    remove(message, musicId);

    reply = await message.update({
      embeds: getMusicRemoveReplyMessageEmbed(message.user, song),
      components: [],
      ephemeral: true,
    });
  }

  setTimeout(() => {
    reply.delete().catch(() => null);
  }, 5000);
}

/**
 *
 * @param {ButtonInteraction} message
 * @param {string} musicId
 */
export async function topMusic(message, musicId) {
  const song = findSongById(message.guild.id, musicId);
  let reply = null;
  if (!song) {
    reply = await message.update({
      embeds: getMusicCannotFindReplyMessageEmbed(message.user),
      components: [],
      ephemeral: true,
    });
  } else {
    top(message, musicId);

    reply = await message.update({
      embeds: getMusicTopReplyMessageEmbed(message.user, song),
      components: [],
      ephemeral: true,
    });
  }

  setTimeout(() => {
    reply.delete().catch(() => null);
  }, 5000);
}

export async function move(message) {}

export async function help(message) {}

/**
 *
 * @param {ButtonInteraction} interaction
 */
export async function updateDashboardOnQueueState(interaction) {
  const currentSong = getCurrentSong(interaction.guild.id);
  const isPlaying = !isPaused(interaction.guild.id);

  if (currentSong) {
    await interaction.update({
      embeds: isPlaying
        ? getNowPlayingMusicDashboardEmbed(currentSong)
        : getPausedMusicDashboardEmbed(currentSong),
      components: [getMusicDashboardEmbedButton(isPlaying)],
    });
  } else {
    await interaction.update({
      embeds: getDefaultMusicDashboardEmbed(),
      components: [],
    });
  }
}
