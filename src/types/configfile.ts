import { Type } from "@sinclair/typebox";

export type PluginInfo = {
  DISABLED_FEATURES?: string[];
  ENABLED_FEATURES?:  string[];
}

export interface BotGUI {
  LOCALE?:            string;
  CONFIRM_EXIT?:      boolean;
  SAVE_GUI_POS?:      boolean;
  BUTTON_SIZE?:       number;
  ALWAYS_ON_TOP?:     boolean;
  MAIN_GUI_WINDOW?:   any;
  CONFIG_GUI_WINDOW?: any;
  CONFIG_LEVEL?:      string;
}

export type BotSettings = {
  BOT_GUI?:           BotGUI;
  API_CONFIG?:        any;
  MAP_DISPLAY?:       any;
  CUSTOM_BACKGROUND?: any;
  OTHER?:             any;
}

export type ConfigFile = {
  AVOIDED?: any;
  PREFERRED?: any;
  SAFETY?: any;
  PLAYER_INFOS?: any;
  PLAYER_TAGS?: string[];
  CUSTOM_CONFIGS?: any;
  PLUGIN_INFOS?: { 
    [key: string]: PluginInfo 
  };
  GENERAL?: any;
  COLLECT?: any;
  LOOT?: any;
  PET?: any;
  GROUP?: any;
  MISCELLANEOUS?: any;
  BOT_SETTINGS?: BotSettings;
  EXTRA?: any;
}

export const ConfigFileSchema = Type.Object({
  AVOIDED: Type.Optional(Type.Any()),
  PREFERRED: Type.Optional(Type.Any()),
  SAFETY: Type.Optional(Type.Any()),
  PLAYER_INFOS: Type.Optional(Type.Any()),
  PLAYER_TAGS: Type.Optional(Type.Any()),
  CUSTOM_CONFIGS: Type.Optional(Type.Any()),
  PLUGIN_INFOS: Type.Optional(Type.Any()),
  GENERAL: Type.Optional(Type.Any()),
  COLLECT: Type.Optional(Type.Any()),
  LOOT: Type.Optional(Type.Any()),
  PET: Type.Optional(Type.Any()),
  GROUP: Type.Optional(Type.Any()),
  MISCELLANEOUS: Type.Optional(Type.Any()),
  BOT_SETTINGS: Type.Optional(Type.Any()),
  EXTRA: Type.Optional(Type.Any()),
  UNRESOLVED: Type.Optional(Type.Any()),
});