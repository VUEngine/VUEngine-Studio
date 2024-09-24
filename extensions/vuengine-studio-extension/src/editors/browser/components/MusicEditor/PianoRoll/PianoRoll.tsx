import React from 'react';
import { BAR_PATTERN_LENGTH_MULT_MAP, MusicEditorTool, SongData } from '../MusicEditorTypes';
import StepIndicator from '../Sequencer/StepIndicator';
import NoteProperties from './NoteProperties';
import PianoRollEditor from './PianoRollEditor';
import PianoRollHeader from './PianoRollHeader';
import { StyledPianoRoll } from './StyledComponents';

interface PianoRollProps {
    songData: SongData
    currentNote: number
    setCurrentNote: (currentNote: number) => void
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
}

export default function PianoRoll(props: PianoRollProps): React.JSX.Element {
    const {
        songData,
        currentNote, setCurrentNote,
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
    } = props;

    const channel = songData.channels[currentChannelId];

    if (currentPatternId === -1) {
        return <>
            {/* nls.localize('vuengine/musicEditor/selectPatternToEdit', 'Select a pattern to edit') */}
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

    return <StyledPianoRoll>
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
            currentNote={currentNote}
            setCurrentNote={setCurrentNote}
            setNote={setNote}
            playNote={playNote}
            tool={tool}
        />
        <NoteProperties
            songData={songData}
            setCurrentNote={setCurrentNote}
            currentChannelId={currentChannelId}
            currentPatternId={currentPatternId}
            setNote={setNote}
        />
    </StyledPianoRoll>;
}
