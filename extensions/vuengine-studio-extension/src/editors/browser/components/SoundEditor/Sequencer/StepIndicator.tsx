import React from 'react';
import styled from 'styled-components';
import {
    EFFECTS_PANEL_COLLAPSED_HEIGHT,
    EFFECTS_PANEL_EXPANDED_HEIGHT,
    NOTE_RESOLUTION,
    NOTES_SPECTRUM,
    PIANO_ROLL_GRID_METER_HEIGHT,
    PIANO_ROLL_GRID_PLACED_PATTERN_HEIGHT,
    PIANO_ROLL_KEY_WIDTH,
    SEQUENCER_GRID_METER_HEIGHT,
    SoundData
} from '../SoundEditorTypes';

export const StyledStepIndicator = styled.div`
    background-color: var(--theia-focusBorder);
    left: 0;
    position: absolute;
    top: 0;
    width: 1px;
    z-index: 150;

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
    currentPlayerPosition: number
    isPianoRoll: boolean
    effectsPanelHidden: boolean
    hidden: boolean
    pianoRollNoteHeight: number
    pianoRollNoteWidth: number
    sequencerPatternHeight: number
    sequencerPatternWidth: number
}

export default function StepIndicator(props: StepIndicatorProps): React.JSX.Element {
    const {
        soundData,
        currentPlayerPosition,
        isPianoRoll,
        effectsPanelHidden,
        hidden,
        pianoRollNoteHeight, pianoRollNoteWidth,
        sequencerPatternHeight, sequencerPatternWidth,
    } = props;

    const effectsPanelHeight = effectsPanelHidden ? EFFECTS_PANEL_COLLAPSED_HEIGHT : EFFECTS_PANEL_EXPANDED_HEIGHT;

    const style = {
        display: hidden ? 'none' : undefined,
        left: isPianoRoll
            ? PIANO_ROLL_KEY_WIDTH + 2 + currentPlayerPosition * pianoRollNoteWidth
            : currentPlayerPosition * sequencerPatternWidth / NOTE_RESOLUTION,
        height: isPianoRoll
            ? PIANO_ROLL_GRID_METER_HEIGHT + PIANO_ROLL_GRID_PLACED_PATTERN_HEIGHT + NOTES_SPECTRUM * pianoRollNoteHeight + effectsPanelHeight
            : soundData.tracks.length * sequencerPatternHeight + SEQUENCER_GRID_METER_HEIGHT,
    };

    return <StyledStepIndicator style={style} />;
}
