import React from 'react';
import styled from 'styled-components';
import {
    EFFECTS_PANEL_COLLAPSED_HEIGHT,
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

export const StyledStepIndicator = styled.div`
    background-color: var(--theia-focusBorder);
    left: 0;
    position: absolute;
    top: 0;
    width: 1px;
    z-index: 250;

    &:before {
        border-left: 4px solid transparent;
        border-right: 4px solid transparent;
        border-top: 9px solid var(--theia-focusBorder);
        content: '';
        display: block;
        height: 0;
        margin-left: -4px;
        position: sticky;
        top: 0;
        width: 1px;
    }
`;

interface StepIndicatorProps {
    soundData: SoundData
    currentStep: number
    isPianoRoll: boolean
    effectsPanelHidden: boolean
    hidden: boolean
}

export default function StepIndicator(props: StepIndicatorProps): React.JSX.Element {
    const { soundData, currentStep, isPianoRoll, effectsPanelHidden, hidden } = props;

    const effectsPanelHeight = effectsPanelHidden ? EFFECTS_PANEL_COLLAPSED_HEIGHT : EFFECTS_PANEL_EXPANDED_HEIGHT;

    const style = {
        display: hidden ? 'none' : undefined,
        left: isPianoRoll
            ? PIANO_ROLL_KEY_WIDTH + currentStep * PIANO_ROLL_NOTE_WIDTH + 1
            : PIANO_ROLL_KEY_WIDTH + currentStep * Math.max(0, 16 / NOTE_RESOLUTION) + 1,
        height: isPianoRoll
            ? PIANO_ROLL_GRID_METER_HEIGHT + NOTES_SPECTRUM * PIANO_ROLL_NOTE_HEIGHT + effectsPanelHeight
            : soundData.channels.length * PATTERN_HEIGHT + SEQUENCER_GRID_METER_HEIGHT,
    };

    return <StyledStepIndicator style={style} />;
}
