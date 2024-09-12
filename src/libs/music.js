import { AudioPlayerStatus, createAudioPlayer, createAudioResource, entersState, getVoiceConnection, joinVoiceChannel, VoiceConnection, VoiceConnectionStatus } from "@discordjs/voice";
import { ButtonInteraction, Guild, Message, TextChannel, User } from "discord.js";
// import ytdl from "@distube/ytdl-core";
import { Client, PlaylistVideos, VideoCompact } from "youtubei";
import EventEmitter from "events";
import { YtdlCore } from "@ybd-project/ytdl-core";
import { youtubeOauth2 } from "../index.js"

const youtube = new Client();
// const agent = ytdl.createAgent(JSON.parse(fs.readFileSync('./resource/cookie.json')));

export class MusicQueueItem {
    /**
     * @param {string} id
     * @param {string} title 
     * @param {string} author 
     * @param {string} url 
     * @param {string} thumbnail 
     * @param {string} duration
     */
    constructor(id, title, author, url, thumbnail, duration) {
        this.id = id
        this.title = title;
        this.author = author;
        this.url = url;
        this.thumbnail = thumbnail;
        const minutes = Math.floor(duration / 60);
        this.duration = `${minutes}:${duration - minutes * 60}`;
    }
}

class MusicQueue extends EventEmitter {
    static map = new Map();

    /**
     * 
     * @param {string} guildId 
     * @param {VoiceConnection} connection 
     * @returns {MusicQueue}
     */
    static create(guildId, connection) {
        let queue = this.map.get(guildId);
        if (!queue) {
            queue = new MusicQueue(guildId, connection);
            this.map.set(guildId, queue);
        }
        return queue;
    }

    /**
     * 
     * @param {string} guildId 
     * @returns {MusicQueue}
     */
    static getByGuildId(guildId) {
        return this.map.get(guildId);
    }

    /**
     * 
     * @param {string} guildId 
     */
    static removeByGuildId(guildId) {
        /**
         * @type {MusicQueue}
         */
        const queue = this.map.get(guildId);

        if (queue) {
            queue.destroy();
        }

        this.map.delete(guildId);
    }

    /**
     * @param {string} guildId
     * @param {VoiceConnection} connection 
     */
    constructor(guildId, connection) {
        super();
        this.guildId = guildId;
        this.connection = connection;
        this.connection.on("stateChange", async (oldState, newState) => {
            if (newState.status === VoiceConnectionStatus.Signalling) {
                
            } else if (newState.status === VoiceConnectionStatus.Ready) {

            } else if (newState.status === VoiceConnectionStatus.Disconnected) {
                try {
                    this.pause();
                    await Promise.race([
                        entersState(this.connection, VoiceConnectionStatus.Signalling, 5_000),
                        entersState(this.connection, VoiceConnectionStatus.Connecting, 5_000),
                    ])
                    this.resume();
                } catch (err) {
                    MusicQueue.removeByGuildId(this.guildId);
                }
            } else if (newState.status === VoiceConnectionStatus.Destroyed) {
                
            }
        });
        this.connection.on("error", console.error);

        this.player = createAudioPlayer();
        this.player.on("error", console.error);
        this.player.on("stateChange", (oldState, newState) => {
            if (newState.status === AudioPlayerStatus.Idle) {
                this.playNext();
            } else if (newState.status === AudioPlayerStatus.Playing) {
                    
            } else if (newState.status === AudioPlayerStatus.Paused) {
                
            } else if (newState.status === AudioPlayerStatus.AutoPaused) {
                
            } else if (newState.status === AudioPlayerStatus.Buffering) {
                
            }
        });

        /**
         * @type {MusicQueueItem[]}
         */
        this.queue = [];
        this.resource = null;

        this.connection.subscribe(this.player);
    }

    /**
     * 
     * @param {MusicQueueItem} song 
     */
    add(song) {
        this.queue.push(song);
        this.emit("add", song);

        // play if the player is idle
        if (this.player.state.status === AudioPlayerStatus.Idle) {
            this.playNext();
        }
    }

    /**
     * 
     * @param {MusicQueueItem[]} songs 
     */
    addPlaylist(songs) {
        this.queue.push(...songs);
        this.emit("addPlayList", songs);

        // play if the player is idle
        if (this.player.state.status === AudioPlayerStatus.Idle) {
            this.playNext();
        }
    }

    top(index) {
        const song = this.queue.splice(index, 1);
        this.queue.unshift(song[0]);
        this.emit("top", song[0]);
    }

    remove(index) {
        const song = this.queue.splice(index, 1);
        this.emit("remove", song);
    }

    clear() {
        this.queue = [];
        this.emit("clear");
    }

    currentSong() {
        if (this.resource) {
            return this.resource.metadata.song;
        }
        return null;
    }

    playNext() {
        if (this.queue.length > 0) {
            /**
             * @type {MusicQueueItem}
             */
            const song = this.queue.shift();
            const ytdl = new YtdlCore({
                oauth2: youtubeOauth2,
            })
            const stream = ytdl.download(song.url, { filter: "audioonly", dlChunkSize: 10 * 1024 * 1024, highWaterMark: 1 << 25 }).on("error", err => {
                this.emit("error", err);
            })
            this.resource = createAudioResource(stream, {
                metadata: {
                    song,
                }
            });
            this.player.play(this.resource);
            this.emit("play", song);
        } else {
            this.resource = null;
            this.emit('playEnd');
        }
    }

    pause() {
        this.player.pause();
        this.emit("pause", this.resource.metadata.song);
    }

    resume() {
        this.player.unpause();
        this.emit("resume", this.resource.metadata.song);
    }

    isPaused() {
        return this.player.state.status === AudioPlayerStatus.Paused;
    }

    skip() {
        this.player.stop();
        this.playNext();
        this.emit("skip", this.resource ? this.resource.metadata.song : null);
    }

    destroy() {
        this.connection.destroy();
        this.emit("destroy");
    }

    findSongById(id) {
        return this.queue.find(song => song.id === id);
    }

    get(index) {
        return this.queue[index];
    }

    get length() {
        return this.queue.length;
    }
}

/**
 * 
 * @param {string} guildId 
 * @returns {boolean}
 */
export function checkHasMusicQueue(guildId) {
    return MusicQueue.map.has(guildId);
}

/**
 * 
 * @param {string} guildId 
 * @returns 
 */
export function getMusicQueue(guildId) {
    return MusicQueue.map.get(guildId);
}

/**
 * 
 * @param {Message} message 
 * @returns {MusicQueue}
 */
export function join(message) {
    const connection = joinVoiceChannel({
        channelId: message.member.voice.channel.id,
        guildId: message.guild.id,
        adapterCreator: message.guild.voiceAdapterCreator,
    })
    const queue = MusicQueue.create(message.guild.id, connection);
    return queue;
}

/**
 * 
 * @param {ButtonInteraction | Message} message 
 */
export async function leave(message) {
    MusicQueue.removeByGuildId(message.guild.id);
}

/**
 * 
 * @param {Message} message
 * @returns {MusicQueueItem | MusicQueueItem[]} 
 */
export async function addQueue(message) {
    const queue = MusicQueue.getByGuildId(message.guild.id);
    const song = message.content;

    const playlist = await youtube.getPlaylist(song);
    
    if (YtdlCore.validateURL(song)) {
        const ytdl = new YtdlCore({
            oauth2: youtubeOauth2,
        })
        const info = await ytdl.getFullInfo(song)

        const queueItem = new MusicQueueItem(
          info.videoDetails.videoId,
          info.videoDetails.title,
          info.videoDetails.ownerChannelName,
          info.videoDetails.videoUrl,
          info.videoDetails.thumbnails[0].url,
          info.videoDetails.lengthSeconds,
        );

        queue.add(queueItem);
        return queueItem;
    } else if (playlist) {
      /** @type {VideoCompact[]} */
      const videos = playlist.videos;

      /** @type {MusicQueueItem[]} */
      const queueItems = [];

      videos.forEach((video) => {
        const url = `https://www.youtube.com/watch?v=${video.id}`;
        
        const queueItem = new MusicQueueItem(
          video.id,
          video.title,
          video.channel?.name,
          url,
          video.thumbnails[0].url,
          video.duration
        );

        queueItems.push(queueItem);
      });

      queue.addPlaylist(queueItems);
      return queueItems;
    }
    return null;
}

/**
 * 
 * @param {string} guildId
 * @returns {MusicQueueItem}
 */
export function getCurrentSong(guildId) {
    const queue = MusicQueue.getByGuildId(guildId);
    return queue.currentSong();
}

/**
 * 
 * @param {ButtonInteraction | Message} message 
 */
export function pause(message) {
    const queue = MusicQueue.getByGuildId(message.guild.id);
    queue.pause();
}

/**
 * 
 * @param {ButtonInteraction | Message} message 
 */
export function resume(message) {
    const queue = MusicQueue.getByGuildId(message.guild.id);
    queue.resume();
}

/**
 * 
 * @param {string} guildId 
 * @returns {boolean}
 */
export function isPaused(guildId) {
    const queue = MusicQueue.getByGuildId(guildId);
    return queue.isPaused();
}

/**
 * 
 * @param {ButtonInteraction | Message} message 
 */
export async function skip(message) {
    const queue = MusicQueue.getByGuildId(message.guild.id);
    queue.skip();
}

/**
 * 
 * @param {ButtonInteraction} message 
 * @param {string} musicId 
 */
export function remove(message, musicId) {
    const queue = MusicQueue.getByGuildId(message.guild.id);
    const index = queue.queue.findIndex(item => item.id === musicId);
    queue.remove(index);
}

/**
 * 
 * @param {ButtonInteraction} message 
 * @param {string} musicId 
 */
export function top(message, musicId) {
    const queue = MusicQueue.getByGuildId(message.guild.id);
    const index = queue.queue.findIndex(item => item.id === musicId);
    queue.top(index);
}

/**
 * 
 * @param {string} guildId 
 * @param {string} musicId 
 * @returns 
 */
export function findSongById(guildId, musicId) {
    const queue = MusicQueue.getByGuildId(guildId);
    return queue.findSongById(musicId);
}



/**
 * 
 * @param {TextChannel} channel 
 * @param {number} page start from 1
 * @returns {MusicQueueItem[]}
 */
export function queueList(channel, page) {
    const OFFSET = 20
    const queue = MusicQueue.getByGuildId(channel.guild.id);
    const queueList = queue.queue;
    const start = (page - 1) * OFFSET;
    const end = page * OFFSET;
    return queueList.slice(start, end);
}

export function getQueueMaxPage(guildId) {
    const OFFSET = 20
    const queue = MusicQueue.getByGuildId(guildId);
    return Math.ceil(queue.length / OFFSET);
}

/**
 * 대기열 목록 선택 정보를 저장하기 위한 클래스
 */
export class PlayListItemSelector {
    static registry = new Map();

    /**
     * 
     * @param {User} user 
     * @param {string} musicId 
     */
    static select(user, musicId) {
        this.registry.set(user.id, musicId);
    }

    /**
     * 
     * @param {User} user 
     * @returns {string | null}
     */
    static getSelectedId(user) {
        const id = this.registry.get(user.id);
        return id ? id : null;
    }

    /**
     * 
     * @param {User} user 
     */
    static remove(user) {
        this.registry.delete(user.id);
    }
}