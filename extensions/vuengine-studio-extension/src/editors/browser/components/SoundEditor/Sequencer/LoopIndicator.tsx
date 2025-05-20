import React from 'react';
import styled from 'styled-components';
import { VSU_NUMBER_OF_CHANNELS } from '../Emulator/VsuTypes';
import { PIANO_ROLL_KEY_WIDTH, SEQUENCER_RESOLUTION } from '../SoundEditorTypes';

export const StyledLoopIndicator = styled.div`
    background-color: var(--theia-editor-foreground);
    opacity: .5;
    position: absolute;
    top: 0;
    width: 1px;
    z-index: 100;
`;

interface LoopIndicatorProps {
    numberOfTracks: number
    position: number
    hidden: boolean
    sequencerPatternWidth: number
}

export default function LoopIndicator(props: LoopIndicatorProps): React.JSX.Element {
    const { numberOfTracks, position, hidden, sequencerPatternWidth } = props;

    const offset = PIANO_ROLL_KEY_WIDTH + position * sequencerPatternWidth / SEQUENCER_RESOLUTION;

    const style = {
        display: hidden ? 'none' : undefined,
        left: 1 + offset,
    };

    return <StyledLoopIndicator style={{
        ...style,
        bottom: numberOfTracks === VSU_NUMBER_OF_CHANNELS ? 0 : 11,
    }}>
        <i className='fa fa-backward' style={{
            bottom: -1,
            fontSize: 9,
            marginLeft: 2,
            position: 'absolute',
        }} />
    </StyledLoopIndicator>;
}
