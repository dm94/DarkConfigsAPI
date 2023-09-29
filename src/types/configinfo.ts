import { Static, Type } from '@sinclair/typebox';

export const ConfigInfoSchema = Type.Object({
  configId: Type.Optional(Type.String()),
  name: Type.String(),
  description: Type.Optional(Type.String()),
  karma: Type.Integer(),
  downloads: Type.Integer(),
  features: Type.Array(Type.String()),
  hidden: Type.Optional(Type.Boolean()),
});

export type ConfigInfo = Static<typeof ConfigInfoSchema>;
