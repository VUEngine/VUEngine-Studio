import React from 'react';
import styled from 'styled-components';

interface StyledStepIndicatorProps {
    isPianoRoll: boolean
}

const StyledStepIndicator = styled.div<StyledStepIndicatorProps>`
    background-color: var(--theia-focusBorder);
    bottom: 0;
    left: 0;
    position: absolute;
    top: ${p => p.isPianoRoll ? 17 : 0}px;
    width: ${p => p.isPianoRoll ? 3 : 2}px;
    z-index: 1;
`;

interface StepIndicatorProps {
    currentStep: number
    bar: number
    isPianoRoll: boolean
    hidden: boolean
}

export default function StepIndicator(props: StepIndicatorProps): React.JSX.Element {
    const { currentStep, bar, isPianoRoll, hidden } = props;

    let offset = 0;
    if (isPianoRoll) {
        offset = 75 + currentStep * 18 + Math.round(currentStep / bar) * 2;
    } else {
        offset = 75 + currentStep * 2;
    }

    const style = {
        display: hidden ? 'none' : undefined,
        left: offset,
    };

    return <StyledStepIndicator
        isPianoRoll={isPianoRoll}
        style={style}
    />;
}
