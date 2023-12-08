import { MessageService, URI } from '@theia/core';
import { LocalStorageService } from '@theia/core/lib/browser';
import { FileDialogService } from '@theia/filesystem/lib/browser';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import React from 'react';
import { ImageConfig } from '../../../../images/browser/ves-images-types';
import ImageConvEditorDock from './ImageConvEditorDock';

interface ImageConvProps {
    data: ImageConfig
    updateData: (data: ImageConfig) => void
    fileUri: URI
    services: {
        fileService: FileService,
        fileDialogService: FileDialogService,
        localStorageService: LocalStorageService
        messageService: MessageService,
        workspaceService: WorkspaceService,
    }
}

export default class ImageConvEditor extends React.Component<ImageConvProps> {
    constructor(props: ImageConvProps) {
        super(props);
    }

    render(): React.JSX.Element {
        return (
            <ImageConvEditorDock
                data={this.props.data}
                updateData={this.props.updateData}
                fileUri={this.props.fileUri}
                fileService={this.props.services.fileService}
                fileDialogService={this.props.services.fileDialogService}
                localStorageService={this.props.services.localStorageService}
                messageService={this.props.services.messageService}
                workspaceService={this.props.services.workspaceService}
            />
        );
    }
}
