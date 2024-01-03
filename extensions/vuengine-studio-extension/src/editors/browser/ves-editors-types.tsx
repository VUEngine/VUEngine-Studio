import { CommandService, MessageService, QuickPickService, URI } from '@theia/core';
import {
    HoverService,
    OpenerService,
    PreferenceService
} from '@theia/core/lib/browser';
import * as React from '@theia/core/shared/react';
import { FileDialogService } from '@theia/filesystem/lib/browser';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import DockLayout, { LayoutBase } from 'rc-dock';
import { VesCommonService } from '../../core/browser/ves-common-service';
import { VesImagesService } from '../../images/browser/ves-images-service';
import { VesProjectService } from '../../project/browser/ves-project-service';
import { VesRumblePackService } from '../../rumble-pack/browser/ves-rumble-pack-service';

export interface EditorsDockInterface {
    getRef: (r: DockLayout) => void,
    setDefaultLayout: (defaultLayout: LayoutBase) => Promise<void>,
    resetLayout: () => Promise<void>,
    restoreLayout: () => Promise<void>,
    persistLayout: (layout: LayoutBase | undefined) => Promise<void>,
};

export interface EditorsServices {
    commandService: CommandService
    fileService: FileService
    fileDialogService: FileDialogService
    hoverService: HoverService
    messageService: MessageService
    openerService: OpenerService
    quickPickService: QuickPickService
    preferenceService: PreferenceService
    vesCommonService: VesCommonService
    vesImagesService: VesImagesService
    vesProjectService: VesProjectService,
    vesRumblePackService: VesRumblePackService
    workspaceService: WorkspaceService
};

// @ts-ignore
export const EditorsContext = React.createContext<EditorsContextType>({});

export interface EditorsContextType {
    fileUri: URI
    isGenerating: boolean
    setIsGenerating: (isGenerating: boolean) => void
    dock: EditorsDockInterface
    services: EditorsServices
}
