import { RequestGenericInterface } from 'fastify';

export interface UploadConfigRequest extends RequestGenericInterface {
  Body: {
    name: string;
    description?: string;
    config: object;
    hidden?: boolean;
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

export interface UpdateKarmaRequest extends RequestGenericInterface {
  Params: {
    configid: string;
  };
  Querystring: {
    vote: string;
  }
}

export enum TypeKarmaVote {
  UP = "UP",
  DOWN = "DOWN"
}