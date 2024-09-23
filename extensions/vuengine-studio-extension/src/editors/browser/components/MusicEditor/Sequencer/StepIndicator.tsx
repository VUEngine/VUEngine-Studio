import React from 'react';
import styled from 'styled-components';

const StyledStepIndicator = styled.div`
    background-color: var(--theia-focusBorder);
    bottom: 0;
    left: 0;
    position: absolute;
    z-index: 1;
`;

interface StepIndicatorProps {
    currentStep: number
    noteResolution: number
    isPianoRoll: boolean
    hidden: boolean
}

export default function StepIndicator(props: StepIndicatorProps): React.JSX.Element {
    const { currentStep, noteResolution, isPianoRoll, hidden } = props;

    let offset = 0;
    if (isPianoRoll) {
        const headerWidth = 50;
        const noteWidth = 16;
        const elapsedNotesWidth = currentStep * noteWidth;
        const dividers4Total = Math.round(currentStep / 4);
        const dividersNoteResolutionTotal = Math.round(currentStep / (noteResolution ?? 1));
        offset = headerWidth + elapsedNotesWidth + dividers4Total + dividersNoteResolutionTotal;
    } else {
        const patternNoteWidth = 16 / noteResolution;
        const headerWidth = 73;
        const elapsedNotesWidth = currentStep * patternNoteWidth;
        offset = headerWidth + elapsedNotesWidth;
    }

    const style = {
        display: hidden ? 'none' : undefined,
        left: offset,
        top: isPianoRoll ? 14 : 0,
        width: isPianoRoll ? 3 : 1,
    };

    return <StyledStepIndicator style={style} />;
}
