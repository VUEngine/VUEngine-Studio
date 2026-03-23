import { nls } from '@theia/core';
import { ActorType } from '../../project/browser/types/Actor';
import { FontType } from '../../project/browser/types/Font';
import { LogicType } from '../../project/browser/types/Logic';
import { SoundType } from '../../project/browser/types/Sound';
import { StageType } from '../../project/browser/types/Stage';
import { TranslationsType } from '../../project/browser/types/Translations';

export enum ViewMode {
    actors = 'actors',
    assets = 'assets',
    build = 'build',
    emulator = 'emulator',
    flashCarts = 'flashCarts',
    fonts = 'fonts',
    logic = 'logic',
    sound = 'sound',
    settings = 'settings',
    sourceCode = 'sourceCode',
    stages = 'stages',
    localization = 'localization',
}

export const DISABLED_VIEW_MODES: ViewMode[] = [
    // ViewMode.logic,
    // ViewMode.stages,
];

export const VIEW_MODE_LABELS: { [viewMode: string]: string } = {
    [ViewMode.actors]: nls.localize('vuengine/general/viewModes/actors', 'Actors'),
    [ViewMode.assets]: nls.localize('vuengine/general/viewModes/assets', 'Other Assets'),
    [ViewMode.build]: nls.localize('vuengine/general/viewModes/build', 'Build'),
    [ViewMode.emulator]: nls.localize('vuengine/general/viewModes/emulator', 'Emulator'),
    [ViewMode.fonts]: nls.localize('vuengine/general/viewModes/fonts', 'Fonts'),
    [ViewMode.flashCarts]: nls.localize('vuengine/general/viewModes/flashCarts', 'Flash Carts'),
    [ViewMode.localization]: nls.localize('vuengine/general/viewModes/localization', 'Localization'),
    [ViewMode.logic]: nls.localize('vuengine/general/viewModes/logic', 'Logic'),
    [ViewMode.sound]: nls.localize('vuengine/general/viewModes/sound', 'Sound'),
    [ViewMode.settings]: nls.localize('vuengine/general/viewModes/settings', 'Settings'),
    [ViewMode.sourceCode]: nls.localize('vuengine/general/viewModes/sourceCode', 'Source Code'),
    [ViewMode.stages]: nls.localize('vuengine/general/viewModes/stages', 'Stages'),
};

export const VIEW_MODE_ICONS: { [viewMode: string]: string } = {
    [ViewMode.actors]: ActorType.icon ?? '',
    [ViewMode.assets]: 'codicon codicon-library',
    [ViewMode.build]: 'codicon codicon-symbol-property',
    [ViewMode.emulator]: 'codicon codicon-run',
    [ViewMode.flashCarts]: 'codicon codicon-chip',
    [ViewMode.fonts]: FontType.icon ?? '',
    [ViewMode.localization]: TranslationsType.icon ?? '',
    [ViewMode.logic]: LogicType.icon ?? '',
    [ViewMode.sound]: SoundType.icon ?? '',
    [ViewMode.settings]: 'codicon codicon-settings',
    [ViewMode.sourceCode]: 'codicon codicon-code',
    [ViewMode.stages]: StageType.icon ?? '',
};

export const TYPE_VIEW_MODE_RELATIONS: { [typeId: string]: ViewMode } = {
    'Actor': ViewMode.actors,
    'BrightnessRepeat': ViewMode.assets,
    'ColliderLayers': ViewMode.settings,
    'ColumnTable': ViewMode.assets,
    'CompilerConfig': ViewMode.settings,
    'EngineConfig': ViewMode.settings,
    'InGameTypes': ViewMode.settings,
    'Events': ViewMode.settings,
    'Font': ViewMode.fonts,
    'Image': ViewMode.actors,
    'Logic': ViewMode.logic,
    'Messages': ViewMode.settings,
    'Pixel': ViewMode.actors,
    'RomInfo': ViewMode.settings,
    'RumbleEffect': ViewMode.assets,
    'Sound': ViewMode.sound,
    'Stage': ViewMode.stages,
    'Translations': ViewMode.localization,
};

export const DEFAULT_VIEW_MODE = ViewMode.sourceCode;
export const LAST_VIEW_MODE_LOCAL_STORAGE_KEY = 'vuengine-last-view-mode';
