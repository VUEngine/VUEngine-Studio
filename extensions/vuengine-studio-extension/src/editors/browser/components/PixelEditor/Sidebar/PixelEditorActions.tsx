import { FileArrowDown } from '@phosphor-icons/react';
import { nls } from '@theia/core';
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
    const { downloadImage } = useDotting(dottingRef);

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
            </HContainer>
        </VContainer>
    );
}
