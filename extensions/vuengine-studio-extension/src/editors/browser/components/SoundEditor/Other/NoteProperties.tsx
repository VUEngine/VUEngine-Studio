import { ArrowLeft, ArrowRight, Magnet, SkipBack, SkipForward, Trash } from '@phosphor-icons/react';
import { nls } from '@theia/core';
import React, { Dispatch, SetStateAction, useContext } from 'react';
import styled from 'styled-components';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import AdvancedSelect from '../../Common/Base/AdvancedSelect';
import HContainer from '../../Common/Base/HContainer';
import Input from '../../Common/Base/Input';
import VContainer from '../../Common/Base/VContainer';
import { COLOR_PALETTE, DEFAULT_COLOR_INDEX } from '../../Common/PaletteColorSelect';
import StepInput from '../EventList/StepInput';
import { InputWithAction, InputWithActionButton } from '../Instruments/Instruments';
import { getInstrumentName, getNoteSlideLabel } from '../SoundEditor';
import { SoundEditorCommands } from '../SoundEditorCommands';
import {
    DEFAULT_BARS_PER_PATTERN,
    DEFAULT_NEW_NOTE,
    EventsMap,
    NOTES_LABELS,
    PatternConfig,
    SOUND_EVENT_LABELS,
    SoundData,
    SoundEvent,
    SUB_NOTE_RESOLUTION,
    TRACK_DEFAULT_INSTRUMENT_ID,
    TRACK_DEFAULT_INSTRUMENT_NAME,
    TRACK_TYPE_INSTRUMENT_COMPATIBILITY
} from '../SoundEditorTypes';

const NoNote = styled.div`
    font-style: italic;
    opacity: 0.5;
    user-select: none;
`;

interface NotePropertiesProps {
    soundData: SoundData
    currentTrackId: number
    noteSnapping: boolean
    noteCursor: number
    setNoteCursor: Dispatch<SetStateAction<number>>
    currentSequenceIndex: number
    pattern: PatternConfig
    emulatorInitialized: boolean
    playingTestNote: boolean
    playNote: (note: string, instrumentId?: string) => void
    setNotes: (notes: EventsMap) => void
    newNoteDuration: number
    stepsPerBar: number
    setNoteDialogOpen: Dispatch<SetStateAction<boolean>>
}

export default function NoteProperties(props: NotePropertiesProps): React.JSX.Element {
    const {
        soundData,
        currentTrackId,
        noteSnapping,
        noteCursor, setNoteCursor,
        currentSequenceIndex,
        pattern,
        emulatorInitialized,
        playingTestNote,
        playNote,
        setNotes,
        newNoteDuration,
        stepsPerBar,
        setNoteDialogOpen,
    } = props;
    const { services } = useContext(EditorsContext) as EditorsContextType;

    const patternStepOffset = currentSequenceIndex * SUB_NOTE_RESOLUTION;
    const relativeStep = noteCursor - patternStepOffset;
    const events = pattern?.events[relativeStep] ?? {};
    const note = events[SoundEvent.Note];
    const instrumentId = events[SoundEvent.Instrument];
    const noteSlide = events[SoundEvent.NoteSlide];
    const duration = events[SoundEvent.Duration] ?? SUB_NOTE_RESOLUTION;

    const currentPatternSize = pattern
        ? pattern.size * SUB_NOTE_RESOLUTION
        : stepsPerBar * DEFAULT_BARS_PER_PATTERN;

    const addNote = () =>
        setNotes({
            [relativeStep]: {
                [SoundEvent.Note]: DEFAULT_NEW_NOTE,
                [SoundEvent.Duration]: newNoteDuration,
            }
        });

    const testNote = () => playingTestNote
        ? playNote('')
        : playNote(note, instrumentId);

    const deleteNote = () =>
        setNotes({
            [relativeStep]: {}
        });

    return (
        <VContainer gap={15} grow={1}>
            <VContainer>
                <label>
                    {nls.localize('vuengine/editors/sound/noteCursor', 'Note Cursor')}
                </label>
                <HContainer>
                    <Input
                        type='number'
                        value={noteCursor}
                        setValue={nc => setNoteCursor(nc as number)}
                        min={patternStepOffset}
                        max={currentPatternSize - SUB_NOTE_RESOLUTION + patternStepOffset}
                        step={SUB_NOTE_RESOLUTION}
                        grow={1}
                    />
                    <button
                        className='theia-button secondary'
                        title={
                            SoundEditorCommands.PIANO_ROLL_SELECT_PREVIOUS_NOTE.label +
                            services.vesCommonService.getKeybindingLabel(SoundEditorCommands.PIANO_ROLL_SELECT_PREVIOUS_NOTE.id, true)
                        }
                        onClick={() => services.commandService.executeCommand(SoundEditorCommands.PIANO_ROLL_SELECT_PREVIOUS_NOTE.id)}
                    >
                        <SkipBack size={17} />
                    </button>
                    <button
                        className='theia-button secondary'
                        title={
                            SoundEditorCommands.PIANO_ROLL_SELECT_PREVIOUS_STEP.label +
                            services.vesCommonService.getKeybindingLabel(SoundEditorCommands.PIANO_ROLL_SELECT_PREVIOUS_STEP.id, true)
                        }
                        onClick={() => services.commandService.executeCommand(SoundEditorCommands.PIANO_ROLL_SELECT_PREVIOUS_STEP.id)}
                    >
                        <ArrowLeft size={17} />
                    </button>
                    <button
                        className='theia-button secondary'
                        title={
                            SoundEditorCommands.PIANO_ROLL_SELECT_NEXT_STEP.label +
                            services.vesCommonService.getKeybindingLabel(SoundEditorCommands.PIANO_ROLL_SELECT_NEXT_STEP.id, true)
                        }
                        onClick={() => services.commandService.executeCommand(SoundEditorCommands.PIANO_ROLL_SELECT_NEXT_STEP.id)}
                    >
                        <ArrowRight size={17} />
                    </button>
                    <button
                        className='theia-button secondary'
                        title={
                            SoundEditorCommands.PIANO_ROLL_SELECT_NEXT_NOTE.label +
                            services.vesCommonService.getKeybindingLabel(SoundEditorCommands.PIANO_ROLL_SELECT_NEXT_NOTE.id, true)
                        }
                        onClick={() => services.commandService.executeCommand(SoundEditorCommands.PIANO_ROLL_SELECT_NEXT_NOTE.id)}
                    >
                        <SkipForward size={17} />
                    </button>
                </HContainer>
            </VContainer>
            <hr />
            {Object.keys(events).length > 0 ? (
                <VContainer gap={20}>
                    <HContainer gap={20}>
                        <VContainer>
                            <label>
                                {nls.localize('vuengine/editors/sound/step', 'Step')}
                            </label>
                            <HContainer>
                                <StepInput
                                    step={relativeStep}
                                    events={events}
                                    noteSnapping={noteSnapping}
                                    patternSize={pattern.size}
                                    patternStepOffset={patternStepOffset}
                                    setNotes={setNotes}
                                    setNoteCursor={setNoteCursor}
                                    width={64}
                                />
                                <button
                                    className="theia-button secondary"
                                    title={nls.localizeByDefault('Delete')}
                                    onClick={deleteNote}
                                >
                                    <Trash size={17} />
                                </button>
                            </HContainer>
                        </VContainer>
                        <VContainer>
                            <label>
                                {SOUND_EVENT_LABELS[SoundEvent.Duration]}
                            </label>
                            <HContainer>
                                <Input
                                    type='number'
                                    min={noteSnapping ? SUB_NOTE_RESOLUTION : 1}
                                    step={noteSnapping ? SUB_NOTE_RESOLUTION : 1}
                                    value={duration}
                                    setValue={v => {
                                        setNotes({
                                            [relativeStep]: {
                                                [SoundEvent.Duration]: v
                                            }
                                        });
                                    }}
                                    width={64}
                                />
                                <button
                                    className={`theia-button ${noteSnapping ? 'primary' : 'secondary'}`}
                                    title={`${SoundEditorCommands.TOGGLE_NOTE_SNAPPING.label}${services.vesCommonService.getKeybindingLabel(
                                        SoundEditorCommands.TOGGLE_NOTE_SNAPPING.id,
                                        true
                                    )}`}
                                    onClick={() => services.commandService.executeCommand(SoundEditorCommands.TOGGLE_NOTE_SNAPPING.id)}
                                >
                                    <Magnet size={17} />
                                </button>
                            </HContainer>
                        </VContainer>
                        <VContainer>
                            <label>
                                {SOUND_EVENT_LABELS[SoundEvent.Note]}
                            </label>
                            <HContainer>
                                <VContainer>
                                    <AdvancedSelect
                                        options={[
                                            {
                                                value: '',
                                                label: nls.localizeByDefault('none'),
                                            },
                                            ...NOTES_LABELS
                                                .map(n => ({
                                                    value: n,
                                                    label: n,
                                                }))
                                        ]}
                                        defaultValue={note}
                                        title={note}
                                        onChange={options => {
                                            setNotes({
                                                [relativeStep]: {
                                                    [SoundEvent.Note]: options[0] ?? undefined
                                                }
                                            });
                                        }}
                                        maxMenuHeight={104}
                                        style={{ width: 64 }}
                                    />
                                </VContainer>
                                <button
                                    className={`theia-button ${playingTestNote ? 'primary' : 'secondary'}`}
                                    onClick={testNote}
                                    disabled={!emulatorInitialized}
                                >
                                    <i className={`codicon codicon-debug-${playingTestNote ? 'pause' : 'start'}`} />
                                </button>
                            </HContainer>
                        </VContainer>
                        {note &&
                            <VContainer>
                                <label>
                                    {SOUND_EVENT_LABELS[SoundEvent.NoteSlide]}
                                </label>
                                <HContainer alignItems='center'>
                                    <Input
                                        type='number'
                                        clearable
                                        defaultValue={0}
                                        value={noteSlide ?? 0}
                                        setValue={v => {
                                            setNotes({
                                                [relativeStep]: {
                                                    [SoundEvent.NoteSlide]: v === 0 ? undefined : v
                                                }
                                            });
                                        }}
                                        width={64}
                                    />
                                    <Input
                                        value={getNoteSlideLabel(note, noteSlide)}
                                        disabled
                                        readOnly
                                        width={48}
                                    />
                                </HContainer>
                            </VContainer>
                        }
                    </HContainer>
                    <VContainer grow={1}>
                        <label>{SOUND_EVENT_LABELS[SoundEvent.Instrument]}</label>
                        <InputWithAction>
                            <AdvancedSelect
                                options={[
                                    {
                                        value: TRACK_DEFAULT_INSTRUMENT_ID,
                                        label: TRACK_DEFAULT_INSTRUMENT_NAME,
                                    },
                                    ...Object.keys(soundData.instruments)
                                        .filter(iid => {
                                            const instr = soundData.instruments[iid];
                                            return iid ===
                                                instrumentId ||
                                                TRACK_TYPE_INSTRUMENT_COMPATIBILITY[soundData.tracks[currentTrackId].type].includes(instr.type);
                                        })
                                        .sort((a, b) => (soundData.instruments[a].name.length
                                            ? soundData.instruments[a].name
                                            : 'zzz').localeCompare(
                                                (soundData.instruments[b].name.length
                                                    ? soundData.instruments[b].name
                                                    : 'zzz')
                                            ))
                                        .map(instrId => ({
                                            value: `${instrId}`,
                                            label: getInstrumentName(soundData, instrId),
                                            backgroundColor: COLOR_PALETTE[soundData.instruments[instrId].color ?? DEFAULT_COLOR_INDEX],
                                        }))
                                ]}
                                title={getInstrumentName(soundData, instrumentId ?? TRACK_DEFAULT_INSTRUMENT_ID)}
                                defaultValue={instrumentId ?? TRACK_DEFAULT_INSTRUMENT_ID}
                                onChange={options => {
                                    setNotes({
                                        [relativeStep]: {
                                            [SoundEvent.Instrument]:
                                                (options[0] === TRACK_DEFAULT_INSTRUMENT_ID ||
                                                    options[0] === soundData.tracks[currentTrackId].instrument)
                                                    ? ''
                                                    : options[0]
                                        }
                                    });
                                }}
                                menuPlacement='top'
                            />
                            <InputWithActionButton
                                className='theia-button secondary'
                                title={
                                    SoundEditorCommands.OPEN_INSTRUMENT_EDITOR.label +
                                    services.vesCommonService.getKeybindingLabel(SoundEditorCommands.OPEN_INSTRUMENT_EDITOR.id, true)
                                }
                                onClick={() => {
                                    services.commandService.executeCommand(SoundEditorCommands.OPEN_INSTRUMENT_EDITOR.id);
                                    setNoteDialogOpen(false);
                                }}
                            >
                                <i className='codicon codicon-settings-gear' />
                            </InputWithActionButton>
                        </InputWithAction>
                    </VContainer>

                </VContainer>
            ) : (
                <VContainer gap={15} style={{ alignSelf: 'start' }}>
                    <NoNote>
                        {nls.localize('vuengine/editors/sound/noNoteAtNoteCursor', 'No Note At Note Cursor')}
                    </NoNote>
                    <button
                        className='theia-button add-button full-width'
                        onClick={addNote}
                        title={nls.localizeByDefault('Add')}
                    >
                        <i className='codicon codicon-plus' />
                    </button>
                </VContainer>
            )
            }

        </VContainer >
    );
}
