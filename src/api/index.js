import { MongoClient, ServerApiVersion } from "mongodb";

export const databaseName = "samtaegi";

/**
 * 
 * @param {MongoClient} client 
 */
export async function checkMongoDBConnection(client) {
    try {
        await client.connect();
        await client.db("admin").command({ ping: 1 });
        console.log("Connected to MongoDB");
    } catch (err) {
        console.error(err);
    }
}

