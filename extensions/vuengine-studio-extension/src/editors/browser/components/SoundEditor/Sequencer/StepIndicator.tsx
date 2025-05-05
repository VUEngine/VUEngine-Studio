import React from 'react';
import { StyledStepIndicator } from './StyledComponents';
import { NOTE_RESOLUTION, NOTES_SPECTRUM, PIANO_ROLL_NOTE_HEIGHT } from '../SoundEditorTypes';

interface StepIndicatorProps {
    currentStep: number
    isPianoRoll: boolean
    hidden: boolean
}

export default function StepIndicator(props: StepIndicatorProps): React.JSX.Element {
    const { currentStep, isPianoRoll, hidden } = props;

    let offset = 0;
    const headerWidth = 52;
    if (isPianoRoll) {
        const noteWidth = 16;
        const elapsedNotesWidth = currentStep * noteWidth;
        const dividers4Total = Math.round(currentStep / 4);
        const dividersNoteResolutionTotal = Math.round(currentStep / (NOTE_RESOLUTION ?? 1));
        offset = headerWidth + elapsedNotesWidth + dividers4Total + dividersNoteResolutionTotal;
    } else {
        const patternNoteWidth = Math.max(0, 16 / NOTE_RESOLUTION);
        const elapsedNotesWidth = currentStep * patternNoteWidth;
        offset = headerWidth + elapsedNotesWidth;
    }

    const style = {
        display: hidden ? 'none' : undefined,
        left: offset,
        top: isPianoRoll ? 20 : 0,
        bottom: isPianoRoll ? undefined : 11,
        height: isPianoRoll ? NOTES_SPECTRUM * (PIANO_ROLL_NOTE_HEIGHT + 1) + 5 : 191,
        opacity: isPianoRoll ? .5 : 1,
        width: isPianoRoll ? 15 : 1,
    };

    return <StyledStepIndicator style={style} />;
}
