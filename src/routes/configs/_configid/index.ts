import { ConfigFile, ConfigFileSchema } from '@/types/configfile';
import { FastifyPluginAsync } from 'fastify';
import { ConfigInfo, ConfigInfoSchema } from '@/types/configinfo';
import { cleanConfig } from '@/utils/configcleaner';
import { GetConfigRequest } from '@/types/requests/configs';
import { addDownloads } from '@/services/adddownload';

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
      if (!request.params.configid) {
        reply.code(400);
        return new Error('Missing Config ID');
      }

      try {
        const configCollection = server.mongo.client.db('dark').collection('configs');
        const idConfig = new server.mongo.ObjectId(request.params.configid);

        const configInfo = await configCollection.findOne({ _id: idConfig }, { projection: { _id: 1, name: 1, description: 1, karma: 1, downloads: 1, features: 1 } });

        if (configInfo) {
          return reply.code(200).send({
            configId: configInfo._id.toString(),
            name: configInfo.name,
            description: configInfo.description,
            karma: configInfo.karma,
            downloads: configInfo.downloads,
            features: configInfo.features,
          });
        } else {
          return reply.code(404).send();
        }

      } catch (error) {
        console.log(error);
        return reply.code(503).send();
      }
    },
  );
  server.get<GetConfigRequest, { Reply: ConfigFile }>(
    '/download',
    {
      onRequest: [ (request) => addDownloads(server, request)],
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
      if (!request.params.configid) {
        reply.code(400);
        return new Error('Missing Config ID');
      }

      try {
        const configCollection = server.mongo.client.db('dark').collection('configs');
        const idConfig = new server.mongo.ObjectId(request.params.configid);

        const configInfo = await configCollection.findOne({ _id: idConfig }, { projection: { config: 1 } });

        if (configInfo?.config) {
          const configCleaned = cleanConfig(configInfo.config);

          return reply.code(200).send(configCleaned);
        } else {
          return reply.code(404).send();
        }

      } catch (error) {
        console.log(error);
        return reply.code(503).send();
      }
    },
  );
};

export default routes;
