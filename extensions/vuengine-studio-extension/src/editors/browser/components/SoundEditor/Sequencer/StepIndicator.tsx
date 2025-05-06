import React from 'react';
import { NOTE_RESOLUTION, NOTES_SPECTRUM, PIANO_ROLL_NOTE_HEIGHT, PIANO_ROLL_NOTE_WIDTH } from '../SoundEditorTypes';
import { StyledStepIndicator } from './StyledComponents';

interface StepIndicatorProps {
    currentStep: number
    isPianoRoll: boolean
    hidden: boolean
}

export default function StepIndicator(props: StepIndicatorProps): React.JSX.Element {
    const { currentStep, isPianoRoll, hidden } = props;

    let offset = 0;
    const headerWidth = 50;
    if (isPianoRoll) {
        offset = headerWidth + currentStep * PIANO_ROLL_NOTE_WIDTH;
    } else {
        const patternNoteWidth = Math.max(0, 16 / NOTE_RESOLUTION);
        offset = headerWidth + currentStep * patternNoteWidth;
    }

    const style = {
        display: hidden ? 'none' : undefined,
        left: offset,
        top: isPianoRoll ? 20 : 0,
        bottom: isPianoRoll ? undefined : 11,
        height: isPianoRoll ? NOTES_SPECTRUM * PIANO_ROLL_NOTE_HEIGHT + 5 : 191,
        opacity: isPianoRoll ? .5 : 1,
        width: isPianoRoll ? 15 : 1,
    };

    return <StyledStepIndicator style={style} />;
}
