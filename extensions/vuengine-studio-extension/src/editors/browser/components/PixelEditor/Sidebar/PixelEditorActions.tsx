import { FileArrowDown, Trash } from '@phosphor-icons/react';
import { nls } from '@theia/core';
import { ConfirmDialog } from '@theia/core/lib/browser';
import { DottingRef, useDotting } from 'dotting';
import React from 'react';
import HContainer from '../../Common/Base/HContainer';
import VContainer from '../../Common/Base/VContainer';
import { PixelEditorTool } from './PixelEditorTool';

interface PixelEditorActionsProps {
    dottingRef: React.RefObject<DottingRef>
}

export default function PixelEditorActions(props: PixelEditorActionsProps): React.JSX.Element {
    const { dottingRef } = props;
    const { clear, downloadImage } = useDotting(dottingRef);

    const confirmClear = async (): Promise<void> => {
        const dialog = new ConfirmDialog({
            title: nls.localize('vuengine/editors/pixel/clear', 'Clear'),
            msg: nls.localize('vuengine/editors/pixel/areYouSureYouWantToClear', 'Are you sure you want to clear the entire canvas?'),
        });
        const confirmed = await dialog.open();
        if (confirmed) {
            clear();
        }
    };

    return (
        <VContainer>
            <label>
                {nls.localize('vuengine/editors/pixel/actions', 'Actions')}
            </label>
            <HContainer gap={2} wrap='wrap'>
                { /* }
                <PixelEditorTool
                    title={nls.localize('vuengine/editors/font/actions/import', 'Import')}
                    onClick={() => setImportDialogOpen(true)}
                >
                    <FileArrowUp size={20} />
                </PixelEditorTool>
                { */ }
                <PixelEditorTool
                    title={nls.localizeByDefault('Export')}
                    onClick={() => downloadImage({
                        type: 'png',
                        isGridVisible: false,
                    })}
                >
                    <FileArrowDown size={20} />
                </PixelEditorTool>
                <PixelEditorTool
                    title={nls.localize('vuengine/editors/font/actions/clear', 'Clear Current Character')}
                    onClick={confirmClear}
                >
                    <Trash size={20} />
                </PixelEditorTool>
            </HContainer>
        </VContainer>
    );
}
