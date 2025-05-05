import React from 'react';
import { StyledLoopIndicator } from './StyledComponents';
import { NOTE_RESOLUTION } from '../SoundEditorTypes';

interface LoopIndicatorProps {
    position: number
    hidden: boolean
}

export default function LoopIndicator(props: LoopIndicatorProps): React.JSX.Element {
    const { position, hidden } = props;

    let offset = 0;
    const headerWidth = 50;
    const patternNoteWidth = Math.max(0, 16 / NOTE_RESOLUTION);
    const headerPadding = 3;
    const elapsedNotesWidth = position * NOTE_RESOLUTION * patternNoteWidth;
    offset = headerWidth + headerPadding + elapsedNotesWidth;

    const style = {
        display: hidden ? 'none' : undefined,
        left: offset,
    };

    return <StyledLoopIndicator style={style}>
        <i className='fa fa-backward' />
    </StyledLoopIndicator>;
}
