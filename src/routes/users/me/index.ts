import type { FastifyPluginAsync } from "fastify";
import { Type } from "@sinclair/typebox";

const routes: FastifyPluginAsync = async (server) => {
  server.get(
    "/",
    {
      onRequest: [server.authenticate],
      schema: {
        description: "Get current user profile",
        summary: "getMe",
        operationId: "getMe",
        tags: ["users"],
        response: {
          200: Type.Object({
            userId: Type.String(),
            discordId: Type.String(),
            username: Type.String(),
            avatar: Type.Optional(Type.String()),
          }),
        },
      },
    },
    async (request, reply) => {
      const users = server.mongo.client.db("dark").collection("users");
      const userId = (request.user as any)?.userId as string;
      const doc = await users.findOne({ _id: new server.mongo.ObjectId(userId) });
      if (!doc) {
        return reply.code(404).send();
      }
      return reply.code(200).send({
        userId: doc._id.toString(),
        discordId: doc.discordId,
        username: doc.username,
        avatar: doc.avatar,
      });
    },
  );

  server.get(
    "/configs",
    {
      onRequest: [server.authenticate],
      schema: {
        description: "List configs of current user",
        summary: "getMyConfigs",
        operationId: "getMyConfigs",
        tags: ["users"],
        response: {
          200: Type.Array(
            Type.Object({
              configId: Type.String(),
              name: Type.String(),
              description: Type.Optional(Type.String()),
              karma: Type.Integer(),
              downloads: Type.Integer(),
              features: Type.Array(Type.String()),
              hidden: Type.Optional(Type.Boolean()),
            }),
          ),
        },
      },
    },
    async (request, reply) => {
      const configs = server.mongo.client.db("dark").collection("configs");
      const userId = (request.user as any)?.userId as string;
      const cursor = configs
        .find(
          { ownerId: new server.mongo.ObjectId(userId) },
          {
            projection: {
              _id: 1,
              name: 1,
              description: 1,
              karma: 1,
              downloads: 1,
              features: 1,
              hidden: 1,
            },
          },
        )
        .sort({ _id: -1 });
      const items = await cursor.toArray();
      const result = [] as any[];
      for (const item of items) {
        result.push({
          configId: item._id.toString(),
          name: item.name,
          description: item.description,
          karma: item.karma,
          downloads: item.downloads,
          features: item.features,
          hidden: item.hidden,
        });
      }
      return reply.code(200).send(result);
    },
  );
};

export default routes;
