import React from 'react';
import {
    EFFECTS_PANEL_EXPANDED_HEIGHT,
    NOTE_RESOLUTION,
    NOTES_SPECTRUM,
    PATTERN_HEIGHT,
    PIANO_ROLL_GRID_METER_HEIGHT,
    PIANO_ROLL_KEY_WIDTH,
    PIANO_ROLL_NOTE_HEIGHT,
    PIANO_ROLL_NOTE_WIDTH,
    SEQUENCER_GRID_METER_HEIGHT,
    SoundData,
} from '../SoundEditorTypes';
import { StyledStepIndicator } from './StyledComponents';

interface StepIndicatorProps {
    soundData: SoundData
    currentStep: number
    isPianoRoll: boolean
    hidden: boolean
}

export default function StepIndicator(props: StepIndicatorProps): React.JSX.Element {
    const { soundData, currentStep, isPianoRoll, hidden } = props;

    const style = {
        display: hidden ? 'none' : undefined,
        left: isPianoRoll
            ? PIANO_ROLL_KEY_WIDTH + currentStep * PIANO_ROLL_NOTE_WIDTH + 1
            : PIANO_ROLL_KEY_WIDTH + currentStep * Math.max(0, 16 / NOTE_RESOLUTION) + 1,
        height: isPianoRoll
            ? PIANO_ROLL_GRID_METER_HEIGHT + NOTES_SPECTRUM * PIANO_ROLL_NOTE_HEIGHT + EFFECTS_PANEL_EXPANDED_HEIGHT
            : soundData.channels.length * PATTERN_HEIGHT + SEQUENCER_GRID_METER_HEIGHT,
    };

    return <StyledStepIndicator style={style} />;
}
