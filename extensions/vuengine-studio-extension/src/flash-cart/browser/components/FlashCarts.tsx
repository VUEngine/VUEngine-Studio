import { CommandService } from '@theia/core';
import { PreferenceService } from '@theia/core/lib/browser';
import { FileDialogService } from '@theia/filesystem/lib/browser';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import React from 'react';
import { VesBuildService } from '../../../build/browser/ves-build-service';
import { VesCommonService } from '../../../core/browser/ves-common-service';
import { VesFlashCartService } from '../ves-flash-cart-service';
import ConnectedFlashCarts from './ConnectedFlashCarts';
import FlashCartConfigs from './FlashCartConfigs';
import NoFlashCartsDetected from './NoFlashCartsDetected';

interface FlashCartsProps {
    commandService: CommandService
    fileService: FileService
    fileDialogService: FileDialogService
    preferenceService: PreferenceService
    vesBuildService: VesBuildService
    vesCommonService: VesCommonService
    vesFlashCartService: VesFlashCartService
    workspaceService: WorkspaceService
}

export default function FlashCarts(props: FlashCartsProps): React.JSX.Element {
    const {
        commandService,
        fileService,
        fileDialogService,
        preferenceService,
        vesBuildService,
        vesCommonService,
        vesFlashCartService,
        workspaceService,
    } = props;

    return <>
        <div className="connected-flash-carts">
            {vesFlashCartService.connectedFlashCarts.length
                ? <ConnectedFlashCarts
                    commandService={commandService}
                    preferenceService={preferenceService}
                    vesBuildService={vesBuildService}
                    vesCommonService={vesCommonService}
                    vesFlashCartService={vesFlashCartService}
                    workspaceService={workspaceService}
                />
                : <NoFlashCartsDetected
                    commandService={commandService}
                />}
        </div >
        <FlashCartConfigs
            fileService={fileService}
            fileDialogService={fileDialogService}
            preferenceService={preferenceService}
            vesFlashCartService={vesFlashCartService}
        />
    </>;
}
