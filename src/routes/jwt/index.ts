import { Type } from '@sinclair/typebox';
import { FastifyPluginAsync } from 'fastify';

const routes: FastifyPluginAsync = async (server) => {
  server.get(
    '/',
    {
      onRequest: [server.authenticate],
      schema: {
        description: 'Example with JWT',
        operationId: 'authenticate',
        summary: 'authenticate',
        tags: ['examples'],
        response: {
          200: Type.Object({
            hello: Type.String(),
          }),
        },
      },
    },
    async function () {
      return { hello: 'world' };
    },
  );
};

export default routes;
