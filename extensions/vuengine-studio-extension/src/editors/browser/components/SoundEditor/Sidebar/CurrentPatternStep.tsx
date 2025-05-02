import { nls, QuickPickItem, QuickPickOptions, QuickPickSeparator } from '@theia/core';
import React, { useContext, useMemo } from 'react';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import AdvancedSelect from '../../Common/Base/AdvancedSelect';
import Range from '../../Common/Base/Range';
import VContainer from '../../Common/Base/VContainer';
import { COLOR_PALETTE } from '../../Common/PaletteColorSelect';
import { clamp } from '../../Common/Utils';
import { INPUT_BLOCKING_COMMANDS } from '../SoundEditor';
import { BAR_PATTERN_LENGTH_MULT_MAP, EXCLUDED_SOUND_EVENTS, NOTE_RESOLUTION, NOTES, SINGLE_NOTE_TESTING_DURATION, SoundData, SoundEvent } from '../SoundEditorTypes';
import { AVAILABLE_EVENTS } from './AvailableEvents';
import Effect from './Effect';
import { InputWithAction, InputWithActionButton } from './Instruments';

interface CurrentPatternStepProps {
    songData: SoundData
    currentChannelId: number
    currentPatternId: number
    currentTick: number
    setCurrentTick: (tick: number) => void
    setCurrentPatternId: (channelId: number, patternId: number) => void
    updateEvents: (index: number, event: SoundEvent, value: any) => void
    playing: boolean
    testing: boolean
    setTesting: (testing: boolean) => void
    setTestingDuration: (note: number) => void
    setTestingNote: (note: number) => void
    setTestingInstrument: (instrument: string) => void
    setTestingChannel: (channel: number) => void
    emulatorInitialized: boolean
    editInstrument: (instrument: string) => void
}

export default function CurrentPatternStep(props: CurrentPatternStepProps): React.JSX.Element {
    const { services, disableCommands, enableCommands } = useContext(EditorsContext) as EditorsContextType;
    const {
        songData,
        currentChannelId, currentPatternId, currentTick: currentNote, setCurrentTick,
        updateEvents,
        playing,
        testing, setTesting, setTestingDuration, setTestingChannel, setTestingNote, setTestingInstrument,
        emulatorInitialized,
        editInstrument,
    } = props;

    const pattern = songData.channels[currentChannelId].patterns[currentPatternId];
    const patternSize = BAR_PATTERN_LENGTH_MULT_MAP[pattern?.bar ?? '4/4'] * NOTE_RESOLUTION;

    if (currentNote === -1) {
        return <VContainer gap={15} className="lightLabel">
            {nls.localize('vuengine/editors/sound/selectNoteToEditProperties', 'Select a note to edit its properties')}
        </VContainer>;
    }

    const events = pattern.events[currentNote] ?? {};
    const note = events ? events[SoundEvent.Note] ?? -1 : -1;
    const channel = songData.channels[currentChannelId];
    const instrumentId = (events[SoundEvent.Instrument] ?? channel.instrument) as string;
    const eventsWithoutNoteKeys = Object.keys(events).filter(e => !EXCLUDED_SOUND_EVENTS.includes(e as SoundEvent)) as SoundEvent[];
    const unusedEvents = Object.keys(AVAILABLE_EVENTS).filter(e => !eventsWithoutNoteKeys.includes(e as SoundEvent));

    const maxDuration = useMemo(() => {
        const patternLength = BAR_PATTERN_LENGTH_MULT_MAP[pattern.bar] * NOTE_RESOLUTION;
        const allEventKeys = Object.keys(pattern.events);
        const noteEventKeys: string[] = [];
        allEventKeys.forEach(key => {
            const event = pattern.events[parseInt(key)];
            if (event[SoundEvent.Note] !== undefined) {
                noteEventKeys.push(key);
            }
        });
        const noteIndex = noteEventKeys.indexOf(currentNote.toString());

        return noteEventKeys[noteIndex + 1] !== undefined
            ? parseInt(noteEventKeys[noteIndex + 1]) - currentNote
            : patternLength - currentNote;
    }, [
        currentNote,
        pattern.bar,
        pattern.events,
    ]);

    const startTesting = (noteId: number) => {
        setTesting(true);
        setTestingDuration(SINGLE_NOTE_TESTING_DURATION);
        setTestingNote(Object.values(NOTES)[noteId]);
        setTestingInstrument(songData.channels[currentChannelId].instrument);
        setTestingChannel(currentChannelId);
    };

    const stopTesting = () => {
        setTesting(false);
    };

    const addEvent = async () => {
        const event = await showNewEventSelection();
        if (event === undefined || event.id === undefined) {
            return;
        }

        updateEvents(currentNote, event.id as SoundEvent, AVAILABLE_EVENTS[event.id].defaultValue);
    };

    const removeEvent = (event: SoundEvent) =>
        updateEvents(currentNote, event, undefined);

    const showNewEventSelection = (): Promise<QuickPickItem | undefined> => {
        const quickPickOptions: QuickPickOptions<QuickPickItem> = {
            title: nls.localize('vuengine/editors/sound/addEffect', 'Add Effect'),
            placeholder: nls.localize('vuengine/editors/sound/selectEffectToAdd', 'Select an effect to add...'),
        };
        let previousCategory = '';
        const items: (QuickPickItem | QuickPickSeparator)[] = [];
        Object.values(AVAILABLE_EVENTS)
            .sort((a, b) => {
                if (a.category > b.category) { return -1; }
                if (a.category < b.category) { return 1; }
                if (a.label > b.label) { return 1; }
                if (a.label < b.label) { return -1; }
                return 0;
            })
            .filter(e => events[e.id] === undefined)
            .map(a => {
                if (previousCategory !== a.category) {
                    previousCategory = a.category;
                    items.push({
                        type: 'separator',
                        label: a.category,
                    });
                }
                items.push({
                    id: a.id,
                    label: a.label,
                    description: a.description,
                });
            });

        return services.quickPickService.show(
            items,
            quickPickOptions
        );
    };

    return (
        <VContainer gap={15}>
            <VContainer>
                <label>
                    {nls.localize('vuengine/editors/sound/currentPatternStep', 'Current Pattern Step')}
                </label>
                <input
                    className='theia-input'
                    type='number'
                    min={1}
                    max={patternSize}
                    value={currentNote + 1}
                    onChange={e => setCurrentTick(
                        e.target.value === ''
                            ? 0
                            : clamp(parseInt(e.target.value) - 1, 0, patternSize - 1, 0)
                    )}
                    onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                    onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                />
            </VContainer>
            <VContainer>
                <label>
                    {nls.localize('vuengine/editors/sound/note', 'Note')}
                </label>
                <InputWithAction>
                    <AdvancedSelect
                        options={[
                            {
                                value: 'undefined',
                                label: nls.localize('vuengine/editors/sound/none', 'None'),
                            },
                            ...Object.keys(NOTES).map((n, i) => ({
                                label: n,
                                value: i.toString(),
                            }))
                        ]}
                        defaultValue={note === -1 ? 'undefined' : note?.toString() ?? 'undefined'}
                        onChange={options => updateEvents(
                            currentNote,
                            SoundEvent.Note,
                            options[0] === 'undefined'
                                ? undefined
                                : parseInt(options[0])
                        )}
                        menuPlacement="top"
                        commands={INPUT_BLOCKING_COMMANDS}
                    />
                    <InputWithActionButton
                        className={`theia-button ${testing ? 'primary' : 'secondary'}`}
                        title={nls.localize('vuengine/editors/sound/try', 'Try')}
                        onClick={() => testing ? stopTesting() : startTesting(note)}
                        onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                        onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                        disabled={!emulatorInitialized || playing}
                    >
                        {testing
                            ? <i className='fa fa-stop' />
                            : <i className='fa fa-play' />
                        }

                    </InputWithActionButton>
                </InputWithAction>
            </VContainer>
            {note > -1 && <>
                <VContainer>
                    <label>
                        {nls.localize('vuengine/editors/sound/instrument', 'Instrument')}
                    </label>
                    <InputWithAction>
                        <AdvancedSelect
                            options={Object.keys(songData.instruments)
                                .sort((a, b) => songData.instruments[a].name.localeCompare(songData.instruments[b].name))
                                .map((instrId, i) => {
                                    const instr = songData.instruments[instrId];
                                    return {
                                        value: `${instrId}`,
                                        label: `${i + 1}: ${instr.name}`,
                                        disabled: instr.type !== channel.type,
                                        backgroundColor: COLOR_PALETTE[instr.color ?? 4],
                                    };
                                })}
                            defaultValue={instrumentId}
                            onChange={options => updateEvents(currentNote, SoundEvent.Instrument, options[0])}
                            commands={INPUT_BLOCKING_COMMANDS}
                        />

                        <InputWithActionButton
                            className='theia-button secondary'
                            title={nls.localize('vuengine/editors/sound/editInstrument', 'Edit Instrument')}
                            onClick={() => editInstrument(channel.instrument)}
                            onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                            onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                        >
                            <i className='codicon codicon-settings-gear' />
                        </InputWithActionButton>
                    </InputWithAction>
                </VContainer>
                <VContainer>
                    <label>
                        {nls.localize('vuengine/editors/sound/duration', 'Duration')}
                    </label>
                    <Range
                        value={events[SoundEvent.Duration] ?? 1}
                        setValue={d => updateEvents(currentNote, SoundEvent.Duration, d)}
                        min={1}
                        max={maxDuration}
                        commandsToDisable={INPUT_BLOCKING_COMMANDS}
                    />
                </VContainer>
            </>}
            <VContainer>
                <label>
                    {nls.localize('vuengine/editors/sound/effects', 'Effects')}
                    {eventsWithoutNoteKeys.length > 0 &&
                        <>
                            {' '}<span className='count'>{eventsWithoutNoteKeys.length}</span>
                        </>
                    }
                </label>
                {eventsWithoutNoteKeys.map((event, i) =>
                    <Effect
                        key={i}
                        songData={songData}
                        currentChannelId={currentChannelId}
                        event={event}
                        value={events[event]}
                        setValue={(value: any) => updateEvents(currentNote, event, value)}
                        removeEvent={removeEvent}
                    />
                )}
                {(unusedEvents.length > 0) &&
                    <button
                        className="theia-button add-button full-width"
                        onClick={addEvent}
                        title={nls.localize('vuengine/editors/sound/addEffect', 'Add Effect')}
                        onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                        onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                    >
                        <i className='codicon codicon-plus' />
                    </button>
                }
            </VContainer>
        </VContainer>
    );
}
