import { nls, QuickPickItem, QuickPickOptions, QuickPickSeparator } from '@theia/core';
import { nanoid } from 'nanoid';
import React, { useContext, useEffect, useState } from 'react';
import { EDITORS_COMMAND_EXECUTED_EVENT_NAME, EditorsContext, EditorsContextType } from '../../ves-editors-types';
import HContainer from '../Common/Base/HContainer';
import PopUpDialog from '../Common/Base/PopUpDialog';
import VContainer from '../Common/Base/VContainer';
import EmptyContainer from '../Common/EmptyContainer';
import { sortObjectByKeys } from '../Common/Utils';
import ModulationData from '../VsuSandbox/ModulationData';
import Emulator from './Emulator/Emulator';
import CurrentTrack from './Other/CurrentTrack';
import CurrentPattern from './Other/CurrentPattern';
import ImportExport from './Other/ImportExport';
import Instruments from './Other/Instruments';
import Song from './Other/Song';
import PianoRoll from './PianoRoll/PianoRoll';
import Sequencer from './Sequencer/Sequencer';
import { SoundEditorCommands } from './SoundEditorCommands';
import SoundEditorToolbar from './SoundEditorToolbar';
import {
    BAR_NOTE_RESOLUTION,
    TrackConfig,
    DEFAULT_NEW_NOTE_DURATION,
    EventsMap,
    InstrumentMap,
    NOTES,
    PatternConfig,
    PIANO_ROLL_NOTE_HEIGHT_DEFAULT,
    PIANO_ROLL_NOTE_WIDTH_DEFAULT,
    SEQUENCER_PATTERN_HEIGHT_DEFAULT,
    SEQUENCER_PATTERN_WIDTH_DEFAULT,
    SINGLE_NOTE_TESTING_DURATION,
    SoundData,
    SoundEditorTrackType,
    SoundEditorTool,
    SoundEvent,
    SUB_NOTE_RESOLUTION
} from './SoundEditorTypes';
import WaveformSelect from './WaveformSelect';
import EventList from './EventList';
import styled from 'styled-components';

const NEW_PATTERN_ID = '+';

const StyledLowerContainer = styled.div` 
    display: flex;
    flex-flow: row;
    gap: 5px;
    height: 100%;
    margin: 1px var(--padding) var(--padding);
    overflow: hidden;
`;

interface SoundEditorProps {
    soundData: SoundData
    updateSoundData: (soundData: SoundData) => void
}

export default function SoundEditor(props: SoundEditorProps): React.JSX.Element {
    const { soundData, updateSoundData } = props;
    const { services, enableCommands } = useContext(EditorsContext) as EditorsContextType;
    const [emulatorInitialized, setEmulatorInitialized] = useState<boolean>(false);
    const [playing, setPlaying] = useState<boolean>(false);
    const [testing, setTesting] = useState<boolean>(false);
    const [testingDuration, setTestingDuration] = useState<number>(0);
    const [testingNote, setTestingNote] = useState<number>(0);
    const [testingInstrument, setTestingInstrument] = useState<string>('');
    const [testingTrack, setTestingTrack] = useState<number>(0);
    const [tool, setTool] = useState<SoundEditorTool>(SoundEditorTool.DEFAULT);
    const [newNoteDuration, setNewNoteDuration] = useState<number>(DEFAULT_NEW_NOTE_DURATION * SUB_NOTE_RESOLUTION);
    const [currentPlayerPosition, setCurrentPlayerPosition] = useState<number>(-1);
    const [currentTrackId, setCurrentTrackId] = useState<number>(0);
    const [currentPatternId, setCurrentPatternId] = useState<string>(soundData.tracks[0]
        ? Object.values(soundData.tracks[0].sequence)[0] ?? '' : '');
    const [currentSequenceIndex, setCurrentSequenceIndex] = useState<number>(soundData.tracks[0]
        ? parseInt(Object.keys(soundData.tracks[0].sequence)[0]) ?? -1 : -1);
    const [noteCursor, setNoteCursor] = useState<number>(0);
    const [currentInstrument, setCurrentInstrument] = useState<string>('');
    const [playRangeStart, setPlayRangeStart] = useState<number>(-1);
    const [playRangeEnd, setPlayRangeEnd] = useState<number>(-1);
    const [pianoRollNoteHeight, setPianoRollNoteHeight] = useState<number>(PIANO_ROLL_NOTE_HEIGHT_DEFAULT);
    const [pianoRollNoteWidth, setPianoRollNoteWidth] = useState<number>(PIANO_ROLL_NOTE_WIDTH_DEFAULT);
    const [sequencerPatternHeight, setSequencerPatternHeight] = useState<number>(SEQUENCER_PATTERN_HEIGHT_DEFAULT);
    const [sequencerPatternWidth, setSequencerPatternWidth] = useState<number>(SEQUENCER_PATTERN_WIDTH_DEFAULT);
    const [sequencerHidden, setSequencerHidden] = useState<boolean>(false);
    const [effectsPanelHidden, setEffectsPanelHidden] = useState<boolean>(true);
    const [eventListHidden, setEventListHidden] = useState<boolean>(true);
    const [tab, setTab] = useState<number>(0);
    const [noteSnapping, setNoteSnapping] = useState<boolean>(true);
    const [trackDialogOpen, setTrackDialogOpen] = useState<boolean>(false);
    const [patternDialogOpen, setPatternDialogOpen] = useState<boolean>(false);
    const [waveformDialogOpen, setWaveformDialogOpen] = useState<string>('');
    const [modulationDataDialogOpen, setModulationDataDialogOpen] = useState<string>('');

    const updatePlayRangeStart = (value: number) => {
        if (currentPlayerPosition > -1) {
            setCurrentPlayerPosition(value);
        }
        setPlayRangeStart(value);
    };

    const setTrack = (trackId: number, track: Partial<TrackConfig>): void => {
        updateSoundData({
            ...soundData,
            tracks: [
                ...soundData.tracks.slice(0, trackId),
                {
                    ...soundData.tracks[trackId],
                    ...track
                },
                ...soundData.tracks.slice(trackId + 1)
            ]
        });
    };

    const removeTrack = (trackId: number): void => {
        const newTrackCount = soundData.tracks.length - 2;
        if (currentTrackId >= newTrackCount) {
            setCurrentTrackId(newTrackCount);
        }
        updateSoundData({
            ...soundData,
            tracks: [
                ...soundData.tracks.slice(0, trackId),
                ...soundData.tracks.slice(trackId + 1)
            ]
        });
        setTrackDialogOpen(false);
    };

    const setPattern = (patternId: string, pattern: Partial<PatternConfig>): void => {
        const updatedPatterns = {
            ...soundData.patterns,
            [patternId]: {
                ...soundData.patterns[patternId],
                ...pattern
            },
        };
        updateSoundData({
            ...soundData,
            patterns: updatedPatterns,
        });
    };

    const playNote = (note: number): void => {
        if (!playing) {
            setTesting(true);
            setTestingNote(Object.values(NOTES)[note]);
            setTestingTrack(currentTrackId);
            setTestingInstrument(soundData.tracks[currentTrackId].instrument);
            setTestingDuration(SINGLE_NOTE_TESTING_DURATION);
        }
    };

    const updateCurrentTrackId = (id: number): void => {
        setCurrentTrackId(id);
        setCurrentPatternId(Object.values(soundData.tracks[id].sequence)[0] ?? '');
        setCurrentSequenceIndex(parseInt(Object.keys(soundData.tracks[id].sequence)[0]) ?? -1);
    };

    const updateCurrentSequenceIndex = (trackId: number, sequenceIndex: number): void => {
        setCurrentTrackId(trackId);
        setCurrentSequenceIndex(sequenceIndex);
        setCurrentPatternId(soundData.tracks[trackId].sequence[sequenceIndex]);
    };

    const updateCurrentPatternId = (trackId: number, patternId: string): void => {
        setCurrentTrackId(trackId);
        setCurrentPatternId(patternId);
    };

    const showTrackTypeSelection = async (): Promise<QuickPickItem | undefined> => {
        const quickPickOptions: QuickPickOptions<QuickPickItem> = {
            title: nls.localize('vuengine/editors/sound/addTrack', 'Add Track'),
            placeholder: nls.localize('vuengine/editors/sound/selectTrackTypeToAdd', 'Select a track type to add...'),
        };
        const items: (QuickPickItem | QuickPickSeparator)[] = [];

        if (soundData.tracks.filter(c => c.type === SoundEditorTrackType.WAVE).length < 4) {
            items.push({
                id: SoundEditorTrackType.WAVE,
                label: nls.localize('vuengine/editors/sound/wave', 'Wave'),
            });
        }
        if (soundData.tracks.filter(c => c.type === SoundEditorTrackType.SWEEPMOD).length === 0) {
            items.push({
                id: SoundEditorTrackType.SWEEPMOD,
                label: nls.localize('vuengine/editors/sound/waveSm', 'Wave + Sweep/Modulation'),
            });
        }
        if (soundData.tracks.filter(c => c.type === SoundEditorTrackType.NOISE).length === 0) {
            items.push({
                id: SoundEditorTrackType.NOISE,
                label: nls.localize('vuengine/editors/sound/noise', 'Noise'),
            });
        }

        return services.quickPickService.show(
            items,
            quickPickOptions
        );
    };

    const addTrack = async (): Promise<void> => {
        const trackType = await showTrackTypeSelection();
        if (trackType && trackType.id) {
            doAddTrack(trackType.id as SoundEditorTrackType);
        }
    };

    const doAddTrack = async (trackType: SoundEditorTrackType): Promise<void> => {
        const type = services.vesProjectService.getProjectDataType('Sound');
        if (!type) {
            return;
        }
        const schema = await window.electronVesCore.dereferenceJsonSchema(type.schema);
        if (!schema?.properties?.tracks?.items) {
            return;
        }
        const newTrackData = services.vesProjectService.generateDataFromJsonSchema(schema?.properties?.tracks?.items);
        if (!newTrackData) {
            return;
        }
        const newTrackConfig = {
            ...newTrackData,
            type: trackType
        } as TrackConfig;

        const updatedTracks: TrackConfig[] = [
            ...soundData.tracks,
            newTrackConfig,

        ].sort((a, b) => b.type.localeCompare(a.type));
        updateSoundData({
            ...soundData,
            tracks: updatedTracks,
        });
        setTrackDialogOpen(false);
    };

    const togglePlaying = (): void => {
        if (currentPlayerPosition === -1) {
            setCurrentPlayerPosition(playRangeStart);
        }
        setPlaying(!playing);
        setTesting(false);
    };

    const stopPlaying = (): void => {
        setPlaying(false);
        setCurrentPlayerPosition(-1);
    };

    const toggleTrackMuted = (trackId: number): void => {
        setTrack(trackId, {
            muted: !soundData.tracks[trackId].muted,
            solo: false
        });
    };

    const toggleTrackSeeThrough = (trackId: number): void => {
        setTrack(trackId, {
            seeThrough: !soundData.tracks[trackId].seeThrough,
        });
    };

    const toggleTrackSolo = (trackId: number): void => {
        updateSoundData({
            ...soundData,
            tracks: soundData.tracks.map((track, index) => (index === trackId ? {
                ...track,
                solo: !track.solo,
                muted: false,
            } : {
                ...track,
                solo: false,
            }))
        });
    };

    const setNote = (step: number, note?: number, prevStep?: number): void => {
        const currentPattern = soundData.patterns[currentPatternId];
        const currentPatternEvents = currentPattern.events;

        if (currentPattern === undefined) {
            return;
        }

        const updatedEvents: EventsMap = {
            ...currentPattern.events,
            [step]: {
                ...(currentPattern.events[prevStep ?? step] ?? {}),
                [SoundEvent.Note]: note,
            }
        };

        const removeNoteFromEvents = (stepToRemove: number) => {
            delete updatedEvents[stepToRemove][SoundEvent.Note];
            if (updatedEvents[stepToRemove][SoundEvent.Duration] !== undefined) {
                delete updatedEvents[stepToRemove][SoundEvent.Duration];
            }
            if (Object.keys(updatedEvents[stepToRemove]).length === 0) {
                delete updatedEvents[stepToRemove];
            }
        };

        if (note === undefined) {
            removeNoteFromEvents(step);
        } else {
            const eventKeys = Object.keys(currentPatternEvents);
            let stop = false;

            // remove previous note if it was moved from another step
            if (prevStep !== undefined && prevStep !== step) {
                removeNoteFromEvents(prevStep);
            }

            // cap note's duration
            if (updatedEvents[step][SoundEvent.Duration] === undefined) {
                let cappedDuration = 0;
                stop = false;
                eventKeys.forEach(key => {
                    const nextEventStep = parseInt(key);
                    const event = currentPatternEvents[nextEventStep];
                    if (!stop && nextEventStep > step && event[SoundEvent.Note] !== undefined) {
                        stop = true;
                        cappedDuration = Math.min(newNoteDuration, nextEventStep - step);
                    }
                });
                if (cappedDuration === 0) {
                    cappedDuration = Math.min(newNoteDuration, currentPattern.size * BAR_NOTE_RESOLUTION - step);
                }

                updatedEvents[step][SoundEvent.Duration] = cappedDuration;
            }

            // cap previous note's duration
            stop = false;
            eventKeys.reverse().forEach(key => {
                const prevEventStep = parseInt(key);
                const prevEvent = currentPatternEvents[prevEventStep];
                if (!stop && prevEventStep < step &&
                    prevEvent[SoundEvent.Note] !== undefined &&
                    prevEvent[SoundEvent.Duration] !== undefined
                ) {
                    stop = true;
                    if (prevEvent[SoundEvent.Duration] + prevEventStep >= step) {
                        updatedEvents[prevEventStep][SoundEvent.Duration] = step - prevEventStep;
                    }
                }
            });

            // ensure clean key order
            updatedEvents[step] = sortObjectByKeys(updatedEvents[step]);
        }

        setPattern(currentPatternId, {
            events: updatedEvents,
        });
    };

    const setNoteEvent = (step: number, event: SoundEvent, value?: any): void => {
        const currentPattern = soundData.patterns[currentPatternId];

        if (currentPattern === undefined) {
            return;
        }

        const updatedEvents: EventsMap = {
            ...currentPattern.events,
            [step]: {
                ...(currentPattern.events[step] ?? {})
            }
        };

        if (value === undefined) {
            delete (updatedEvents[step][event]);
        } else {
            updatedEvents[step][event] = value;
        }

        // TODO: remove step, if empty

        setPattern(currentPatternId, {
            events: updatedEvents,
        });
    };

    const setInstruments = (instruments: InstrumentMap): void => {
        updateSoundData({ ...soundData, instruments });
    };

    const setInstrumentWaveForm = (waveform: string) => {
        const updatedInstruments = { ...soundData.instruments };
        updatedInstruments[currentInstrument] = {
            ...updatedInstruments[currentInstrument],
            waveform,
        };

        setInstruments(updatedInstruments);
    };

    const setInstrumentModulationData = (modulationData: number[]) => {
        const updatedInstruments = { ...soundData.instruments };
        updatedInstruments[currentInstrument] = {
            ...updatedInstruments[currentInstrument],
            modulationData,
        };

        setInstruments(updatedInstruments);
    };

    const editInstrument = (instrument: string): void => {
        setTrackDialogOpen(false);
        setCurrentInstrument(instrument);
        setTab(1);
    };

    const addPatternToSequence = async (trackId: number, step: number, patternId: string): Promise<void> => {
        const track = soundData.tracks[trackId];
        // create if it's a new pattern
        if (patternId === NEW_PATTERN_ID) {
            const newPatternId = nanoid();
            const type = services.vesProjectService.getProjectDataType('Sound');
            const schema = await window.electronVesCore.dereferenceJsonSchema(type!.schema);
            // @ts-ignore
            const newPattern = services.vesProjectService.generateDataFromJsonSchema(schema?.properties?.patterns?.additionalProperties);

            const updatedTracks = [...soundData.tracks];
            updatedTracks[trackId].sequence = {
                ...track.sequence,
                [step.toString()]: newPatternId,
            };

            updateSoundData({
                ...soundData,
                tracks: updatedTracks,
                patterns: {
                    ...soundData.patterns,
                    [newPatternId]: {
                        ...newPattern,
                        size: 4,
                    }
                }
            });
            updateCurrentPatternId(trackId, newPatternId);
        } else {
            setTrack(trackId, {
                ...track,
                sequence: {
                    ...track.sequence,
                    [step.toString()]: patternId,
                },
            });
            updateCurrentPatternId(trackId, patternId);
        }
    };

    const showPatternSelection = async (trackId: number): Promise<QuickPickItem | undefined> =>
        services.quickPickService.show(
            [
                {
                    id: NEW_PATTERN_ID,
                    label: nls.localize('vuengine/editors/sound/newPattern', 'New Pattern'),
                },
                ...Object.keys(soundData.patterns).map((p, i) => ({
                    id: p,
                    label: soundData.patterns[p].name.length
                        ? soundData.patterns[p].name
                        : (i + 1).toString(),
                })),
            ],
            {
                title: nls.localize('vuengine/editors/sound/addPattern', 'Add Pattern'),
                placeholder: nls.localize('vuengine/editors/sound/selectPatternToAdd', 'Select a pattern to add...'),
            }
        );

    const addPattern = async (trackId: number, bar: number): Promise<void> => {
        const patternToAdd = await showPatternSelection(trackId);
        if (patternToAdd && patternToAdd.id) {
            addPatternToSequence(trackId, bar, patternToAdd.id);
        }
    };

    const sequencerTabCommand = SoundEditorCommands.SHOW_SEQUENCER_VIEW;
    const instrumentsTabCommand = SoundEditorCommands.SHOW_INSTRUMENTS_VIEW;
    const settingsTabCommand = SoundEditorCommands.SHOW_SETTINGS_VIEW;

    const commandListener = (e: CustomEvent): void => {
        switch (e.detail) {
            case sequencerTabCommand.id:
                setTab(0);
                break;
            case instrumentsTabCommand.id:
                setTab(1);
                break;
            case settingsTabCommand.id:
                setTab(2);
                break;
            case SoundEditorCommands.ADD_TRACK.id:
                addTrack();
                break;
            case SoundEditorCommands.PLAY_PAUSE.id:
                togglePlaying();
                break;
            case SoundEditorCommands.STOP.id:
                stopPlaying();
                break;
            case SoundEditorCommands.TOOL_PENCIL.id:
                setTool(SoundEditorTool.DEFAULT);
                break;
            case SoundEditorCommands.TOOL_MARQUEE.id:
                // setTool(SoundEditorTool.MARQUEE);
                break;
            case SoundEditorCommands.ADD_NOTE.id:
                // TODO
                break;
            case SoundEditorCommands.TOGGLE_NOTE_SNAPPING.id:
                setNoteSnapping(prev => !prev);
                break;
            case SoundEditorCommands.TOGGLE_EVENT_LIST_VISIBILITY.id:
                setEventListHidden(prev => !prev);
                break;
            case SoundEditorCommands.TOGGLE_SEQUENCER_VISIBILITY.id:
                setSequencerHidden(prev => !prev);
                break;
            case SoundEditorCommands.ADD_PATTERN.id:
                // TODO
                break;
        }
    };

    useEffect(() => {
        enableCommands([
            ...Object.values(SoundEditorCommands).map(c => c.id)
        ]);
    }, []);

    useEffect(() => {
        document.addEventListener(EDITORS_COMMAND_EXECUTED_EVENT_NAME, commandListener);
        return () => {
            document.removeEventListener(EDITORS_COMMAND_EXECUTED_EVENT_NAME, commandListener);
        };
    }, [
        playing,
        setPlaying,
        soundData.tracks,
    ]);

    return (
        <HContainer className="musicEditor" gap={0} overflow="hidden" style={{ padding: 0 }}>
            <Emulator
                playing={playing}
                setEmulatorInitialized={setEmulatorInitialized}
                currentPlayerPosition={currentPlayerPosition}
                setCurrentPlayerPosition={setCurrentPlayerPosition}
                soundData={soundData}
                setPlaying={setPlaying}
                testing={testing}
                setTesting={setTesting}
                testingNote={testingNote}
                testingDuration={testingDuration}
                testingInstrument={testingInstrument}
                testingTrack={testingTrack}
                playRangeStart={playRangeStart}
                playRangeEnd={playRangeEnd}
            />
            <VContainer gap={0} grow={1} overflow="hidden">
                <HContainer justifyContent='space-between'>
                    <SoundEditorToolbar
                        soundData={soundData}
                        tab={tab}
                        currentPlayerPosition={currentPlayerPosition}
                        playing={playing}
                        tool={tool}
                        emulatorInitialized={emulatorInitialized}
                        noteSnapping={noteSnapping}
                        newNoteDuration={newNoteDuration}
                        setNewNoteDuration={setNewNoteDuration}
                    />
                </HContainer>
                {tab === 0 &&
                    <>
                        {soundData.tracks.length === 0
                            ? <VContainer grow={1} style={{ position: 'relative' }}>
                                <EmptyContainer
                                    title={nls.localize('vuengine/editors/sound/songIsEmpty', 'This song is empty')}
                                    description={nls.localize(
                                        'vuengine/editors/sound/clickBelowToAddFirstTrack',
                                        'Click below to add the first track',
                                    )}
                                    onClick={() => services.commandService.executeCommand(SoundEditorCommands.ADD_TRACK.id)}
                                />
                            </VContainer>
                            : <>
                                {!sequencerHidden &&
                                    <Sequencer
                                        soundData={soundData}
                                        updateSoundData={updateSoundData}
                                        currentPlayerPosition={currentPlayerPosition}
                                        currentPatternId={currentPatternId}
                                        setCurrentPatternId={updateCurrentPatternId}
                                        currentTrackId={currentTrackId}
                                        setCurrentTrackId={updateCurrentTrackId}
                                        currentSequenceIndex={currentSequenceIndex}
                                        setCurrentSequenceIndex={updateCurrentSequenceIndex}
                                        toggleTrackMuted={toggleTrackMuted}
                                        toggleTrackSolo={toggleTrackSolo}
                                        toggleTrackSeeThrough={toggleTrackSeeThrough}
                                        setTrack={setTrack}
                                        addPattern={addPattern}
                                        setTrackDialogOpen={setTrackDialogOpen}
                                        setPatternDialogOpen={setPatternDialogOpen}
                                        effectsPanelHidden={effectsPanelHidden}
                                        pianoRollNoteHeight={pianoRollNoteHeight}
                                        pianoRollNoteWidth={pianoRollNoteWidth}
                                        sequencerPatternHeight={sequencerPatternHeight}
                                        setSequencerPatternHeight={setSequencerPatternHeight}
                                        sequencerPatternWidth={sequencerPatternWidth}
                                        setSequencerPatternWidth={setSequencerPatternWidth}
                                    />
                                }
                                <StyledLowerContainer>
                                    {!eventListHidden &&
                                        <EventList
                                            currentSequenceIndex={currentSequenceIndex}
                                            pattern={soundData.patterns[currentPatternId]}
                                            noteCursor={noteCursor}
                                            setNoteCursor={setNoteCursor}
                                        />
                                    }
                                    <PianoRoll
                                        soundData={soundData}
                                        currentPlayerPosition={currentPlayerPosition}
                                        setCurrentPlayerPosition={setCurrentPlayerPosition}
                                        noteCursor={noteCursor}
                                        setNoteCursor={setNoteCursor}
                                        currentPatternId={currentPatternId}
                                        setCurrentPatternId={updateCurrentPatternId}
                                        currentTrackId={currentTrackId}
                                        currentSequenceIndex={currentSequenceIndex}
                                        setCurrentSequenceIndex={updateCurrentSequenceIndex}
                                        playRangeStart={playRangeStart}
                                        setPlayRangeStart={updatePlayRangeStart}
                                        playRangeEnd={playRangeEnd}
                                        setPlayRangeEnd={setPlayRangeEnd}
                                        playNote={playNote}
                                        setNote={setNote}
                                        setNoteEvent={setNoteEvent}
                                        addPattern={addPattern}
                                        sequencerHidden={sequencerHidden}
                                        setSequencerHidden={setSequencerHidden}
                                        effectsPanelHidden={effectsPanelHidden}
                                        setEffectsPanelHidden={setEffectsPanelHidden}
                                        eventListHidden={eventListHidden}
                                        setEventListHidden={setEventListHidden}
                                        noteSnapping={noteSnapping}
                                        pianoRollNoteHeight={pianoRollNoteHeight}
                                        pianoRollNoteWidth={pianoRollNoteWidth}
                                        sequencerPatternHeight={sequencerPatternHeight}
                                        setPianoRollNoteHeight={setPianoRollNoteHeight}
                                        setPianoRollNoteWidth={setPianoRollNoteWidth}
                                    />
                                </StyledLowerContainer>
                            </>}
                    </>
                }
                {tab === 1 &&
                    <Instruments
                        soundData={soundData}
                        currentInstrument={currentInstrument}
                        setCurrentInstrument={setCurrentInstrument}
                        setInstruments={setInstruments}
                        setWaveformDialogOpen={setWaveformDialogOpen}
                        setModulationDataDialogOpen={setModulationDataDialogOpen}
                        playing={playing}
                        testing={testing}
                        setTesting={setTesting}
                        setTestingDuration={setTestingDuration}
                        setTestingNote={setTestingNote}
                        setTestingInstrument={setTestingInstrument}
                        setTestingTrack={setTestingTrack}
                        emulatorInitialized={emulatorInitialized}
                    />
                }
                {tab === 2 &&
                    <VContainer gap={15} style={{ padding: '0 var(--padding) var(--padding) var(--padding)' }}>
                        <Song
                            soundData={soundData}
                            updateSoundData={updateSoundData}
                        />
                        <hr />
                        <ImportExport />
                    </VContainer>
                }
            </VContainer >
            {trackDialogOpen &&
                <PopUpDialog
                    open={trackDialogOpen}
                    onClose={() => setTrackDialogOpen(false)}
                    onOk={() => setTrackDialogOpen(false)}
                    title={nls.localize('vuengine/editors/sound/editTrack', 'Edit Track')}
                    height='260px'
                    width='320px'
                >
                    <CurrentTrack
                        soundData={soundData}
                        currentTrackId={currentTrackId}
                        setCurrentTrackId={setCurrentTrackId}
                        setCurrentPatternId={setCurrentPatternId}
                        setTrack={setTrack}
                        removeTrack={removeTrack}
                        editInstrument={editInstrument}
                    />
                </PopUpDialog>
            }
            {patternDialogOpen && soundData.tracks[currentTrackId] !== undefined &&
                <PopUpDialog
                    open={patternDialogOpen}
                    onClose={() => setPatternDialogOpen(false)}
                    onOk={() => setPatternDialogOpen(false)}
                    title={nls.localize('vuengine/editors/sound/editPattern', 'Edit Pattern')
                    }
                    height='320px'
                    width='320px'
                >
                    <CurrentPattern
                        soundData={soundData}
                        currentTrackId={currentTrackId}
                        currentPatternId={currentPatternId}
                        setCurrentPatternId={updateCurrentPatternId}
                        setPattern={setPattern}
                    />
                </PopUpDialog>
            }
            {waveformDialogOpen !== '' &&
                <PopUpDialog
                    open={waveformDialogOpen !== ''}
                    onClose={() => setWaveformDialogOpen('')}
                    onOk={() => setWaveformDialogOpen('')}
                    title={nls.localize('vuengine/editors/sound/selectWaveform', 'Select Waveform')
                    }
                    height='100%'
                    width='100%'
                >
                    <WaveformSelect
                        value={soundData.instruments[waveformDialogOpen]?.waveform ?? 0}
                        setValue={setInstrumentWaveForm}
                    />
                    {/*
                <WaveformWithPresets
                    value={soundData.waveforms[Math.max(0, waveformDialogOpen)]}
                    setValue={setWaveform}
                />
                */}
                </PopUpDialog>
            }
            {modulationDataDialogOpen !== '' &&
                <PopUpDialog
                    open={modulationDataDialogOpen !== ''}
                    onClose={() => setModulationDataDialogOpen('')}
                    onOk={() => setModulationDataDialogOpen('')}
                    title={nls.localize('vuengine/editors/sound/editModulationData', 'Edit Modulation Data')}
                    height='100%'
                    width='100%'
                >
                    {soundData.instruments[modulationDataDialogOpen] &&
                        <ModulationData
                            value={soundData.instruments[modulationDataDialogOpen].modulationData}
                            setValue={setInstrumentModulationData}
                        />
                    }
                </PopUpDialog>
            }
        </HContainer >
    );
}
