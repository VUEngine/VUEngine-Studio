import { nls, QuickPickItem, QuickPickOptions, QuickPickSeparator } from '@theia/core';
import { nanoid } from 'nanoid';
import React, { useContext, useEffect, useState } from 'react';
import styled from 'styled-components';
import { EDITORS_COMMAND_EXECUTED_EVENT_NAME, EditorsContext, EditorsContextType } from '../../ves-editors-types';
import HContainer from '../Common/Base/HContainer';
import PopUpDialog from '../Common/Base/PopUpDialog';
import VContainer from '../Common/Base/VContainer';
import EmptyContainer from '../Common/EmptyContainer';
import { sortObjectByKeys } from '../Common/Utils';
import ModulationData from '../VsuSandbox/ModulationData';
import Emulator from './Emulator/Emulator';
import EventList from './EventList';
import CurrentPattern from './Other/CurrentPattern';
import CurrentTrack from './Other/CurrentTrack';
import ImportExport from './Other/ImportExport';
import Instruments from './Other/Instruments';
import Song from './Other/Song';
import PianoRoll from './PianoRoll/PianoRoll';
import Sequencer from './Sequencer/Sequencer';
import { SoundEditorCommands } from './SoundEditorCommands';
import SoundEditorToolbar from './SoundEditorToolbar';
import {
    BAR_NOTE_RESOLUTION,
    DEFAULT_NEW_NOTE_DURATION,
    EventsMap,
    InstrumentMap,
    NEW_PATTERN_ID,
    NOTES,
    PatternConfig,
    PIANO_ROLL_NOTE_HEIGHT_DEFAULT,
    PIANO_ROLL_NOTE_WIDTH_DEFAULT,
    ScrollWindow,
    SEQUENCER_PATTERN_HEIGHT_DEFAULT,
    SEQUENCER_PATTERN_WIDTH_DEFAULT,
    SEQUENCER_RESOLUTION,
    SINGLE_NOTE_TESTING_DURATION,
    SoundData,
    SoundEditorTool,
    SoundEditorTrackType,
    SoundEvent,
    SUB_NOTE_RESOLUTION,
    TRACK_DEFAULT_INSTRUMENT_ID,
    TrackConfig
} from './SoundEditorTypes';
import WaveformSelect from './WaveformSelect';
import { ConfirmDialog } from '@theia/core/lib/browser';

const StyledLowerContainer = styled.div` 
    display: flex;
    flex-flow: row;
    height: 100%;
    margin: 1px var(--padding) var(--padding);
    overflow: hidden;
`;

export const getTrackName = (type: SoundEditorTrackType, i: number): string => {
    switch (type) {
        case SoundEditorTrackType.NOISE:
            return nls.localize('vuengine/editors/sound/noise', 'Noise');
        case SoundEditorTrackType.SWEEPMOD:
            return nls.localize('vuengine/editors/sound/waveSmShort', 'Wave (SM)');
        default:
        case SoundEditorTrackType.WAVE:
            return `${nls.localize('vuengine/editors/sound/wave', 'Wave')} ${i + 1}`;
    }
};

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
    const [currentInstrumentId, setCurrentInstrumentId] = useState<string>(TRACK_DEFAULT_INSTRUMENT_ID);
    const [currentPlayerPosition, setCurrentPlayerPosition] = useState<number>(-1);
    const [currentTrackId, setCurrentTrackId] = useState<number>(0);
    const [currentPatternId, setCurrentPatternId] = useState<string>(soundData.tracks[0]
        ? Object.values(soundData.tracks[0].sequence)[0] ?? '' : '');
    const [currentSequenceIndex, setCurrentSequenceIndex] = useState<number>(soundData.tracks[0]
        ? parseInt(Object.keys(soundData.tracks[0].sequence)[0]) ?? -1 : -1);
    const [noteCursor, setNoteCursor] = useState<number>(0);
    const [playRangeStart, setPlayRangeStart] = useState<number>(-1);
    const [playRangeEnd, setPlayRangeEnd] = useState<number>(-1);
    const [pianoRollScrollWindow, setPianoRollScrollWindow] = useState<ScrollWindow>({ x: 0, w: 0 });
    const [pianoRollNoteHeight, setPianoRollNoteHeight] = useState<number>(PIANO_ROLL_NOTE_HEIGHT_DEFAULT);
    const [pianoRollNoteWidth, setPianoRollNoteWidth] = useState<number>(PIANO_ROLL_NOTE_WIDTH_DEFAULT);
    const [sequencerPatternHeight, setSequencerPatternHeight] = useState<number>(SEQUENCER_PATTERN_HEIGHT_DEFAULT);
    const [sequencerPatternWidth, setSequencerPatternWidth] = useState<number>(SEQUENCER_PATTERN_WIDTH_DEFAULT);
    const [sequencerHidden, setSequencerHidden] = useState<boolean>(false);
    const [effectsPanelHidden, setEffectsPanelHidden] = useState<boolean>(true);
    const [eventListHidden, setEventListHidden] = useState<boolean>(true);
    const [noteSnapping, setNoteSnapping] = useState<boolean>(true);
    const [instrumentDialogOpen, setInstrumentDialogOpen] = useState<boolean>(false);
    const [songSettingsDialogOpen, setSongSettingsDialogOpen] = useState<boolean>(false);
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

    const removeTrack = async (trackId: number) => {
        const trackType = soundData.tracks[trackId].type;
        const dialog = new ConfirmDialog({
            title: nls.localize('vuengine/editors/sound/deleteTrackQuestion', 'Delete Track?'),
            msg: nls.localize(
                'vuengine/editors/sound/areYouSureYouWantToDeleteTrack',
                'Are you sure you want to delete track {0}?',
                getTrackName(trackType, trackId),
            ),
        });
        const remove = await dialog.open();
        if (remove) {
            doRemoveTrack(trackId);
        }
    };

    const doRemoveTrack = (trackId: number): void => {
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

    const setPatternSize = (patternId: string, size: number): void => {
        const pattern = soundData.patterns[patternId];
        if (!patternId) {
            return;
        }

        // removed all events that are beyond the limits of the pattern
        // this would come into play when resizing down
        const updatedEvents: EventsMap = {};
        const totalTicks = size * BAR_NOTE_RESOLUTION;
        Object.keys(pattern.events).forEach(tickStr => {
            const tick = parseInt(tickStr);
            if (tick < totalTicks) {
                updatedEvents[tick] = pattern.events[tick];

                // cut note duration if it would reach beyond the pattern limits
                if (updatedEvents[tick][SoundEvent.Duration] &&
                    updatedEvents[tick][SoundEvent.Duration] + tick >= totalTicks
                ) {
                    updatedEvents[tick][SoundEvent.Duration] = totalTicks - tick;
                }
            }
        });

        setPattern(patternId, {
            events: updatedEvents,
            size,
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

        let newPatternId = '';
        let newSequenceIndex = -1;
        // attempt to find closest pattern to current on other track
        Object.keys(soundData.tracks[id].sequence).reverse().forEach(k => {
            const s = parseInt(k);
            if (newPatternId === '' && s <= currentSequenceIndex) {
                newPatternId = soundData.tracks[id].sequence[s];
                newSequenceIndex = s;
            }
        });

        if (newPatternId === '' && Object.values(soundData.tracks[id].sequence)[0]) {
            newPatternId = Object.values(soundData.tracks[id].sequence)[0];
            newSequenceIndex = parseInt(Object.keys(soundData.tracks[id].sequence)[0]);
        }

        setCurrentPatternId(newPatternId);
        setCurrentSequenceIndex(newSequenceIndex);
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

        if (soundData.tracks.filter(t => t.type === SoundEditorTrackType.WAVE).length < 4) {
            items.push({
                id: SoundEditorTrackType.WAVE,
                label: nls.localize('vuengine/editors/sound/wave', 'Wave'),
            });
        }
        if (soundData.tracks.filter(t => t.type === SoundEditorTrackType.SWEEPMOD).length === 0) {
            items.push({
                id: SoundEditorTrackType.SWEEPMOD,
                label: nls.localize('vuengine/editors/sound/waveSm', 'Wave + Sweep/Modulation'),
            });
        }
        if (soundData.tracks.filter(t => t.type === SoundEditorTrackType.NOISE).length === 0) {
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

    const setNote = (step: number, note?: string, prevStep?: number): void => {
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
                    cappedDuration = Math.min(newNoteDuration, currentPattern.size / SEQUENCER_RESOLUTION * BAR_NOTE_RESOLUTION - step);
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
        updatedInstruments[currentInstrumentId] = {
            ...updatedInstruments[currentInstrumentId],
            waveform,
        };

        setInstruments(updatedInstruments);
    };

    const setInstrumentModulationData = (modulationData: number[]) => {
        const updatedInstruments = { ...soundData.instruments };
        updatedInstruments[currentInstrumentId] = {
            ...updatedInstruments[currentInstrumentId],
            modulationData,
        };

        setInstruments(updatedInstruments);
    };

    const editInstrument = (instrument: string): void => {
        setTrackDialogOpen(false);
        setCurrentInstrumentId(instrument);
        setInstrumentDialogOpen(true);
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

    const addPattern = async (trackId: number, bar: number, createNew: boolean = false): Promise<void> => {
        const patternToAdd = createNew
            ? { id: NEW_PATTERN_ID }
            : await showPatternSelection(trackId);
        if (patternToAdd && patternToAdd.id) {
            addPatternToSequence(trackId, bar, patternToAdd.id);
        }
    };

    const commandListener = (e: CustomEvent): void => {
        switch (e.detail) {
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
                        currentPlayerPosition={currentPlayerPosition}
                        playing={playing}
                        tool={tool}
                        emulatorInitialized={emulatorInitialized}
                        noteSnapping={noteSnapping}
                        newNoteDuration={newNoteDuration}
                        setNewNoteDuration={setNewNoteDuration}
                        editInstrument={editInstrument}
                        currentInstrumentId={currentInstrumentId}
                        setCurrentInstrumentId={setCurrentInstrumentId}
                        songSettingsDialogOpen={songSettingsDialogOpen}
                        setSongSettingsDialogOpen={setSongSettingsDialogOpen}
                    />
                </HContainer>
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
                                removeTrack={removeTrack}
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
                                pianoRollScrollWindow={pianoRollScrollWindow}
                                setPatternSize={setPatternSize}
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
                                sequencerPatternWidth={sequencerPatternWidth}
                                setPianoRollNoteHeight={setPianoRollNoteHeight}
                                setPianoRollNoteWidth={setPianoRollNoteWidth}
                                setPianoRollScrollWindow={setPianoRollScrollWindow}
                            />
                        </StyledLowerContainer>
                    </>}
            </VContainer >
            {instrumentDialogOpen &&
                <PopUpDialog
                    open={instrumentDialogOpen}
                    onClose={() => setInstrumentDialogOpen(false)}
                    onOk={() => setInstrumentDialogOpen(false)}
                    title={nls.localize('vuengine/editors/sound/editInstrument', 'Edit Instrument')}
                    height='100%'
                    width='100%'
                    overflow='visible'
                >
                    <Instruments
                        soundData={soundData}
                        currentInstrumentId={currentInstrumentId}
                        setCurrentInstrumentId={setCurrentInstrumentId}
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
                </PopUpDialog>
            }
            {songSettingsDialogOpen &&
                <PopUpDialog
                    open={songSettingsDialogOpen}
                    onClose={() => setSongSettingsDialogOpen(false)}
                    onOk={() => setSongSettingsDialogOpen(false)}
                    title={nls.localize('vuengine/editors/sound/songSettings', 'Song Settings')}
                    height='400px'
                    width='400px'
                    overflow='visible'
                >
                    <VContainer gap={15}>
                        <Song
                            soundData={soundData}
                            updateSoundData={updateSoundData}
                        />
                        <ImportExport />
                        <VContainer>
                            <label>
                                {nls.localizeByDefault('Tools')}
                            </label>
                            <HContainer>
                                <button
                                    className='theia-button secondary'
                                    onClick={() => alert('not yet implemented')}
                                >
                                    {nls.localize('vuengine/editors/sound/removeUnusedPatterns', 'Remove Unused Patterns')}
                                </button>
                                <button
                                    className='theia-button secondary'
                                    onClick={() => alert('not yet implemented')}
                                >
                                    {nls.localize('vuengine/editors/sound/removeUnusedInstruments', 'Remove Unused Instruments')}
                                </button>
                            </HContainer>
                        </VContainer>
                    </VContainer>
                </PopUpDialog>
            }
            {trackDialogOpen &&
                <PopUpDialog
                    open={trackDialogOpen}
                    onClose={() => setTrackDialogOpen(false)}
                    onOk={() => setTrackDialogOpen(false)}
                    title={nls.localize('vuengine/editors/sound/editTrack', 'Edit Track')}
                    height='260px'
                    width='320px'
                    overflow='visible'
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
                    overflow='visible'
                >
                    <CurrentPattern
                        soundData={soundData}
                        currentTrackId={currentTrackId}
                        currentPatternId={currentPatternId}
                        setCurrentPatternId={updateCurrentPatternId}
                        setPattern={setPattern}
                        setPatternSize={setPatternSize}
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
