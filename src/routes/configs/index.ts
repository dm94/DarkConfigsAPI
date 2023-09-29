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

        let limit = 10;
        const MAX_LIMIT = 20;
        let page = 0;

        if (request.query.size) {
          limit = request.query.size;
        }
        if (limit > MAX_LIMIT) {
          limit = MAX_LIMIT;
        }

        if (request.query.page) {
          page = request.query.page;
        }

        if (page > 0) {
          page = page - 1;
        }

        const filterQuery = {};
        if (request.query.search) {
          filterQuery["$text"] = { $search: request.query.search }
        }

        const data = await configCollection
        .find(filterQuery, { projection: { _id: 1, name: 1, description: 1, karma: 1, downloads: 1, features: 1 } }).skip(page * limit).limit(limit).sort( { karma: -1 } )
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
      } catch (error) {
        console.log(error);
        return reply.code(503).send({
          message: "Error: Internal error"
        });
      }
    },
  );
  server.post<UploadConfigRequest>(
    '/',
    {
      config: {
        rateLimit: {
          max: 2,
          timeWindow: '1 minute'
        }
      },
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
        return reply.code(400).send({
          message: "Missing valid config"
        });
      }

      try {
        const config = request.body.config as ConfigFile;

        const configCleaned = cleanConfig(config);

        if (!configCleaned || Object.keys(configCleaned).length <= 3) {
          return reply.code(400).send({
            message: "Missing valid config"
          });
        }

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
        return reply.code(503).send({
          message: "Error: Internal error"
        });
      }
    },
  );
};

export default routes;
