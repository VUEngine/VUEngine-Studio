import React from 'react';

interface StepIndicatorProps {
    currentStep: number
    playing: boolean
}

export default function StepIndicator(props: StepIndicatorProps): JSX.Element {
    const { currentStep, playing } = props;

    const classNames = ['stepIndicator'];
    if (!playing) {
        classNames.push('stopped');
    }

    const style = {
        left: `${67 + currentStep}px`
    };

    return <div
        className={classNames.join(' ')}
        style={style}
    />;
}
