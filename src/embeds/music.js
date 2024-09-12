import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, SnowflakeUtil, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, User } from 'discord.js'
import { MusicQueueItem } from '../libs/music.js'

/**
 * @returns {readonly (import('discord.js').APIEmbed | import('discord.js').JSONEncodable<import('discord.js').APIEmbed>)[]}
 */
export function getDefaultMusicDashboardEmbed() {
    return [{
        "title": "삼태기 음악 대시보드",
        "description": "유튜브 링크를 입력하여 음악을 재생할 수 있어요!",
    }]
}

/**
 * @param {MusicQueueItem} song
 * @returns {readonly (import('discord.js').APIEmbed | import('discord.js').JSONEncodable<import('discord.js').APIEmbed>)[]}
 */
export function getNowPlayingMusicDashboardEmbed(song) {
    return [{
        "title": `${song.title}`,
        "description": song.url,
        "thumbnail": {
            url: song.thumbnail,
        },
    }]
}

/**
 * @param {MusicQueueItem} song
 * @returns {readonly (import('discord.js').APIEmbed | import('discord.js').JSONEncodable<import('discord.js').APIEmbed>)[]}
 */
export function getPausedMusicDashboardEmbed(song) {
    return [{
        "title": `${song.title}`,
        "description": song.url,
        "thumbnail": {
            url: song.thumbnail,
        },
        "footer": {
            "text": "일시정지 상태"
        }
    }]
}

/**
 * 
 * @param {boolean} isPlaying 
 * @param {boolean} isDisabled
 * @returns {ActionRowBuilder}
 */
export function getMusicDashboardEmbedButton(isPlaying, isDisabled = false) {
    const skip = new ButtonBuilder().setCustomId("skip").setLabel("스킵").setStyle(ButtonStyle.Primary).setDisabled(isDisabled);
    const stop = new ButtonBuilder().setCustomId("stop").setLabel("정지").setStyle(ButtonStyle.Danger).setDisabled(isDisabled);
    const pause = new ButtonBuilder().setCustomId("pause").setLabel("일시정지").setStyle(ButtonStyle.Secondary).setDisabled(isDisabled);
    const resume = new ButtonBuilder().setCustomId("resume").setLabel("시작").setStyle(ButtonStyle.Secondary).setDisabled(isDisabled);
    const queue = new ButtonBuilder().setCustomId("queue").setLabel("대기열").setStyle(ButtonStyle.Secondary).setDisabled(isDisabled);
    // const func = new ButtonBuilder().setCustomId("function").setLabel("기능").setStyle(ButtonStyle.Success).setDisabled(isDisabled);

    const row = new ActionRowBuilder().addComponents([skip, stop, isPlaying ? pause : resume, queue]);
    return row
}

/**
 * 
 * @param {User} author 
 * @param {MusicQueueItem | MusicQueueItem[]} queueItem 
 * @returns {readonly (import('discord.js').APIEmbed | import('discord.js').JSONEncodable<import('discord.js').APIEmbed>)[]}
 */
export function getMusicPlayReplyMessageEmbed(author, queueItem) {
    if (Array.isArray(queueItem)) {
        return [{
            "author": {
                "icon_url": author.displayAvatarURL(),
                "name": `대기열에 추가했어요!`
            },
            "description": queueItem.map((item, index) => `${index + 1}. ${item.title} [${item.duration}]`).join("\n")
        }]
    }

    return [{
        "author": {
            "icon_url": author.displayAvatarURL(),
            "name": `대기열에 추가했어요! ${queueItem.title}`
        }
    }]
}

/**
 * 
 * @param {User} author 
 * @param {MusicQueueItem | null} queueItem 
 * @returns {readonly (import('discord.js').APIEmbed | import('discord.js').JSONEncodable<import('discord.js').APIEmbed>)[]}
 */
export function getMusicSkipReplyMessageEmbed(author, queueItem) {
    return [{
        "author": {
            "icon_url": author.displayAvatarURL(),
            "name": `현재 재생 중인 곡을 스킵했어요! ${queueItem ? `다음 곡: **${queueItem.title}**` : ''}`
        }
    }]
}

/**
 * 
 * @param {User} author 
 * @param {MusicQueueItem} queueItem 
 * @returns 
 */
export function getMusicRemoveReplyMessageEmbed(author, queueItem) {
    return [{
        "author": {
            "icon_url": author.displayAvatarURL(),
            "name": `대기열에서 삭제했어요! ${queueItem.title}`
        }
    }]
}

/**
 * 
 * @param {User} author 
 * @param {MusicQueueItem} queueItem
 * @returns 
 */
export function getMusicTopReplyMessageEmbed(author, queueItem) {
    return [
      {
        author: {
          icon_url: author.displayAvatarURL(),
          name: `대기열을 맨 위로 이동했어요! ${queueItem.title}`,
        },
      },
    ];
}

/**
 * 
 * @param {User} author 
 * @returns 
 */
export function getMusicCannotFindReplyMessageEmbed(author) {
    return [{
        "author": {
            "icon_url": author.displayAvatarURL(),
            "name": `존재하지 않는 음악이에요!`
        }
    }]
}

/**
 * 
 * @param {User} author 
 * @returns 
 */
export function getMusicInvalidKeywordReplyMessageEmbed(author) {
    return [{
        "author": {
            "icon_url": author.displayAvatarURL(),
            "name": `유튜브 링크 또는 플레이리스트 아이디를 입력해주세요!`
        }
    }]
}

/**
 * 
 * @param {User} author 
 * @param {string} content
 * @returns {readonly (import('discord.js').APIEmbed | import('discord.js').JSONEncodable<import('discord.js').APIEmbed>)[]}
 */
export function getMusicCommonReplyMessageEmbed(author, content) {
    return [{
        "author": {
            "name": content,
        }
    }]
}

/**
 * 
 * @param {User} author 
 * @param {MusicQueueItem[]} queue 
 * @param {number} currentPage
 * @param {number} totalPage
 * @returns {readonly (import('discord.js').APIEmbed | import('discord.js').JSONEncodable<import('discord.js').APIEmbed>)[]}
 */
export function getMusicQueueReplyMessageEmbed(author, queue, currentPage, totalPage) {
    if (queue.length === 0) return [{
        "author": {
            "icon_url": author.displayAvatarURL(),
            "name": "대기열이 비어있어요!"
        }
    }]

    return [{
        "author": {
            "icon_url": author.displayAvatarURL(),
            "name": "대기열 목록"
        },
        "description": queue.map((item, index) => `${index + 1}. ${item.title}`).join("\n"),
        "footer": {
            "text": `<<< ${currentPage} / ${totalPage} >>>`
        }
    }]
}

/**
 * 
 * @param {boolean} hasPrevious
 * @param {boolean} hasNext
 * @param {number} currentPage
 * @returns {ActionRowBuilder}
 */
export function getMusicQueueReplyMessageButton(hasPrevious, hasNext, currentPage) {
    const previous = new ButtonBuilder().setCustomId("musicQueuePage/" + (currentPage - 1).toString()).setLabel("이전").setStyle(ButtonStyle.Secondary).setDisabled(!hasPrevious);
    const next = new ButtonBuilder().setCustomId("musicQueuePage/" + (currentPage + 1).toString()).setLabel("다음").setStyle(ButtonStyle.Secondary).setDisabled(!hasNext);
    const del = new ButtonBuilder().setCustomId("musicQueueDelete").setLabel("삭제").setStyle(ButtonStyle.Danger);
    const top = new ButtonBuilder().setCustomId("musicQueueTop").setLabel("맨 위로").setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder().addComponents([previous, next, del, top]);
    return row
}


/**
 * 
 * @param {MusicQueueItem[]} queue 
 * @param {string} defaultId
 * @returns {StringSelectMenuBuilder}
 */
export function getMusicQueueItemSelectMenu(queue, defaultId = "") {
    let select = new StringSelectMenuBuilder()
      .setCustomId("musicQueueSelect")
      .setPlaceholder("대기열 선택")
      .addOptions(
        queue.map((item, index) =>
          new StringSelectMenuOptionBuilder()
            .setLabel(item.title)
            .setValue(item.id)
            .setDefault(item.id === defaultId)
        )
      );

    const row = new ActionRowBuilder().addComponents([select]);
    return row;
}

/**
 * @param {User} author
 * @returns {readonly (import('discord.js').APIEmbed | import('discord.js').JSONEncodable<import('discord.js').APIEmbed>)[]}
 */
export function getUserAndBotNotInSameVoiceChannel(author) {
    return {
        "author": {
            "icon_url": author.displayAvatarURL(),
            "name": "음성 채널이 다르네요!",
        },
        "color": 0xff0000,
    }
}

export function getUserNotInVoiceChannel(author) {
    return {
        "author": {
            "icon_url": author.displayAvatarURL(),
            "name": "음성 채널에 들어가주세요!",
        },
    }
}

/**
 * @param {User} author
 * @returns {readonly (import('discord.js').APIEmbed | import('discord.js').JSONEncodable<import('discord.js').APIEmbed>)[]}
 */
export function getMusicErrorReplyMessageEmbed(author) {
    return [{
        "author": {
            "icon_url": author.displayAvatarURL(),
            "name": "오류 발생!",
        },
        "color": 0xff0000,
    }]
}