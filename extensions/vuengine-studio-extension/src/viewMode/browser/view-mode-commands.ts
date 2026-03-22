import { Command } from '@theia/core';
import { VIEW_MODE_ICONS, ViewMode } from './view-mode-types';

export namespace ViewModeCommands {
  export const CHANGE_VIEW_MODE: Command = Command.toLocalizedCommand(
    {
      id: 'viewMode.changeViewMode',
      label: 'Change View Mode',
      category: 'View Mode',
    },
    'vuengine/viewMode/commands/changeViewMode',
    'vuengine/viewMode/commands/category',
  );
  export const SWITCH_TO_ACTORS_VIEW_MODE: Command = Command.toLocalizedCommand(
    {
      id: 'viewMode.switchToActorsViewMode',
      label: 'Switch To Actors View Mode',
      iconClass: VIEW_MODE_ICONS[ViewMode.actors],
      category: 'View Mode',
    },
    'vuengine/viewMode/commands/switchToActorsViewMode',
    'vuengine/viewMode/commands/category',
  );
  export const SWITCH_TO_ASSETS_VIEW_MODE: Command = Command.toLocalizedCommand(
    {
      id: 'viewMode.switchToAssetsViewMode',
      label: 'Switch To Assets View Mode',
      iconClass: VIEW_MODE_ICONS[ViewMode.assets],
      category: 'View Mode',
    },
    'vuengine/viewMode/commands/switchToAssetsViewMode',
    'vuengine/viewMode/commands/category',
  );
  export const SWITCH_TO_BUILD_VIEW_MODE: Command = Command.toLocalizedCommand(
    {
      id: 'viewMode.switchToBuildViewMode',
      label: 'Switch To Build View Mode',
      iconClass: VIEW_MODE_ICONS[ViewMode.build],
      category: 'View Mode',
    },
    'vuengine/viewMode/commands/switchToBuildViewMode',
    'vuengine/viewMode/commands/category',
  );
  export const SWITCH_TO_EMULATOR_VIEW_MODE: Command = Command.toLocalizedCommand(
    {
      id: 'viewMode.switchToEmulatorViewMode',
      label: 'Switch To Emulator View Mode',
      iconClass: VIEW_MODE_ICONS[ViewMode.emulator],
      category: 'View Mode',
    },
    'vuengine/viewMode/commands/switchToEmulatorViewMode',
    'vuengine/viewMode/commands/category',
  );
  export const SWITCH_TO_FLASH_CARTS_VIEW_MODE: Command = Command.toLocalizedCommand(
    {
      id: 'viewMode.switchToFlashCartsViewMode',
      label: 'Switch To FlashCarts View Mode',
      iconClass: VIEW_MODE_ICONS[ViewMode.flashCarts],
      category: 'View Mode',
    },
    'vuengine/viewMode/commands/switchToFlashCartsViewMode',
    'vuengine/viewMode/commands/category',
  );
  export const SWITCH_TO_FONTS_VIEW_MODE: Command = Command.toLocalizedCommand(
    {
      id: 'viewMode.switchToFontsViewMode',
      label: 'Switch To Fonts View Mode',
      iconClass: VIEW_MODE_ICONS[ViewMode.fonts],
      category: 'View Mode',
    },
    'vuengine/viewMode/commands/switchToFontsViewMode',
    'vuengine/viewMode/commands/category',
  );
  export const SWITCH_TO_LOCALIZATION_VIEW_MODE: Command = Command.toLocalizedCommand(
    {
      id: 'viewMode.switchToLocalizationViewMode',
      label: 'Switch To Localization View Mode',
      iconClass: VIEW_MODE_ICONS[ViewMode.localization],
      category: 'View Mode',
    },
    'vuengine/viewMode/commands/switchToLocalizationViewMode',
    'vuengine/viewMode/commands/category',
  );
  export const SWITCH_TO_LOGIC_VIEW_MODE: Command = Command.toLocalizedCommand(
    {
      id: 'viewMode.switchToLogicViewMode',
      label: 'Switch To Logic View Mode',
      iconClass: VIEW_MODE_ICONS[ViewMode.logic],
      category: 'View Mode',
    },
    'vuengine/viewMode/commands/switchToLogicViewMode',
    'vuengine/viewMode/commands/category',
  );
  export const SWITCH_TO_SETTINGS_VIEW_MODE: Command = Command.toLocalizedCommand(
    {
      id: 'viewMode.switchToSettingsViewMode',
      label: 'Switch To Settings View Mode',
      iconClass: VIEW_MODE_ICONS[ViewMode.settings],
      category: 'View Mode',
    },
    'vuengine/viewMode/commands/switchToSettingsViewMode',
    'vuengine/viewMode/commands/category',
  );
  export const SWITCH_TO_SOUND_VIEW_MODE: Command = Command.toLocalizedCommand(
    {
      id: 'viewMode.switchToSoundViewMode',
      label: 'Switch To Sound View Mode',
      iconClass: VIEW_MODE_ICONS[ViewMode.sound],
      category: 'View Mode',
    },
    'vuengine/viewMode/commands/switchToSoundViewMode',
    'vuengine/viewMode/commands/category',
  );
  export const SWITCH_TO_SOURCE_CODE_VIEW_MODE: Command = Command.toLocalizedCommand(
    {
      id: 'viewMode.switchToSourceCodeViewMode',
      label: 'Switch To Source Code View Mode',
      iconClass: VIEW_MODE_ICONS[ViewMode.sourceCode],
      category: 'View Mode',
    },
    'vuengine/viewMode/commands/switchToSourceCodeViewMode',
    'vuengine/viewMode/commands/category',
  );
  export const SWITCH_TO_STAGES_VIEW_MODE: Command = Command.toLocalizedCommand(
    {
      id: 'viewMode.switchToStagesViewMode',
      label: 'Switch To Stages View Mode',
      iconClass: VIEW_MODE_ICONS[ViewMode.stages],
      category: 'View Mode',
    },
    'vuengine/viewMode/commands/switchToStagesViewMode',
    'vuengine/viewMode/commands/category',
  );
};
