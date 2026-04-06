import { nls } from '@theia/core';
import { ActorType } from '../../project/browser/types/Actor';
import { FontType } from '../../project/browser/types/Font';
import { LogicType } from '../../project/browser/types/Logic';
import { SoundType } from '../../project/browser/types/Sound';
import { TranslationsType } from '../../project/browser/types/Translations';

export enum ViewMode {
    actors = 'actors',
    assets = 'assets',
    build = 'build',
    fonts = 'fonts',
    localization = 'localization',
    logic = 'logic',
    sound = 'sound',
    settings = 'settings',
    sourceCode = 'sourceCode',
    stages = 'stages',
    welcome = 'welcome',
}

export const DEFAULT_VIEW_MODE = ViewMode.stages;
export const LAST_VIEW_MODE_LOCAL_STORAGE_KEY = 'vuengine-last-view-mode';

export const DISABLED_VIEW_MODES: ViewMode[] = [
    // ViewMode.logic,
    // ViewMode.stages,
];

export const VIEW_MODE_LABELS: { [viewMode: string]: string } = {
    [ViewMode.actors]: nls.localize('vuengine/general/viewModes/actors', 'Actors'),
    [ViewMode.assets]: nls.localize('vuengine/general/viewModes/assets', 'Other Assets'),
    [ViewMode.build]: nls.localize('vuengine/general/viewModes/build', 'Build & Run'),
    [ViewMode.fonts]: nls.localize('vuengine/general/viewModes/fonts', 'Fonts'),
    [ViewMode.localization]: nls.localize('vuengine/general/viewModes/localization', 'Localization'),
    [ViewMode.logic]: nls.localize('vuengine/general/viewModes/logic', 'Logic'),
    [ViewMode.sound]: nls.localize('vuengine/general/viewModes/sound', 'Sound'),
    [ViewMode.settings]: nls.localize('vuengine/general/viewModes/settings', 'Settings'),
    [ViewMode.sourceCode]: nls.localize('vuengine/general/viewModes/sourceCode', 'Source Code'),
    [ViewMode.stages]: nls.localize('vuengine/general/viewModes/stages', 'Game World'),
};

export const VIEW_MODE_ICONS: { [viewMode: string]: string } = {
    [ViewMode.actors]: ActorType.icon ?? '',
    [ViewMode.assets]: 'codicon codicon-library',
    [ViewMode.build]: 'codicon codicon-symbol-property',
    [ViewMode.fonts]: FontType.icon ?? '',
    [ViewMode.localization]: TranslationsType.icon ?? '',
    [ViewMode.logic]: LogicType.icon ?? '',
    [ViewMode.sound]: SoundType.icon ?? '',
    [ViewMode.settings]: 'codicon codicon-settings',
    [ViewMode.sourceCode]: 'codicon codicon-code',
    [ViewMode.stages]: 'codicon codicon-globe',
};

export const TYPE_VIEW_MODE_RELATIONS: { [typeId: string]: ViewMode } = {
    'Actor': ViewMode.actors,
    'BrightnessRepeat': ViewMode.assets,
    'ColumnTable': ViewMode.assets,
    'GameConfig': ViewMode.settings,
    'Font': ViewMode.fonts,
    'Image': ViewMode.actors,
    'Logic': ViewMode.logic,
    'Pixel': ViewMode.actors,
    'RumbleEffect': ViewMode.assets,
    'Sound': ViewMode.sound,
    'Stage': ViewMode.stages,
    'Translations': ViewMode.localization,
};
