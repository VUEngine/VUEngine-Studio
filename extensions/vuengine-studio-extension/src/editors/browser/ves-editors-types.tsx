import { CommandService, MessageService, nls, QuickPickService, URI } from '@theia/core';
import {
    HoverService,
    LocalStorageService,
    OpenerService,
    PreferenceService,
    StatusBarEntry
} from '@theia/core/lib/browser';
import { ColorRegistry } from '@theia/core/lib/browser/color-registry';
import { ThemeService } from '@theia/core/lib/browser/theming';
import { WindowService } from '@theia/core/lib/browser/window/window-service';
import { FileDialogService } from '@theia/filesystem/lib/browser';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import { createContext } from 'react';
import { VesBuildService } from '../../build/browser/ves-build-service';
import { VesCommonService } from '../../core/browser/ves-common-service';
import { VesImagesService } from '../../images/browser/ves-images-service';
import { VesProjectService } from '../../project/browser/ves-project-service';
import { VesRumblePackService } from '../../rumble-pack/browser/ves-rumble-pack-service';

export interface EditorsServices {
    colorRegistry: ColorRegistry;
    commandService: CommandService
    fileDialogService: FileDialogService
    fileService: FileService
    hoverService: HoverService
    localStorageService: LocalStorageService
    messageService: MessageService
    openerService: OpenerService
    preferenceService: PreferenceService
    quickPickService: QuickPickService
    themeService: ThemeService
    vesBuildService: VesBuildService
    vesCommonService: VesCommonService
    vesImagesService: VesImagesService
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
    enableCommands: (commandIds: string[]) => void
    disableCommands: (commandIds: string[]) => void
    setStatusBarItem: (id: string, entry: StatusBarEntry) => void
    removeStatusBarItem: (id: string) => void
    services: EditorsServices
}

export const EDITORS_COMMAND_EXECUTED_EVENT_NAME = 'vesEditorsCommandExecuted';

export interface EditorCommand {
    id: string
    label: string
    category: string
    keybinding?: string | string[]
}

export interface EditorCommands {
    [id: string]: EditorCommand
}

export const TYPE_LABELS: { [typeId: string]: string } = {
    'Actor': nls.localize('vuengine/editors/general/typeLabels/actor', 'Actor'),
    'Audio': nls.localize('vuengine/editors/general/typeLabels/audio', 'Audio'),
    'BrightnessRepeat': nls.localize('vuengine/editors/general/typeLabels/brightnessRepeat', 'Brightness Repeat'),
    'ColliderLayers': nls.localize('vuengine/editors/general/typeLabels/colliderLayers', 'Collider Layers'),
    'ColumnTable': nls.localize('vuengine/editors/general/typeLabels/columnTable', 'Column Table'),
    'CompilerConfig': nls.localize('vuengine/editors/general/typeLabels/compilerConfig', 'Compiler Config'),
    'EngineConfig': nls.localize('vuengine/editors/general/typeLabels/engineConfig', 'Engine Config'),
    'Events': nls.localize('vuengine/editors/general/typeLabels/events', 'Events'),
    'Font': nls.localize('vuengine/editors/general/typeLabels/font', 'Font'),
    'GameConfig': nls.localize('vuengine/editors/general/typeLabels/gameConfig', 'Game Config'),
    'InGameTypes': nls.localize('vuengine/editors/general/typeLabels/inGameTypes', 'In-Game Types'),
    'Image': nls.localize('vuengine/editors/general/typeLabels/image', 'Image'),
    'Logic': nls.localize('vuengine/editors/general/typeLabels/logic', 'Logic'),
    'Messages': nls.localize('vuengine/editors/general/typeLabels/messages', 'Messages'),
    'Pcm': nls.localize('vuengine/editors/general/typeLabels/pcm', 'PCM'),
    'PluginFile': nls.localize('vuengine/editors/general/typeLabels/pluginFile', 'Plugin File'),
    'RumbleEffect': nls.localize('vuengine/editors/general/typeLabels/rumbleEffect', 'Rumble Effect'),
    'RomInfo': nls.localize('vuengine/editors/general/typeLabels/romInfo', 'ROM Info'),
    'Sprite': nls.localize('vuengine/editors/general/typeLabels/sprite', 'Sprite'),
    'Stage': nls.localize('vuengine/editors/general/typeLabels/stage', 'Stage'),
    'Translations': nls.localize('vuengine/editors/general/typeLabels/translations', 'Translations'),
    'VsuSandbox': nls.localize('vuengine/editors/general/typeLabels/vsuSandbox', 'VSU Sandbox'),
    'WaveForm': nls.localize('vuengine/editors/general/typeLabels/waveForm', 'Wave Form'),
};
