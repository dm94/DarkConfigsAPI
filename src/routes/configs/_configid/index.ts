import { ConfigFileSchema } from '@/types/configfile';
import type { FastifyPluginAsync } from 'fastify';
import { type ConfigInfo, ConfigInfoSchema } from '@/types/configinfo';
import { cleanConfig } from '@/utils/configcleaner';
import { type GetConfigRequest, TypeKarmaVote, type UpdateKarmaRequest } from '@/types/requests/configs';
import { addDownloads } from '@/services/adddownload';
import { Type } from '@sinclair/typebox';

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
            features: configInfo.features
          });
        }

        return reply.code(404).send();
      } catch (error) {
        console.log(error);
        return reply.code(503).send({
          message: "Error: Internal error"
        });
      }
    },
  );
  server.get<GetConfigRequest>(
    '/download',
    {
      config: {
        rateLimit: {
          max: 5,
          timeWindow: '1 minute'
        }
      },
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
        return reply.code(400).send({
          message: "Missing Config ID"
        });
      }

      try {
        const configCollection = server.mongo.client.db('dark').collection('configs');
        const idConfig = new server.mongo.ObjectId(request.params.configid);

        const configInfo = await configCollection.findOne({ _id: idConfig }, { projection: { config: 1 } });

        if (configInfo?.config) {
          const configCleaned = cleanConfig(configInfo.config);

          return reply.code(200).send(configCleaned);
        }

        return reply.code(404).send({
          message: "Error: Config not found"
        });
      } catch (error) {
        console.log(error);
        return reply.code(503).send({
          message: "Error: Internal error"
        });
      }
    },
  );
  server.post<UpdateKarmaRequest>(
    '/vote',
    {
      config: {
        rateLimit: {
          max: 1,
          timeWindow: '12 hours'
        }
      },
      schema: {
        description: 'Update the config karma',
        summary: 'updateKarma',
        operationId: 'updateKarma',
        tags: ['configs'],
        params: {
            type: 'object',
            properties: {
              configid: { type: 'string' },
            },
        },
        querystring: {
          type: 'object',
          required: ["vote"],
          properties: {
            vote: {
              type: 'string',
              enum: Object.values(TypeKarmaVote)
            },
          },
        },
        response: {
          200: Type.Object({}),
        },
      },
    },
    async (request, reply) => {
      if (!request.params.configid) {
        return reply.code(400).send({
          message: "Error: Missing Config ID"
        });
      }

      if (request.query.vote !== TypeKarmaVote.DOWN && request.query.vote !== TypeKarmaVote.UP) {
        return reply.code(400).send({
          message: "Error: Incorrect type"
        });
      }

      try {
        const configCollection = server.mongo.client.db('dark').collection('configs');
        const idConfig = new server.mongo.ObjectId(request.params.configid);

        let karma = 0;
        const configInfo = await configCollection.findOne({ _id: idConfig }, { projection: { karma: 1 } });

        if (configInfo) {
          karma = configInfo.karma;
          if (request.query.vote === TypeKarmaVote.DOWN) {
            await configCollection.updateOne({ _id: idConfig }, {$set: {
              karma: karma - 1,
            }}, { upsert: true });
          } else if (request.query.vote === TypeKarmaVote.UP) {
            await configCollection.updateOne({ _id: idConfig }, {$set: {
              karma: karma + 1,
            }}, { upsert: true });
          }
          return reply.code(200).send({});
        }
        
        return reply.code(400).send({
          message: "Error: Config not found"
        });
      } catch (error) {
        console.log(error);
        return reply.code(503).send({
          message: "Error: Internal error"
        });
      }
    },
  );
};

export default routes;
