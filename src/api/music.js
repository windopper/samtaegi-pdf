import { databaseName } from "./index.js";
import { mongoClient } from "../index.js";
import { Collection, Message, TextChannel } from "discord.js";

const collectionName = "music";

class MusicModel {
    /**
     * 
     * @param {string} guildId 
     * @param {string} applicationChannelId 
     * @param {string} applicationDashboardId 
     */
    constructor(guildId, applicationChannelId, applicationDashboardId) {
        this.guildId = guildId;
        this.applicationChannelId = applicationChannelId;
        this.applicationDashboardId = applicationDashboardId;
    }
}

/**
 * get music application channel id from the database
 * 
 * @param {string} guildId 
 * @returns {string}
 */
export async function getMusicAppChannelId(guildId) {
    try {
        const database = mongoClient.db(databaseName);
        const collection = database.collection(collectionName);
        const query = { guildId: guildId };
        const result = await collection.findOne(query)
        return result.applicationChannelId
    } catch (error) {
        console.error(error);
    }
}

/**
 * 
 * @param {string} applicationChannelId 
 * @returns {string}
 */
export async function getMusicAppDashboardId(guildId) {
    try {
        const database = mongoClient.db(databaseName);
        const collection = database.collection(collectionName);
        const query = { guildId: guildId };
        const result = await collection.findOne(query)
        return result.applicationDashboardId
    } catch (error) {
        console.error(error);
    }
}

/**
 * set music application channel id to the database
 * 
 * @param {string} guildId 
 * @param {string} applicationChannelId 
 * @param {string} applicationDashboardId
 */
export async function setMusicModel(guildId, applicationChannelId, applicationDashboardId) {
    try {
        const database = mongoClient.db(databaseName);
        const collection = database.collection(collectionName);
        const query = { guildId: guildId };
        const update = { $set: { applicationChannelId: applicationChannelId, applicationDashboardId: applicationDashboardId } };
        await collection.updateOne(query, update, { upsert: true });
    } catch (error) {
        console.error(error);
    }
}

const musicChannelCache = new Collection();
class ChannelDashboardCache {
    /**
     * 
     * @param {TextChannel} channel 
     * @param {Message} dashboard 
     */
    constructor(channel, dashboard) {
        this.channel = channel;
        this.dashboard = dashboard;
    }
}

/**
 * 
 * @param {string} guildId 
 * @returns {ChannelDashboardCache}
 */
export function getMusicChannelCache(guildId) {
    return musicChannelCache.get(guildId);
}

/**
 * 
 * @param {string} guildId 
 * @param {ChannelDashboardCache} channelDashboardCache 
 */
export function setMusicChannelCache(guildId, channelDashboardCache) {
    musicChannelCache.set(guildId, channelDashboardCache);
}