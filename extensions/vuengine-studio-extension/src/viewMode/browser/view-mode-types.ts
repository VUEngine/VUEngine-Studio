import { nls } from '@theia/core';
import { PROBLEMS_WIDGET_ID } from '@theia/markers/lib/browser/problem/problem-widget';
import { EXPLORER_VIEW_CONTAINER_ID } from '@theia/navigator/lib/browser/navigator-widget-factory';
import { OUTLINE_WIDGET_FACTORY_ID } from '@theia/outline-view/lib/browser/outline-view-contribution';
import { PreferencesSearchbarWidget } from '@theia/preferences/lib/browser/views/preference-searchbar-widget';
import { SCM_VIEW_CONTAINER_ID } from '@theia/scm/lib/browser/scm-contribution';
import { SEARCH_VIEW_CONTAINER_ID } from '@theia/search-in-workspace/lib/browser/search-in-workspace-factory';
import { VSXExtensionsViewContainer } from '@theia/vsx-registry/lib/browser/vsx-extensions-view-container';
import { VesBuildWidget } from '../../build/browser/ves-build-widget';
import { VesEditorsWidget } from '../../editors/browser/ves-editors-widget';
import { VesEmulatorSidebarWidget } from '../../emulator/browser/ves-emulator-sidebar-widget';
import { VesEmulatorWidget } from '../../emulator/browser/ves-emulator-widget';
import { VesFlashCartWidget } from '../../flash-cart/browser/ves-flash-cart-widget';
import { VesPluginsViewContainer } from '../../plugins/browser/ves-plugins-view-container';
import { ActorAssetsBrowserWidget } from '../../project/browser/assets-browser/actor-assets-browser-widget';
import { BrightnessRepeatAssetsBrowserWidget } from '../../project/browser/assets-browser/brightness-repeat-assets-browser-widget';
import { ColumnTableAssetsBrowserWidget } from '../../project/browser/assets-browser/column-table-assets-browser-widget';
import { FontAssetsBrowserWidget } from '../../project/browser/assets-browser/font-assets-browser-widget';
import { ImageAssetsBrowserWidget } from '../../project/browser/assets-browser/image-assets-browser-widget';
import { LogicAssetsBrowserWidget } from '../../project/browser/assets-browser/logic-assets-browser-widget';
import { RumbleEffectAssetsBrowserWidget } from '../../project/browser/assets-browser/rumble-effect-assets-browser-widget';
import { SoundAssetsBrowserWidget } from '../../project/browser/assets-browser/sound-assets-browser-widget';
import { StageAssetsBrowserWidget } from '../../project/browser/assets-browser/stage-assets-browser-widget';
import { ActorType } from '../../project/browser/types/Actor';
import { FontType } from '../../project/browser/types/Font';
import { LogicType } from '../../project/browser/types/Logic';
import { SoundType } from '../../project/browser/types/Sound';
import { StageType } from '../../project/browser/types/Stage';
import { TranslationsType } from '../../project/browser/types/Translations';
import { VesProjectDashboardWidget } from '../../project/browser/ves-project-dashboard-widget';
import { VesProjectSidebarWidget } from '../../project/browser/ves-project-sidebar-widget';

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

export const VIEW_MODE_WIDGETS: Record<ViewMode, { allow?: string[], force?: string[] }> = {
    [ViewMode.actors]: {
        allow: [
            ActorAssetsBrowserWidget.ID,
            ImageAssetsBrowserWidget.ID,
            VesEditorsWidget.ID,
        ]
    },
    [ViewMode.assets]: {
        allow: [
            BrightnessRepeatAssetsBrowserWidget.ID,
            ColumnTableAssetsBrowserWidget.ID,
            RumbleEffectAssetsBrowserWidget.ID,
            VesEditorsWidget.ID,
        ]
    },
    [ViewMode.build]: {
        force: [
            VesBuildWidget.ID,
        ]
    },
    [ViewMode.emulator]: {
        allow: [
            VesEmulatorSidebarWidget.ID,
            VesEmulatorWidget.ID,
        ]
    },
    [ViewMode.flashCarts]: {
        force: [
            VesFlashCartWidget.ID,
        ]
    },
    [ViewMode.fonts]: {
        allow: [
            FontAssetsBrowserWidget.ID,
            VesEditorsWidget.ID,
        ]
    },
    [ViewMode.localization]: {
        allow: [
            VesEditorsWidget.ID,
        ]
    },
    [ViewMode.logic]: {
        allow: [
            LogicAssetsBrowserWidget.ID,
            VesEditorsWidget.ID,
        ]
    },
    [ViewMode.sound]: {
        allow: [
            SoundAssetsBrowserWidget.ID,
            VesEditorsWidget.ID,
        ]
    },
    [ViewMode.settings]: {
        allow: [
            PreferencesSearchbarWidget.ID,
            VesProjectSidebarWidget.ID,
            VesEditorsWidget.ID,
        ]
    },
    [ViewMode.sourceCode]: {
        allow: [
            'code-editor-opener',
            'ves-plugins-search-bar',
            EXPLORER_VIEW_CONTAINER_ID,
            OUTLINE_WIDGET_FACTORY_ID,
            PROBLEMS_WIDGET_ID,
            SCM_VIEW_CONTAINER_ID,
            SEARCH_VIEW_CONTAINER_ID,
            VesPluginsViewContainer.ID,
            VSXExtensionsViewContainer.ID,
        ]
    },
    [ViewMode.stages]: {
        allow: [
            StageAssetsBrowserWidget.ID,
            VesEditorsWidget.ID,
        ],
        force: [
            VesProjectDashboardWidget.ID,
        ]
    },
};
