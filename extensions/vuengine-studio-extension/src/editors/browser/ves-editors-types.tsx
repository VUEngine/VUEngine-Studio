import { CommandService, MessageService, nls, PreferenceService, QuickPickService, URI } from '@theia/core';
import {
    HoverService,
    LocalStorageService,
    OpenerService,
    StatusBarEntry
} from '@theia/core/lib/browser';
import { ClipboardService } from '@theia/core/lib/browser/clipboard-service';
import { ColorRegistry } from '@theia/core/lib/browser/color-registry';
import { ThemeService } from '@theia/core/lib/browser/theming';
import { WindowService } from '@theia/core/lib/browser/window/window-service';
import { EnvVariablesServer } from '@theia/core/lib/common/env-variables';
import { ThemeType } from '@theia/core/lib/common/theme';
import { Event } from '@theia/core/shared/vscode-languageserver-protocol';
import { FileDialogService } from '@theia/filesystem/lib/browser';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import { createContext } from 'react';
import { VesBuildPathsService } from '../../build/browser/ves-build-paths-service';
import { VesBuildService } from '../../build/browser/ves-build-service';
import { VesCodeGenService } from '../../codegen/browser/ves-codegen-service';
import { VesCommonService } from '../../core/browser/ves-common-service';
import { VesImagesService } from '../../images/browser/ves-images-service';
import { VesProcessWatcher } from '../../process/browser/ves-process-service-watcher';
import { VesProcessService } from '../../process/common/ves-process-service-protocol';
import { VesProjectService } from '../../project/browser/ves-project-service';
import { VesRumblePackService } from '../../rumble-pack/browser/ves-rumble-pack-service';

export interface EditorsServices {
    clipboardService: ClipboardService;
    colorRegistry: ColorRegistry;
    commandService: CommandService
    envVariablesServer: EnvVariablesServer
    fileDialogService: FileDialogService
    fileService: FileService
    hoverService: HoverService
    localStorageService: LocalStorageService
    messageService: MessageService
    openerService: OpenerService
    preferenceService: PreferenceService
    quickPickService: QuickPickService
    themeService: ThemeService
    vesBuildPathsService: VesBuildPathsService
    vesBuildService: VesBuildService
    vesCodeGenService: VesCodeGenService
    vesCommonService: VesCommonService
    vesImagesService: VesImagesService
    vesProcessService: VesProcessService,
    vesProcessWatcher: VesProcessWatcher,
    vesProjectService: VesProjectService,
    vesRumblePackService: VesRumblePackService
    windowService: WindowService
    workspaceService: WorkspaceService
};

// @ts-ignore
export const EditorsContext = createContext<EditorsContextType>({});

export interface EditorsContextType {
    fileUri: URI
    isGenerating: boolean
    isReadonly: boolean
    setSaveCallback: (callback: () => void) => void
    setIsGenerating: (isGenerating: boolean, progress?: number) => void
    setGeneratingProgress: (current: number, total: number) => void
    setCommands: (commandIds: string[]) => void
    onCommandExecute: Event<string>
    enableCommands: () => void
    disableCommands: () => void
    setStatusBarItem: (id: string, entry: StatusBarEntry) => void
    removeStatusBarItem: (id: string) => void
    currentThemeType: ThemeType
    services: EditorsServices
}

export interface EditorCommand {
    id: string
    label: string
    category: string
    keybinding?: string | string[]
    disabled?: boolean
}

export interface EditorCommands {
    [id: string]: EditorCommand
}

export const TYPE_LABELS: { [typeId: string]: string } = {
    'Actor': nls.localize('vuengine/projects/typeLabels/actor', 'Actor'),
    'BrightnessRepeat': nls.localize('vuengine/projects/typeLabels/brightnessRepeat', 'Brightness Repeat'),
    'ColliderLayers': nls.localize('vuengine/projects/typeLabels/colliderLayers', 'Collider Layers'),
    'ColumnTable': nls.localize('vuengine/projects/typeLabels/columnTable', 'Column Table'),
    'CompilerConfig': nls.localize('vuengine/projects/typeLabels/compilerConfig', 'Compiler Config'),
    'EngineConfig': nls.localize('vuengine/projects/typeLabels/engineConfig', 'Engine Config'),
    'Events': nls.localize('vuengine/projects/typeLabels/events', 'Events'),
    'Font': nls.localize('vuengine/projects/typeLabels/font', 'Font'),
    'GameConfig': nls.localize('vuengine/projects/typeLabels/gameConfig', 'Game Config'),
    'InGameTypes': nls.localize('vuengine/projects/typeLabels/inGameTypes', 'In-Game Types'),
    'Image': nls.localize('vuengine/projects/typeLabels/image', 'Image'),
    'Logic': nls.localize('vuengine/projects/typeLabels/logic', 'Logic'),
    'Messages': nls.localize('vuengine/projects/typeLabels/messages', 'Messages'),
    'Pixel': nls.localize('vuengine/projects/typeLabels/pixel', 'Pixel Art'),
    'PluginFile': nls.localize('vuengine/projects/typeLabels/pluginFile', 'Plugin File'),
    'RumbleEffect': nls.localize('vuengine/projects/typeLabels/rumbleEffect', 'Rumble Effect'),
    'RomInfo': nls.localize('vuengine/projects/typeLabels/romInfo', 'ROM Info'),
    'Sound': nls.localize('vuengine/projects/typeLabels/sound', 'Sound'),
    'Stage': nls.localize('vuengine/projects/typeLabels/stage', 'Stage'),
    'Translations': nls.localize('vuengine/projects/typeLabels/translations', 'Translations'),
};
