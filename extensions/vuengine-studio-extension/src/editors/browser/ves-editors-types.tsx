import { CommandService, MessageService, QuickPickService, URI } from '@theia/core';
import {
    HoverService,
    LocalStorageService,
    OpenerService,
    PreferenceService
} from '@theia/core/lib/browser';
import { ColorRegistry } from '@theia/core/lib/browser/color-registry';
import { WindowService } from '@theia/core/lib/browser/window/window-service';
import * as React from '@theia/core/shared/react';
import { FileDialogService } from '@theia/filesystem/lib/browser';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { WorkspaceService } from '@theia/workspace/lib/browser';
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
    vesCommonService: VesCommonService
    vesImagesService: VesImagesService
    vesProjectService: VesProjectService,
    vesRumblePackService: VesRumblePackService
    windowService: WindowService
    workspaceService: WorkspaceService
};

// @ts-ignore
export const EditorsContext = React.createContext<EditorsContextType>({});

export interface EditorsContextType {
    fileUri: URI
    isGenerating: boolean
    setIsGenerating: (isGenerating: boolean, progress?: number) => void
    setGeneratingProgress: (current: number, total: number) => void
    enableCommands: (commandIds: string[]) => void
    disableCommands: (commandIds: string[]) => void
    services: EditorsServices
}

export const EDITORS_COMMAND_EXECUTED_EVENT_NAME = 'vesEditorsCommandExecuted';

export interface EditorCommand {
    id: string
    label: string
    category: string
    keybinding?: string
}

export interface EditorCommands {
    [id: string]: EditorCommand
}
