import { ActorImageDataTemplate } from './template/ActorImageData';
import { ActorSpecTemplate } from './template/ActorSpec';
import { BrightnessRepeatSpecTemplate } from './template/BrightnessRepeatSpec';
import { ColliderLayersTemplate } from './template/ColliderLayers';
import { ColumnTableSpecTemplate } from './template/ColumnTableSpec';
import { ConfigTemplate } from './template/Config';
import { ConfigMakeTemplate } from './template/ConfigMake';
import { FontsCTemplate } from './template/FontsC';
import { FontsHTemplate } from './template/FontsH';
import { FontSpecTemplate } from './template/FontSpec';
import { GameEventsTemplate } from './template/GameEvents';
import { ImageTemplate } from './template/Image';
import { InGameTypesTemplate } from './template/InGameTypes';
import { LanguagesCTemplate } from './template/LanguagesC';
import { LanguagesHTemplate } from './template/LanguagesH';
import { MessagesTemplate } from './template/Messages';
import { PluginConfigTemplate } from './template/PluginConfig';
import { PluginConfigMakeTemplate } from './template/PluginConfigMake';
import { PluginsConfigTemplate } from './template/PluginsConfig';
import { RomInfoTemplate } from './template/RomInfo';
import { RumbleEffectsTemplate } from './template/RumbleEffects';
import { RumbleEffectSpecTemplate } from './template/RumbleEffectSpec';
import { SoundSpecTemplate } from './template/SoundSpec';
import { vbLdTemplate } from './template/vbLd';
import { vbToolsLdTemplate } from './template/vbToolsLd';
import { ActorType } from './types/Actor';
import { BrightnessRepeatType } from './types/BrightnessRepeat';
import { ColliderLayersType } from './types/ColliderLayers';
import { ColumnTableType } from './types/ColumnTable';
import { CompilerConfigType } from './types/CompilerConfig';
import { EngineConfigType } from './types/EngineConfig';
import { EventsType } from './types/Events';
import { FontType } from './types/Font';
import { GameConfigType } from './types/GameConfig';
import { ImageType } from './types/Image';
import { InGameTypesType } from './types/InGameTypes';
import { LogicType } from './types/Logic';
import { MessagesType } from './types/Messages';
import { PixelType } from './types/Pixel';
import { PluginFileType } from './types/PluginFile';
import { RomInfoType } from './types/RomInfo';
import { RumbleEffectType } from './types/RumbleEffect';
import { SoundType } from './types/Sound';
import { StageType } from './types/Stage';
import { TranslationsType } from './types/Translations';
import { ProjectDataTemplates, ProjectDataTypes } from './ves-project-types';

export const PROJECT_TEMPLATES: ProjectDataTemplates = {
  ActorImageData: ActorImageDataTemplate,
  ActorSpec: ActorSpecTemplate,
  BrightnessRepeatSpec: BrightnessRepeatSpecTemplate,
  ColliderLayers: ColliderLayersTemplate,
  ColumnTableSpec: ColumnTableSpecTemplate,
  Config: ConfigTemplate,
  ConfigMake: ConfigMakeTemplate,
  FontsC: FontsCTemplate,
  FontsH: FontsHTemplate,
  FontSpec: FontSpecTemplate,
  GameEvents: GameEventsTemplate,
  Image: ImageTemplate,
  InGameTypes: InGameTypesTemplate,
  LanguagesC: LanguagesCTemplate,
  LanguagesH: LanguagesHTemplate,
  Messages: MessagesTemplate,
  PluginConfig: PluginConfigTemplate,
  PluginConfigMake: PluginConfigMakeTemplate,
  PluginsConfig: PluginsConfigTemplate,
  RomInfo: RomInfoTemplate,
  RumbleEffects: RumbleEffectsTemplate,
  RumbleEffectSpec: RumbleEffectSpecTemplate,
  SoundSpec: SoundSpecTemplate,
  vbLd: vbLdTemplate,
  vbToolsLd: vbToolsLdTemplate,
};

export const PROJECT_TYPES: ProjectDataTypes = {
  Actor: ActorType,
  BrightnessRepeat: BrightnessRepeatType,
  ColliderLayers: ColliderLayersType,
  ColumnTable: ColumnTableType,
  CompilerConfig: CompilerConfigType,
  EngineConfig: EngineConfigType,
  Events: EventsType,
  Font: FontType,
  GameConfig: GameConfigType,
  Image: ImageType,
  InGameTypes: InGameTypesType,
  Logic: LogicType,
  Messages: MessagesType,
  Pixel: PixelType,
  PluginFile: PluginFileType,
  RomInfo: RomInfoType,
  RumbleEffect: RumbleEffectType,
  Sound: SoundType,
  Stage: StageType,
  Translations: TranslationsType,
};
