import React from 'react';
import styled from 'styled-components';
import { NOTE_RESOLUTION } from '../SoundEditorTypes';

export const StyledLoopIndicator = styled.div`
    background-color: var(--theia-editor-foreground);
    bottom: 1px;
    opacity: .5;
    position: absolute;
    top: 0;
    width: 1px;
`;

interface LoopIndicatorProps {
    position: number
    hidden: boolean
    sequencerPatternWidth: number
}

export default function LoopIndicator(props: LoopIndicatorProps): React.JSX.Element {
    const { position, hidden, sequencerPatternWidth } = props;

    const offset = position * sequencerPatternWidth / NOTE_RESOLUTION;

    return <StyledLoopIndicator style={{
        display: hidden ? 'none' : undefined,
        left: offset - .5,
    }}>
        <i className='fa fa-backward' style={{
            bottom: -1,
            fontSize: 9,
            marginLeft: 2,
            position: 'absolute',
        }} />
    </StyledLoopIndicator>;
}
