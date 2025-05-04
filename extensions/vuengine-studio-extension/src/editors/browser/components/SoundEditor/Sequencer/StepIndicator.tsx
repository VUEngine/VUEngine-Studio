import React from 'react';
import { StyledStepIndicator } from './StyledComponents';
import { NOTE_RESOLUTION } from '../SoundEditorTypes';

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
        const noteWidth = 16;
        const elapsedNotesWidth = currentStep * noteWidth;
        const dividers4Total = Math.round(currentStep / 4);
        const dividersNoteResolutionTotal = Math.round(currentStep / (NOTE_RESOLUTION ?? 1));
        offset = 2 + headerWidth + elapsedNotesWidth + dividers4Total + dividersNoteResolutionTotal;
    } else {
        const patternNoteWidth = Math.max(0, 16 / NOTE_RESOLUTION);
        const headerPadding = 3;
        const elapsedNotesWidth = currentStep * patternNoteWidth;
        offset = headerWidth + headerPadding + elapsedNotesWidth;
    }

    const style = {
        display: hidden ? 'none' : undefined,
        left: offset,
        top: isPianoRoll ? 20 : 0,
        bottom: isPianoRoll ? undefined : 11,
        height: isPianoRoll ? 845 : 191,
        opacity: isPianoRoll ? .5 : 1,
        width: isPianoRoll ? 15 : 1,
    };

    return <StyledStepIndicator style={style} />;
}
