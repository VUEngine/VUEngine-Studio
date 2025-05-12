import React from 'react';
import { StyledLoopIndicator } from './StyledComponents';
import { NOTE_RESOLUTION, PIANO_ROLL_KEY_WIDTH } from '../SoundEditorTypes';

interface LoopIndicatorProps {
    position: number
    hidden: boolean
}

export default function LoopIndicator(props: LoopIndicatorProps): React.JSX.Element {
    const { position, hidden } = props;

    const offset = PIANO_ROLL_KEY_WIDTH + position * NOTE_RESOLUTION * Math.max(0, 16 / NOTE_RESOLUTION);

    const style = {
        display: hidden ? 'none' : undefined,
        left: offset,
    };

    return <StyledLoopIndicator style={style}>
        <i className='fa fa-backward' />
    </StyledLoopIndicator>;
}
