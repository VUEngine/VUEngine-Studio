import { Trash } from '@phosphor-icons/react';
import { nls } from '@theia/core';
import { ConfirmDialog } from '@theia/core/lib/browser';
import { DottingRef, useDotting } from 'dotting';
import React from 'react';
import HContainer from '../Common/HContainer';

interface SpriteEditorActionsProps {
    dottingRef: React.RefObject<DottingRef>
}

export default function SpriteEditorActions(props: SpriteEditorActionsProps): React.JSX.Element {
    const { dottingRef } = props;
    const { clear, downloadImage, undo, redo } = useDotting(dottingRef);

    const confirmClear = async (): Promise<void> => {
        const dialog = new ConfirmDialog({
            title: nls.localize('vuengine/spriteEditor/clear', 'Clear'),
            msg: nls.localize('vuengine/spriteEditor/areYouSureYouWantToClear', 'Are you sure you want to clear the entire canvas?'),
        });
        const confirmed = await dialog.open();
        if (confirmed) {
            clear();
        }
    };

    return (
        <HContainer gap={2} wrap='wrap'>
            <div
                className='tool'
                onClick={undo}
            >
                <i className='codicon codicon-discard' />
            </div>
            <div
                className='tool'
                onClick={redo}
            >
                <i className='codicon codicon-redo' />
            </div>
            <div
                className='tool'
                onClick={() => downloadImage({
                    type: 'png',
                    isGridVisible: false,
                })}
            >
                <i className='codicon codicon-device-camera' />
            </div>
            <div
                className='tool'
                onClick={confirmClear}
            >
                <Trash size={20} />
            </div>
        </HContainer>
    );
}
