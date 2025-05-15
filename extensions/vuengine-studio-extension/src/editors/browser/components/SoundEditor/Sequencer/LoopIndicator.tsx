import React from 'react';
import { NOTE_RESOLUTION, PIANO_ROLL_KEY_WIDTH } from '../SoundEditorTypes';
import styled from 'styled-components';

export const StyledLoopIndicator = styled.div`
    background-color: var(--theia-editor-foreground);
    bottom: 12px;
    opacity: .5;
    position: absolute;
    top: 0;
    width: 1px;

    i {
        font-size: 9px;
        margin-left: 1px;
        position: absolute;
        top: 4px;
    }
`;

interface LoopIndicatorProps {
    position: number
    hidden: boolean
}

export default function LoopIndicator(props: LoopIndicatorProps): React.JSX.Element {
    const { position, hidden } = props;

    const offset = PIANO_ROLL_KEY_WIDTH + position * NOTE_RESOLUTION;

    const style = {
        display: hidden ? 'none' : undefined,
        left: offset,
    };

    return <StyledLoopIndicator style={style}>
        <i className='fa fa-backward' />
    </StyledLoopIndicator>;
}
