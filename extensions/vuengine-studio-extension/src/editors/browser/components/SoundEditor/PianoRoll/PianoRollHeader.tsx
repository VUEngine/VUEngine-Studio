import React, { Dispatch, SetStateAction, useContext } from 'react';
import styled from 'styled-components';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import { SoundEditorCommands } from '../SoundEditorCommands';
import { PIANO_ROLL_GRID_METER_HEIGHT, PIANO_ROLL_KEY_WIDTH, SoundData } from '../SoundEditorTypes';
import PianoRollHeaderGrid from './PianoRollHeaderGrid';

export const MetaLine = styled.div`
    background: var(--theia-editor-background);
    border-top: 1px solid rgba(255, 255, 255, .6);
    box-sizing: border-box;
    display: flex;
    flex-direction: row;
    flex-grow: 1;
    left: 0;
    position: sticky;
    transition: all .2s;
    z-index: 200;

    body.theia-light &,
    body.theia-hc & {
        border-top-color: rgba(0, 0, 0, .6);
    }
`;

export const MetaLineHeader = styled.div`
    background: var(--theia-editor-background);
    border-bottom: 1px solid rgba(255, 255, 255, .4);
    border-right: 1px solid rgba(255, 255, 255, .4);
    border-top: 1px solid transparent;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    left: 0;
    max-width: ${PIANO_ROLL_KEY_WIDTH + 2}px;
    min-width: ${PIANO_ROLL_KEY_WIDTH + 2}px;
    overflow: hidden;
    position: sticky;
    z-index: 10;

    body.theia-light &,
    body.theia-hc & {
        border-bottom-color: rgba(0, 0, 0, .4);
        border-right-color: rgba(0, 0, 0, .4);
    }
`;

const StyledToggleButton = styled.button`
    align-items: center;
    background-color: transparent;
    border: none;
    color: var(--theia-editor-foreground);
    cursor: pointer;
    display: flex;
    font-size: 10px;
    justify-content: center;
    min-height: ${PIANO_ROLL_GRID_METER_HEIGHT - 2}px !important;
    outline-offset: -1px;

    &:hover {
        background-color: var(--theia-focusBorder);
        color: #fff;
    }
`;

interface PianoRollHeaderProps {
    soundData: SoundData
    currentChannelId: number
    currentPatternId: string
    currentPatternNoteOffset: number
    playRangeStart: number
    setPlayRangeStart: (playRangeStart: number) => void
    playRangeEnd: number
    setPlayRangeEnd: (playRangeEnd: number) => void
    setCurrentStep: Dispatch<SetStateAction<number>>
    sequencerHidden: boolean,
    setSequencerHidden: Dispatch<SetStateAction<boolean>>
}

export default function PianoRollHeader(props: PianoRollHeaderProps): React.JSX.Element {
    const {
        soundData,
        // currentChannelId,
        // currentPatternId,
        currentPatternNoteOffset,
        // playRangeStart, setPlayRangeStart,
        // playRangeEnd, setPlayRangeEnd,
        setCurrentStep,
        sequencerHidden, setSequencerHidden,
    } = props;
    const { services } = useContext(EditorsContext) as EditorsContextType;

    const sequencerToggleCommand = SoundEditorCommands.TOGGLE_SEQUENCER_VISIBILITY;

    return <MetaLine
        style={{
            borderTopWidth: 0,
            top: 0,
        }}
    >
        <MetaLineHeader
            style={{ minHeight: 18 }}
        >
            <StyledToggleButton
                onClick={() => setSequencerHidden(prev => !prev)}
                title={
                    `${sequencerToggleCommand.label}${services.vesCommonService.getKeybindingLabel(sequencerToggleCommand.id, true)}`
                }
            >
                <i className={sequencerHidden ? 'fa fa-chevron-down' : 'fa fa-chevron-up'} />
            </StyledToggleButton>
        </MetaLineHeader>
        <PianoRollHeaderGrid
            soundData={soundData}
            currentPatternNoteOffset={currentPatternNoteOffset}
            setCurrentStep={setCurrentStep}
        />
    </MetaLine>;
};
