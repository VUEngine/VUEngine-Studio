import React from 'react';
import styled from 'styled-components';
import {
    NOTE_RESOLUTION,
    NOTES_SPECTRUM,
    PIANO_ROLL_GRID_METER_HEIGHT,
    PIANO_ROLL_GRID_PLACED_PATTERN_HEIGHT,
    PIANO_ROLL_KEY_WIDTH,
    ScrollWindow,
    SEQUENCER_GRID_METER_HEIGHT,
    SoundData
} from '../SoundEditorTypes';

export enum StepIndicatorPosition {
    SEQUENCER = 0,
    PIANO_ROLL_HEADER = 1,
    PIANO_ROLL = 2,
}

export const StyledStepIndicator = styled.div`
    background-color: var(--theia-focusBorder);
    left: 0;
    position: absolute;
    top: 1px;
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
    position: StepIndicatorPosition
    effectsPanelHidden: boolean
    hidden: boolean
    pianoRollNoteHeight: number
    pianoRollNoteWidth: number
    sequencerPatternHeight: number
    sequencerPatternWidth: number
    pianoRollScrollWindow?: ScrollWindow
}

export default function StepIndicator(props: StepIndicatorProps): React.JSX.Element {
    const {
        soundData,
        currentPlayerPosition,
        position,
        effectsPanelHidden,
        hidden,
        pianoRollNoteHeight, pianoRollNoteWidth,
        sequencerPatternHeight, sequencerPatternWidth,
        pianoRollScrollWindow,
    } = props;

    // const effectsPanelHeight = effectsPanelHidden ? EFFECTS_PANEL_COLLAPSED_HEIGHT : EFFECTS_PANEL_EXPANDED_HEIGHT;
    const effectsPanelHeight = effectsPanelHidden ? 0 : 0;

    const style = {
        display: hidden ? 'none' : undefined,
        left: position === StepIndicatorPosition.SEQUENCER
            ? currentPlayerPosition * sequencerPatternWidth / NOTE_RESOLUTION
            : position === StepIndicatorPosition.PIANO_ROLL_HEADER
                ? PIANO_ROLL_KEY_WIDTH + 2 + currentPlayerPosition * pianoRollNoteWidth - (pianoRollScrollWindow?.x ?? 0)
                : PIANO_ROLL_KEY_WIDTH + 2 + currentPlayerPosition * pianoRollNoteWidth,
        height: position === StepIndicatorPosition.SEQUENCER
            ? soundData.tracks.length * sequencerPatternHeight + SEQUENCER_GRID_METER_HEIGHT
            : position === StepIndicatorPosition.PIANO_ROLL_HEADER
                ? PIANO_ROLL_GRID_METER_HEIGHT + PIANO_ROLL_GRID_PLACED_PATTERN_HEIGHT
                : PIANO_ROLL_GRID_METER_HEIGHT + PIANO_ROLL_GRID_PLACED_PATTERN_HEIGHT + NOTES_SPECTRUM * pianoRollNoteHeight + effectsPanelHeight
    };

    return <StyledStepIndicator style={style} />;
}
