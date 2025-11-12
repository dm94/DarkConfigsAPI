import type { ConfigFile } from "../configfile";

export type ConfigDTO = {
  id?: string;
  ownerId?: string;
  name: string;
  description?: string;
  karma: number;
  downloads: number;
  features: string[];
  config: ConfigFile;
  hidden?: boolean;
};
