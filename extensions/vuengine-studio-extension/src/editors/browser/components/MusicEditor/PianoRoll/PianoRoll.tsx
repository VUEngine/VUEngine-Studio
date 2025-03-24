import React, { Dispatch, SetStateAction, useEffect } from 'react';
import { EDITORS_COMMAND_EXECUTED_EVENT_NAME } from '../../../ves-editors-types';
import { BAR_PATTERN_LENGTH_MULT_MAP, MusicEditorTool, SongData } from '../MusicEditorTypes';
import StepIndicator from '../Sequencer/StepIndicator';
import NoteProperties from './NoteProperties';
import PianoRollEditor from './PianoRollEditor';
import PianoRollHeader from './PianoRollHeader';
import { StyledPianoRoll } from './StyledComponents';
import { MusicEditorCommands } from '../MusicEditorCommands';

interface PianoRollProps {
    songData: SongData
    currentTick: number
    setCurrentTick: (currentTick: number) => void
    currentChannelId: number
    currentPatternId: number
    currentPatternNoteOffset: number
    currentSequenceIndex: number
    currentStep: number
    playRangeStart: number
    setPlayRangeStart: (playRangeStart: number) => void
    playRangeEnd: number
    setPlayRangeEnd: (playRangeEnd: number) => void
    setNote: (index: number, note: number | undefined) => void
    playNote: (note: number) => void
    tool: MusicEditorTool
    lastSetNoteId: number
    setLastSetNoteId: Dispatch<SetStateAction<number>>
}

export default function PianoRoll(props: PianoRollProps): React.JSX.Element {
    const {
        songData,
        currentTick, setCurrentTick,
        currentChannelId,
        currentPatternId,
        currentPatternNoteOffset,
        currentSequenceIndex,
        currentStep,
        playRangeStart, setPlayRangeStart,
        playRangeEnd, setPlayRangeEnd,
        setNote,
        playNote,
        tool,
        lastSetNoteId, setLastSetNoteId,
    } = props;

    const channel = songData.channels[currentChannelId];

    const classNames = [
        `noteResolution-${songData.noteResolution}`,
        `currentTick-${currentTick}`,
    ];

    if (currentPatternId === -1) {
        return <>
            {/* nls.localize('vuengine/editors/music/selectPatternToEdit', 'Select a pattern to edit') */}
        </>;
    }

    let currentPatternStep = -1;
    if (channel.id === currentChannelId) {
        let patternStartStep = 0;
        channel.sequence.forEach((patternId, index) => {
            const pattern = channel.patterns[patternId];
            const patternSize = BAR_PATTERN_LENGTH_MULT_MAP[pattern.bar] * songData.noteResolution;
            const patternEndStep = patternStartStep + patternSize;
            if (index === currentSequenceIndex && currentStep >= patternStartStep && currentStep < patternEndStep) {
                currentPatternStep = currentStep - patternStartStep;
                return;
            }
            patternStartStep += patternSize;
        });
    }

    const commandListener = (e: CustomEvent): void => {
        switch (e.detail) {

            case MusicEditorCommands.PIANO_ROLL_SELECT_NEXT_TICK.id:
                const pattern = songData.channels[currentChannelId].patterns[currentPatternId];
                const patternSize = BAR_PATTERN_LENGTH_MULT_MAP[pattern.bar] * songData.noteResolution;
                if (currentTick < patternSize - 1) {
                    setCurrentTick(currentTick + 1);
                }
                break;
            case MusicEditorCommands.PIANO_ROLL_SELECT_PREVIOUS_TICK.id:
                if (currentTick > 0) {
                    setCurrentTick(currentTick - 1);
                }
                break;
            case MusicEditorCommands.REMOVE_CURRENT_NOTE.id:
                setNote(currentTick, undefined);
                break;
        }
    };

    useEffect(() => {
        document.addEventListener(EDITORS_COMMAND_EXECUTED_EVENT_NAME, commandListener);
        return () => {
            document.removeEventListener(EDITORS_COMMAND_EXECUTED_EVENT_NAME, commandListener);
        };
    }, [
        songData,
        currentTick,
    ]);

    return <StyledPianoRoll
        className={classNames.join(' ')}
    >
        {<StepIndicator
            currentStep={currentPatternStep}
            noteResolution={songData.noteResolution}
            isPianoRoll={true}
            hidden={currentStep === -1 || currentPatternStep === -1}
        />}
        <PianoRollHeader
            songData={songData}
            currentChannelId={currentChannelId}
            currentPatternId={currentPatternId}
            playRangeStart={playRangeStart}
            setPlayRangeStart={setPlayRangeStart}
            playRangeEnd={playRangeEnd}
            setPlayRangeEnd={setPlayRangeEnd}
        />
        <PianoRollEditor
            songData={songData}
            currentChannelId={currentChannelId}
            currentPatternId={currentPatternId}
            currentPatternNoteOffset={currentPatternNoteOffset}
            currentSequenceIndex={currentSequenceIndex}
            setCurrentTick={setCurrentTick}
            setNote={setNote}
            playNote={playNote}
            tool={tool}
            lastSetNoteId={lastSetNoteId}
            setLastSetNoteId={setLastSetNoteId}
        />
        <NoteProperties
            songData={songData}
            currentTick={currentTick}
            setCurrentTick={setCurrentTick}
            currentChannelId={currentChannelId}
            currentPatternId={currentPatternId}
            setNote={setNote}
        />
    </StyledPianoRoll>;
}
