import { getAccessToken, getUser } from "@/services/DiscordAPI";
import type { FastifyPluginAsync } from "fastify";

const routes: FastifyPluginAsync = async (server) => {
  server.post(
    "/",
    {
      schema: {
        description: "Discord OAuth callback",
        summary: "discordCallback",
        operationId: "discordCallback",
        tags: ["auth"],
        body: {
          type: "object",
          required: ["code"],
          properties: {
            code: { type: "string" },
          },
        },
        response: {
          202: {
            type: "object",
            required: ["discordid", "token"],
            properties: {
              discordid: { type: "string" },
              token: { type: "string" },
            },
          },
          400: {
            type: "object",
            required: ["message"],
            properties: { message: { type: "string" } },
          },
          503: {
            type: "object",
            required: ["message"],
            properties: { message: { type: "string" } },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { code } = request.body as { code: string };

        const accessToken = await getAccessToken(code);

        if (!accessToken?.access_token) {
          return reply.code(400).send({ message: "Invalid OAuth code" });
        }

        const user = await getUser(accessToken.access_token);
        if (!user) {
          return reply.code(400).send({ message: "Invalid OAuth code" });
        }

        const username = `${user.username}#${user.discriminator}`;
        const discordId = user.id;

        const discordUser = {
          id: discordId,
          username,
        };

        const users = server.mongo.client.db("dark").collection("users");
        const upsert = await users.findOneAndUpdate(
          { discordId: discordUser.id },
          {
            $set: {
              discordId: discordUser.id,
              username: discordUser.username,
            },
            $setOnInsert: { createdAt: new Date() },
          },
          { upsert: true, returnDocument: "after" },
        );

        const userDoc = upsert?.value ?? (await users.findOne({ discordId: discordUser.id }));
        if (!userDoc?._id) {
          return reply.code(503).send({ message: "User upsert error" });
        }

        const token = await server.jwt.sign(
          {
            userId: userDoc._id.toString(),
            discordId: discordUser.id,
            username: discordUser.username,
          },
          { expiresIn: "2h" },
        );

        return reply.code(202).send({
          discordid: discordId,
          token: token,
        });
      } catch {
        return reply.code(400).send({ message: "OAuth validation error" });
      }
    },
  );
};

export default routes;
