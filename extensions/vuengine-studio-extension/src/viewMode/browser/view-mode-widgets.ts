import { CALL_HIERARCHY_TOGGLE_COMMAND_ID } from '@theia/callhierarchy/lib/browser/callhierarchy';
import { CommonCommands } from '@theia/core/lib/browser';
import { KeymapsCommands } from '@theia/keymaps/lib/browser';
import { KeybindingWidget } from '@theia/keymaps/lib/browser/keybindings-widget';
import { PROBLEMS_WIDGET_ID } from '@theia/markers/lib/browser/problem/problem-widget';
import { FILE_NAVIGATOR_TOGGLE_COMMAND_ID } from '@theia/navigator/lib/browser/navigator-contribution';
import { EXPLORER_VIEW_CONTAINER_ID } from '@theia/navigator/lib/browser/navigator-widget-factory';
import { OUTLINE_WIDGET_FACTORY_ID } from '@theia/outline-view/lib/browser/outline-view-contribution';
import { PreferencesSearchbarWidget } from '@theia/preferences/lib/browser/views/preference-searchbar-widget';
import { PreferencesWidget } from '@theia/preferences/lib/browser/views/preference-widget';
import { SCM_VIEW_CONTAINER_ID } from '@theia/scm/lib/browser/scm-contribution';
import { SEARCH_VIEW_CONTAINER_ID } from '@theia/search-in-workspace/lib/browser/search-in-workspace-factory';
import { SearchInWorkspaceCommands } from '@theia/search-in-workspace/lib/browser/search-in-workspace-frontend-contribution';
import { TypeHierarchyCommands } from '@theia/typehierarchy/lib/browser/typehierarchy-contribution';
import { VSXExtensionsCommands } from '@theia/vsx-registry/lib/browser/vsx-extension-commands';
import { VSXExtensionsViewContainer } from '@theia/vsx-registry/lib/browser/vsx-extensions-view-container';
import { WorkspaceCommands } from '@theia/workspace/lib/browser';
import { VesBuildArchiveWidget } from '../../build/browser/ves-build-archive-widget';
import { VesBuildWidget } from '../../build/browser/ves-build-widget';
import { SoundEditorCurrentNoteWidget } from '../../editors/browser/sidebar/SoundEditor/sound-editor-current-note-widget';
import { SoundEditorCurrentPatternWidget } from '../../editors/browser/sidebar/SoundEditor/sound-editor-current-pattern-widget';
import { SoundEditorCurrentTrackWidget } from '../../editors/browser/sidebar/SoundEditor/sound-editor-current-track-widget';
import { SoundEditorInstrumentsWidget } from '../../editors/browser/sidebar/SoundEditor/sound-editor-instruments-widget';
import { SoundEditorKeyBindingsWidget } from '../../editors/browser/sidebar/SoundEditor/sound-editor-key-bindings-widget';
import { SoundEditorPropertiesWidget } from '../../editors/browser/sidebar/SoundEditor/sound-editor-properties-widget';
import { SoundEditorUtilitiesWidget } from '../../editors/browser/sidebar/SoundEditor/sound-editor-utilities-widget';
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
import { VesProjectDashboardWidget } from '../../project/browser/ves-project-dashboard-widget';
import { VesProjectSidebarWidget } from '../../project/browser/ves-project-sidebar-widget';
import { WelcomeWidget } from '../../welcome/browser/welcome-widget';
import { ViewMode } from './view-mode-types';

export const DEFAULT_VIEW_MODE = ViewMode.sourceCode;
export const LAST_VIEW_MODE_LOCAL_STORAGE_KEY = 'vuengine-last-view-mode';

type ViewModeWidgets = Record<string, boolean>;
type ViewModeWidgetsMap = Record<ViewMode, { allow?: ViewModeWidgets, force?: ViewModeWidgets }>;

export const VIEW_MODE_WIDGETS: ViewModeWidgetsMap = {
    [ViewMode.actors]: {
        allow: {
            [ActorAssetsBrowserWidget.ID]: true,
            [ImageAssetsBrowserWidget.ID]: false,
            [`${VesEditorsWidget.ID}:Actor:`]: false,
        }
    },
    [ViewMode.assets]: {
        allow: {
            [BrightnessRepeatAssetsBrowserWidget.ID]: true,
            [ColumnTableAssetsBrowserWidget.ID]: false,
            [RumbleEffectAssetsBrowserWidget.ID]: false,
            [`${VesEditorsWidget.ID}:BrightnessRepeat:`]: false,
            [`${VesEditorsWidget.ID}:ColumnTable:`]: false,
            [`${VesEditorsWidget.ID}:RumbleEffect:`]: false,
        }
    },
    [ViewMode.build]: {
        allow: {
            [VesBuildArchiveWidget.ID]: false,
            [VesEmulatorSidebarWidget.ID]: false,
            [VesEmulatorWidget.ID]: false,
        },
        force: {
            [VesBuildWidget.ID]: false,
            [VesFlashCartWidget.ID]: false,
        }
    },
    [ViewMode.fonts]: {
        allow: {
            [FontAssetsBrowserWidget.ID]: true,
            [`${VesEditorsWidget.ID}:Font:`]: false,
        }
    },
    [ViewMode.localization]: {
        force: {
            [`${VesEditorsWidget.ID}:Translations:`]: false,
        }
    },
    [ViewMode.logic]: {
        allow: {
            [LogicAssetsBrowserWidget.ID]: true,
            [`${VesEditorsWidget.ID}:Logic:`]: false,
        }
    },
    [ViewMode.settings]: {
        allow: {
            [PreferencesSearchbarWidget.ID]: false,
            [VesProjectSidebarWidget.ID]: true,
            [VesPluginsViewContainer.ID]: false,
            [VSXExtensionsViewContainer.ID]: false,
            [`${VesEditorsWidget.ID}:ColliderLayers:`]: false,
            [`${VesEditorsWidget.ID}:CompilerConfig:`]: false,
            [`${VesEditorsWidget.ID}:EngineConfig:`]: false,
            [`${VesEditorsWidget.ID}:Events:`]: false,
            [`${VesEditorsWidget.ID}:InGameTypes:`]: false,
            [`${VesEditorsWidget.ID}:Messages:`]: false,
            [`${VesEditorsWidget.ID}:RomInfo:`]: false,
        },
        force: {
            [KeybindingWidget.ID]: false,
            [PreferencesWidget.ID]: false,
        }
    },
    [ViewMode.sound]: {
        allow: {
            [SoundAssetsBrowserWidget.ID]: true,
            [SoundEditorPropertiesWidget.ID]: false,
            [SoundEditorInstrumentsWidget.ID]: false,
            [SoundEditorCurrentTrackWidget.ID]: false,
            [SoundEditorCurrentPatternWidget.ID]: false,
            [SoundEditorCurrentNoteWidget.ID]: false,
            [SoundEditorUtilitiesWidget.ID]: false,
            [SoundEditorKeyBindingsWidget.ID]: false,
            [`${VesEditorsWidget.ID}:Sound:`]: false,
        }
    },
    [ViewMode.sourceCode]: {
        allow: {
            'code-editor-opener': false,
            [EXPLORER_VIEW_CONTAINER_ID]: true,
            [OUTLINE_WIDGET_FACTORY_ID]: false,
            [PROBLEMS_WIDGET_ID]: false,
            [SCM_VIEW_CONTAINER_ID]: false,
            [SEARCH_VIEW_CONTAINER_ID]: false,
        }
    },
    [ViewMode.stages]: {
        allow: {
            [StageAssetsBrowserWidget.ID]: true,
            [`${VesEditorsWidget.ID}:Stage:`]: false,
        },
        force: {
            [VesProjectDashboardWidget.ID]: false,
        }
    },
    [ViewMode.welcome]: {
        force: {
            [WelcomeWidget.ID]: false,
        }
    },
};

export const COMMAND_ID_TO_VIEW_MODE: Record<string, ViewMode> = {
    [KeymapsCommands.OPEN_KEYMAPS.id]: ViewMode.settings,
    [KeymapsCommands.OPEN_KEYMAPS_JSON.id]: ViewMode.settings,
    [KeymapsCommands.OPEN_KEYMAPS_JSON_TOOLBAR.id]: ViewMode.settings,
    [CommonCommands.OPEN_PREFERENCES.id]: ViewMode.settings,
    [VSXExtensionsCommands.INSTALL_FROM_VSIX.id]: ViewMode.settings,
    [VSXExtensionsCommands.INSTALL_VSIX_FILE.id]: ViewMode.settings,
    [VSXExtensionsCommands.INSTALL_ANOTHER_VERSION.id]: ViewMode.settings,
    [VSXExtensionsCommands.SHOW_BUILTINS.id]: ViewMode.settings,
    [VSXExtensionsCommands.SHOW_INSTALLED.id]: ViewMode.settings,
    [VSXExtensionsCommands.SHOW_RECOMMENDATIONS.id]: ViewMode.settings,

    [CommonCommands.NEW_FILE.id]: ViewMode.sourceCode,
    [CommonCommands.PICK_NEW_FILE.id]: ViewMode.sourceCode,
    [WorkspaceCommands.FILE_COMPARE.id]: ViewMode.sourceCode,
    [WorkspaceCommands.NEW_FILE.id]: ViewMode.sourceCode,
    [WorkspaceCommands.NEW_FOLDER.id]: ViewMode.sourceCode,
    [FILE_NAVIGATOR_TOGGLE_COMMAND_ID]: ViewMode.sourceCode,
    [TypeHierarchyCommands.TOGGLE_VIEW.id]: ViewMode.sourceCode,
    [CALL_HIERARCHY_TOGGLE_COMMAND_ID]: ViewMode.sourceCode,
    ['scmView:toggle']: ViewMode.sourceCode,
    ['debug:toggle']: ViewMode.sourceCode,
    ['debug:console:toggle']: ViewMode.sourceCode,
    ['outlineView:toggle']: ViewMode.sourceCode,
    [SearchInWorkspaceCommands.OPEN_SIW_WIDGET.id]: ViewMode.sourceCode,
    [SearchInWorkspaceCommands.REPLACE_IN_FILES.id]: ViewMode.sourceCode,
    [SearchInWorkspaceCommands.FIND_IN_FOLDER.id]: ViewMode.sourceCode,
};
