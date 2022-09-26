import React from 'react';

interface StepIndicatorProps {
    currentStep: number
    pianoRollSize: number | undefined
    hidden: boolean
}

export default function StepIndicator(props: StepIndicatorProps): JSX.Element {
    const { currentStep, pianoRollSize, hidden } = props;

    const classNames = ['stepIndicator'];
    if (hidden) {
        classNames.push('hidden');
    }

    let offset = '';
    if (pianoRollSize) {
        offset = `calc(65px + (${currentStep} / ${pianoRollSize} * calc(100% - 67px - 10px)))`;
    } else {
        offset = `${65 + currentStep * 2}px`;
    }

    const style = {
        left: offset
    };

    return <div
        className={classNames.join(' ')}
        style={style}
    />;
}
