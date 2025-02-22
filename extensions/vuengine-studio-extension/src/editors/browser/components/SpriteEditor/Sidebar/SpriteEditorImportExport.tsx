import { FileArrowDown } from '@phosphor-icons/react';
import { nls } from '@theia/core';
import { DottingRef, useDotting } from 'dotting';
import React from 'react';
import HContainer from '../../Common/Base/HContainer';
import VContainer from '../../Common/Base/VContainer';
import { SpriteEditorTool } from './SpriteEditorTool';

interface SpriteEditorImportExportProps {
    dottingRef: React.RefObject<DottingRef>
}

export default function SpriteEditorImportExport(props: SpriteEditorImportExportProps): React.JSX.Element {
    const { dottingRef } = props;
    const { downloadImage } = useDotting(dottingRef);

    return (
        <VContainer>
            <label>
                {nls.localizeByDefault('Export')}
            </label>
            <HContainer gap={2} wrap='wrap'>
                { /* }
                <SpriteEditorTool
                    title={nls.localize('vuengine/editors/font/actions/import', 'Import')}
                    onClick={() => setImportDialogOpen(true)}
                >
                    <FileArrowUp size={20} />
                </SpriteEditorTool>
                { */ }
                <SpriteEditorTool
                    title={nls.localizeByDefault('Export')}
                    onClick={() => downloadImage({
                        type: 'png',
                        isGridVisible: false,
                    })}
                >
                    <FileArrowDown size={20} />
                </SpriteEditorTool>
            </HContainer>
        </VContainer>
    );
}
