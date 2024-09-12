import { databaseName } from "./index.js";
import { mongoClient } from "../index.js";
import { Collection, Message, TextChannel } from "discord.js";
import got from "got";

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

class TokenScheme {
    /**
     * 
     * @param {string} accessToken 
     * @param {string} refreshToken 
     * @param {string} expiryDate 
     */
    constructor(accessToken, refreshToken, expiryDate) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.expiryDate = expiryDate;
    }
}

/**
 * @returns {TokenScheme}
 */
export async function getToken() {
    try {
        const database = mongoClient.db(databaseName);
        const collection = database.collection("token");
        const result = (await collection.find().toArray()).at(0);
        return result;
    } catch (error) {
        console.error(error);
    }
}

const TOKEN_ID = "66e2b56c0a565cb7256f650f";

/**
 * 
 * @param {TokenScheme} scheme 
 */
export async function setToken(scheme) {
    try {
        const database = mongoClient.db(databaseName);
        const collection = database.collection("token");
        await collection.updateOne({ _id: TOKEN_ID }, { $set: scheme }, { upsert: true });
    } catch (error) {
        console.error(error);
    }
}

/**
 * @returns {TokenScheme}
 */
export async function refreshToken() {
    const token = await getToken();

    const TOKEN_API = 'https://oauth2.googleapis.com/token'
    const CLIENT_ID = process.env.YOUTUBE_CLIENT_ID
    const CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET
    const REFRESH_TOKEN = token.refreshToken
    
    const TOKEN_API_RESPONSE = await got.post(TOKEN_API, {
        form: {
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            grant_type: 'refresh_token',
            refresh_token: REFRESH_TOKEN,
        },
        responseType: 'json',
    });

    if (TOKEN_API_RESPONSE.statusCode !== 200) {
        throw new Error('Failed to refresh token: ' + TOKEN_API_RESPONSE.body);
    }

    const RESPONSE_DATA = TOKEN_API_RESPONSE.body;
    const REFRESHED_TOKEN = {
      accessToken: RESPONSE_DATA.access_token,
      refreshToken: REFRESH_TOKEN,
      expiryDate: new Date(
        Date.now() + RESPONSE_DATA.expires_in * 1000
      ).toISOString(),
      clientData: {
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
      },
    };

    await setToken({
        accessToken: REFRESHED_TOKEN.accessToken,
        refreshToken: REFRESHED_TOKEN.refreshToken,
        expiryDate: REFRESHED_TOKEN.expiryDate
    });
}