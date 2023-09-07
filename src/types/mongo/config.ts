import { ConfigFile } from "../configfile";

export type ConfigDTO = {
  id?: string;
  name: string;
  description?: string;
  karma: number;
  downloads: number;
  features: string[];
  config: ConfigFile;
}