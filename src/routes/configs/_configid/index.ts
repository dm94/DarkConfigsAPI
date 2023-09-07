import { ConfigFile, ConfigFileSchema } from '@/types/configfile';
import { FastifyPluginAsync } from 'fastify';
import { ConfigInfo, ConfigInfoSchema } from '@/types/configinfo';
import { exampleConfig } from '@/utils/example';
import { cleanConfig } from '@/utils/configcleaner';
import { GetConfigRequest } from '@/types/requests/configs';

const routes: FastifyPluginAsync = async (server) => {
  server.get<GetConfigRequest, { Reply: ConfigInfo }>(
    '/',
    {
      schema: {
        description: 'Return the config',
        summary: 'getConfig',
        operationId: 'getConfig',
        tags: ['configs'],
        params: {
            type: 'object',
            properties: {
              configid: { type: 'string' },
            },
        },
        response: {
          200: ConfigInfoSchema,
        },
      },
    },
    async (request, reply) => {
      return reply.code(200).send({
        configId: "dfs3w4r",
        name: "Pala",
        description: "Para paladio",
        karma: 10,
        downloads: 100,
        features: [
          "PalladiumModule",
          "DefenseModule"
        ]
      });
    },
  );
  server.get<GetConfigRequest, { Reply: ConfigFile }>(
    '/download',
    {
      schema: {
        description: 'Return the config file',
        summary: 'getConfigFile',
        operationId: 'getConfigFile',
        tags: ['configs'],
        params: {
            type: 'object',
            properties: {
              configid: { type: 'string' },
            },
        },
        response: {
          200: ConfigFileSchema,
        },
      },
    },
    async (request, reply) => {
      return reply.code(200).send(cleanConfig(exampleConfig));
    },
  );
};

export default routes;
