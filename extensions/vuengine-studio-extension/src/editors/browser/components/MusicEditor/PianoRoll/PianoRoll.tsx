import React from 'react';
import { SongData } from '../MusicEditorTypes';
import StepIndicator from '../Sequencer/StepIndicator';
import NoteProperties from './NoteProperties';
import PianoRollEditor from './PianoRollEditor';
import PianoRollHeader from './PianoRollHeader';

interface PianoRollProps {
    songData: SongData
    currentNote: number
    setCurrentNote: (currentNote: number) => void
    currentChannelId: number
    currentPatternId: number
    currentPatternNoteOffset: number
    currentSequenceIndex: number
    currentStep: number
    playing: boolean
    getChannelName: (channelId: number) => string
    playRangeStart: number
    setPlayRangeStart: (playRangeStart: number) => void
    playRangeEnd: number
    setPlayRangeEnd: (playRangeEnd: number) => void
    setNote: (index: number, note: number | undefined) => void
    playNote: (note: number) => void
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
        playing,
        getChannelName,
        playRangeStart, setPlayRangeStart,
        playRangeEnd, setPlayRangeEnd,
        setNote,
        playNote,
    } = props;

    const channel = songData.channels[currentChannelId];
    const pattern = channel.patterns[currentPatternId];

    if (currentPatternId === -1) {
        return <>
            {/* nls.localize('vuengine/musicEditor/selectPatternToEdit', 'Select a pattern to edit') */}
        </>;
    }

    const classNames = ['pianoRoll'];
    classNames.push(`size-${pattern.size}`);

    let currentPatternStep = -1;
    if (channel.id === currentChannelId) {
        let patternStartStep = 0;
        channel.sequence.forEach((patternId, index) => {
            const patternSize = channel.patterns[patternId].size;
            const patternEndStep = patternStartStep + patternSize;
            if (patternId === currentPatternId && currentStep >= patternStartStep && currentStep < patternEndStep) {
                currentPatternStep = currentStep - patternStartStep;
                return;
            }
            patternStartStep += patternSize;
        });
    }

    return <div className={classNames.join(' ')}>
        {<StepIndicator
            currentStep={currentPatternStep}
            pianoRollSize={pattern.size}
            hidden={!playing || currentPatternStep === -1}
        />}
        <PianoRollHeader
            songData={songData}
            currentChannelId={currentChannelId}
            currentPatternId={currentPatternId}
            currentNote={currentNote}
            getChannelName={getChannelName}
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
        />
        <NoteProperties
            songData={songData}
            currentNote={currentNote}
            setCurrentNote={setCurrentNote}
            currentChannelId={currentChannelId}
            currentPatternId={currentPatternId}
            setNote={setNote}
        />
    </div>;
}
