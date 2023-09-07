import { ConfigFile } from '@/types/configfile';
import { ConfigDTO } from '@/types/mongo/config';
import { GetConfigsRequest, UploadConfigRequest } from '@/types/requests/configs';
import { cleanConfig, getEnabledFeatures } from '@/utils/configcleaner';
import { Type } from '@sinclair/typebox';
import { FastifyPluginAsync } from 'fastify';
import { ConfigInfo, ConfigInfoSchema } from 'types/configinfo';

const routes: FastifyPluginAsync = async (server) => {
  server.get<GetConfigsRequest, { Reply: ConfigInfo[] }>(
    '/',
    {
      schema: {
        description: 'Return the list of the config',
        summary: 'getConfigs',
        operationId: 'getConfigs',
        tags: ['configs'],
        querystring: {
          type: 'object',
          required: [],
          properties: {
            size: {
              type: 'integer',
              default: 10,
            },
            page: {
              type: 'integer',
              default: 1,
            },
            search: {
              type: 'string',
              description: 'Search by name, description or feature',
            },
          },
        },
        response: {
          200: Type.Array(ConfigInfoSchema),
        },
      },
    },
    async (request, reply) => {
      try {
        const configCollection = server.mongo.client.db('dark').collection('configs');

        /* Use the query params */

        const data = await configCollection
        .find({}, { projection: { _id: 1, name: 1, description: 1, karma: 1, downloads: 1, features: 1 } })
        .toArray();

        const response: ConfigInfo[] = data.map((item) => {
          return {
            configId: item._id.toString(),
            name: item.name,
            description: item.description,
            karma: item.karma,
            downloads: item.downloads,
            features: item.features,
          }
        });

        return reply.code(200).send(response);
      } catch {
        return reply.code(503).send();
      }
    },
  );
  server.post<UploadConfigRequest, { Reply: ConfigInfo }>(
    '/',
    {
      schema: {
        description: 'Add a new config',
        summary: 'uploadConfigFile',
        operationId: 'uploadConfigFile',
        tags: ['configs'],
        body: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              config: { type: "object" },
            },
        },
        response: {
          201: ConfigInfoSchema,
        },
      },
    },
    async (request, reply) => {
      if (!request?.body) {
        return reply.code(400).send();
      }

      try {
        const config = request.body.config as ConfigFile;

        const configCleaned = cleanConfig(config);

        const dataToUpload: ConfigDTO = {
          name: request.body.name ?? "",
          description: request.body.description ?? "",
          karma: 0,
          downloads: 0,
          features: getEnabledFeatures(configCleaned),
          config: configCleaned,
        }

        const configCollection = server.mongo.client.db('dark').collection('configs');
        const result = await configCollection.insertOne(dataToUpload);

        return reply.code(201).send({
          configId: result.insertedId.toString(), 
          name: dataToUpload.name,
          description: dataToUpload.description,
          karma: dataToUpload.karma,
          downloads: dataToUpload.downloads,
          features:  dataToUpload.features
        });
      } catch {
        return reply.code(503).send();
      }
    },
  );
};

export default routes;
