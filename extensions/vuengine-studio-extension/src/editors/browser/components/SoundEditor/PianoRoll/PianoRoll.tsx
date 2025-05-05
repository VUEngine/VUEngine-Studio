import React, { Dispatch, SetStateAction, useEffect } from 'react';
import { EDITORS_COMMAND_EXECUTED_EVENT_NAME } from '../../../ves-editors-types';
import StepIndicator from '../Sequencer/StepIndicator';
import { SoundEditorCommands } from '../SoundEditorCommands';
import { NOTE_RESOLUTION, SoundData } from '../SoundEditorTypes';
import NoteProperties from './NoteProperties';
import PianoRollEditor from './PianoRollEditor';
import PianoRollHeader from './PianoRollHeader';
import { StyledPianoRoll } from './StyledComponents';
import AdvancedSelect from '../../Common/Base/AdvancedSelect';

interface PianoRollProps {
    songData: SoundData
    currentTick: number
    setCurrentTick: (currentTick: number) => void
    currentChannelId: number
    currentPatternId: number
    currentPatternNoteOffset: number
    currentSequenceIndex: number
    currentStep: number
    setCurrentStep: Dispatch<SetStateAction<number>>
    playRangeStart: number
    setPlayRangeStart: (playRangeStart: number) => void
    playRangeEnd: number
    setPlayRangeEnd: (playRangeEnd: number) => void
    setNote: (step: number, note?: number) => void
    playNote: (note: number) => void
    newNoteDuration: number
    setNewNoteDuration: Dispatch<SetStateAction<number>>
}

export default function PianoRoll(props: PianoRollProps): React.JSX.Element {
    const {
        songData,
        currentTick, setCurrentTick,
        currentChannelId,
        currentPatternId,
        currentPatternNoteOffset,
        currentSequenceIndex,
        currentStep, setCurrentStep,
        playRangeStart, setPlayRangeStart,
        playRangeEnd, setPlayRangeEnd,
        setNote,
        playNote,
        newNoteDuration, setNewNoteDuration
    } = props;

    const channel = songData.channels[currentChannelId];
    const pattern = channel.patterns[currentPatternId];

    const classNames = [
        `noteResolution-${NOTE_RESOLUTION}`,
        `currentTick-${currentTick}`,
        `size-${pattern.size}`,
    ];

    if (currentPatternId === -1) {
        return <>
            {/* nls.localize('vuengine/editors/sound/selectPatternToEdit', 'Select a pattern to edit') */}
        </>;
    }

    let currentPatternStep = -1;
    if (channel.id === currentChannelId) {
        let patternStartStep = 0;
        channel.sequence.forEach((patternId, index) => {
            const p = channel.patterns[patternId];
            const pSize = p.size * NOTE_RESOLUTION;
            const pEndStep = patternStartStep + pSize;
            if (index === currentSequenceIndex && currentStep >= patternStartStep && currentStep < pEndStep) {
                currentPatternStep = currentStep - patternStartStep;
                return;
            }
            patternStartStep += pSize;
        });
    }

    const commandListener = (e: CustomEvent): void => {
        switch (e.detail) {
            case SoundEditorCommands.PIANO_ROLL_SELECT_NEXT_TICK.id:
                const p = songData.channels[currentChannelId].patterns[currentPatternId];
                const pSize = p.size * NOTE_RESOLUTION;
                if (currentTick < pSize - 1) {
                    setCurrentTick(currentTick + 1);
                }
                break;
            case SoundEditorCommands.PIANO_ROLL_SELECT_PREVIOUS_TICK.id:
                if (currentTick > 0) {
                    setCurrentTick(currentTick - 1);
                }
                break;
            case SoundEditorCommands.REMOVE_CURRENT_NOTE.id:
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
            isPianoRoll={true}
            hidden={currentStep === -1 || currentPatternStep === -1}
        />}
        <AdvancedSelect
            defaultValue={newNoteDuration.toString()}
            onChange={options => setNewNoteDuration(parseInt(options[0]))}
            options={[{
                label: '1',
                value: '16'
            }, {
                label: '1/2',
                value: '8'
            }, {
                label: '1/4',
                value: '4'
            }, {
                label: '1/8',
                value: '2'
            }, {
                label: '1/16',
                value: '1'
            }]}
            width={50}
            small={true}
            style={{
                marginBottom: -16,
                position: 'relative',
                zIndex: 300,
            }}
        />
        <PianoRollHeader
            songData={songData}
            currentChannelId={currentChannelId}
            currentPatternId={currentPatternId}
            currentPatternNoteOffset={currentPatternNoteOffset}
            playRangeStart={playRangeStart}
            setPlayRangeStart={setPlayRangeStart}
            playRangeEnd={playRangeEnd}
            setPlayRangeEnd={setPlayRangeEnd}
            setCurrentStep={setCurrentStep}
        />
        <PianoRollEditor
            songData={songData}
            currentChannelId={currentChannelId}
            currentPatternId={currentPatternId}
            currentPatternNoteOffset={currentPatternNoteOffset}
            currentSequenceIndex={currentSequenceIndex}
            currentTick={currentTick}
            setCurrentTick={setCurrentTick}
            setNote={setNote}
            playNote={playNote}
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
