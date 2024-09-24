import React from 'react';
import { StyledStepIndicator } from './StyledComponents';

interface StepIndicatorProps {
    currentStep: number
    noteResolution: number
    isPianoRoll: boolean
    hidden: boolean
}

export default function StepIndicator(props: StepIndicatorProps): React.JSX.Element {
    const { currentStep, noteResolution, isPianoRoll, hidden } = props;

    let offset = 0;
    const headerWidth = 50;
    if (isPianoRoll) {
        const noteWidth = 16;
        const elapsedNotesWidth = currentStep * noteWidth;
        const dividers4Total = Math.round(currentStep / 4);
        const dividersNoteResolutionTotal = Math.round(currentStep / (noteResolution ?? 1));
        offset = headerWidth + elapsedNotesWidth + dividers4Total + dividersNoteResolutionTotal;
    } else {
        const patternNoteWidth = 16 / noteResolution;
        const headerPadding = 3;
        const elapsedNotesWidth = currentStep * patternNoteWidth;
        offset = headerWidth + headerPadding + elapsedNotesWidth;
    }

    const style = {
        display: hidden ? 'none' : undefined,
        left: offset,
        top: isPianoRoll ? 14 : 0,
        width: isPianoRoll ? 3 : 1,
    };

    return <StyledStepIndicator style={style} />;
}
