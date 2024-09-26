import { getMusicChannelCache } from "../api/music.js";
import {
  checkHasMusicQueue,
  getCurrentSong,
  queueList,
} from "../libs/music.js";

export async function getMusicQueueRouter(fastify, options) {
  fastify.get("/:guildId", async (request, reply) => {
    const { guildId } = request.params;
    const query = request.query;
    const page = query.page || 1;

    const validate = checkHasMusicQueue(guildId);

    if (!validate) {
      reply.code(404).send({ message: "No music queue found" });
      return;
    }

    const channel = getMusicChannelCache(guildId).channel;
    const currentSong = getCurrentSong(guildId);
    const queue = queueList(channel, page);
    reply.send({ currentSong, queue });
  });
}

export async function handleMusicFunctionRouter(fastify, options) {
  fastify.get("/function/:guildId", async (request, reply) => {
    const query = request.query;
    const type = query.type;

    switch (type) {
      case "play":
        break;
      case "pause":
        break;
      case "skip":
        break;
      case "stop":
        break;
      case "volume":
        break;
      case "loop":
        break;
      case "shuffle":
        break;
      case "queue":
        break;
      case "clear":
        break;
      default:
        reply.code(404).send({
          message:
            "No music function found. Type must be one of play, pause, skip, stop, volume, loop, shuffle, queue, clear",
        });
    }
  });
}
