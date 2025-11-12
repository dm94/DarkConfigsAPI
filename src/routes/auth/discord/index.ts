import type { FastifyPluginAsync } from "fastify";
import { randomUUID } from "node:crypto";

const routes: FastifyPluginAsync = async (server) => {
  server.get(
    "/",
    {
      schema: {
        description: "Start Discord OAuth",
        summary: "discordAuth",
        operationId: "discordAuth",
        tags: ["auth"],
        response: { 302: { type: "null" } },
      },
    },
    async (_request, reply) => {
      const state = await server.jwt.sign({ n: randomUUID() }, { expiresIn: "10m" });
      const params = new URLSearchParams({
        client_id: server.config.DISCORD_CLIENT_ID,
        redirect_uri: server.config.DISCORD_REDIRECT_URI,
        response_type: "code",
        scope: "identify",
        state,
      });
      const url = `https://discord.com/oauth2/authorize?${params.toString()}`;
      return reply.redirect(url);
    },
  );

  server.get(
    "/callback",
    {
      schema: {
        description: "Discord OAuth callback",
        summary: "discordCallback",
        operationId: "discordCallback",
        tags: ["auth"],
        querystring: {
          type: "object",
          required: ["code", "state"],
          properties: {
            code: { type: "string" },
            state: { type: "string" },
          },
        },
        response: { 400: { type: { message: "string" } }, 503: { type: { message: "string" } } },
      },
    },
    async (request, reply) => {
      try {
        const { code, state } = request.query as { code: string; state: string };
        await server.jwt.verify(state);

        const body = new URLSearchParams({
          client_id: server.config.DISCORD_CLIENT_ID,
          client_secret: server.config.DISCORD_CLIENT_SECRET,
          grant_type: "authorization_code",
          code,
          redirect_uri: server.config.DISCORD_REDIRECT_URI,
        });

        const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body,
        });
        if (!tokenRes.ok) {
          return reply.code(400).send({ message: "OAuth token error" });
        }
        const tokenJson = (await tokenRes.json()) as { access_token: string };

        const userRes = await fetch("https://discord.com/api/users/@me", {
          headers: { Authorization: `Bearer ${tokenJson.access_token}` },
        });
        if (!userRes.ok) {
          return reply.code(400).send({ message: "Discord user error" });
        }
        const discordUser = (await userRes.json()) as {
          id: string;
          username: string;
          avatar?: string;
        };

        const users = server.mongo.client.db("dark").collection("users");
        const upsert = await users.findOneAndUpdate(
          { discordId: discordUser.id },
          {
            $set: {
              discordId: discordUser.id,
              username: discordUser.username,
              avatar: discordUser.avatar,
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

        const redirectUrl = `${server.config.WEB_APP_URL}/auth/callback?token=${encodeURIComponent(
          token,
        )}`;
        return reply.redirect(redirectUrl);
      } catch {
        return reply.code(400).send({ message: "OAuth validation error" });
      }
    },
  );
};

export default routes;
