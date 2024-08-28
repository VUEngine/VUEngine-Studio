import { DottingRef, useDotting } from 'dotting';
import React from 'react';
import HContainer from '../Common/HContainer';
import { SpriteEditorTool } from './SpriteEditorTool';

interface SpriteEditorUndoRedoProps {
    dottingRef: React.RefObject<DottingRef>
}

export default function SpriteEditorUndoRedo(props: SpriteEditorUndoRedoProps): React.JSX.Element {
    const { dottingRef } = props;
    const { undo, redo } = useDotting(dottingRef);

    return (
        <HContainer gap={2} wrap='wrap'>
            <SpriteEditorTool
                onClick={undo}
            >
                <i className='codicon codicon-discard' />
            </SpriteEditorTool>
            <SpriteEditorTool
                onClick={redo}
            >
                <i className='codicon codicon-redo' />
            </SpriteEditorTool>
        </HContainer>
    );
}
