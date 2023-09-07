import { RequestGenericInterface } from 'fastify';

export interface UploadConfigRequest extends RequestGenericInterface {
  Body: {
    name: string;
    description?: string;
    config: object;
  };
}

export interface GetConfigsRequest extends RequestGenericInterface {
  Querystring: {
    size?: number;
    page?: number;
    search?: string;
  };
}


export interface GetConfigRequest extends RequestGenericInterface {
  Params: {
    configid: string;
  };
}