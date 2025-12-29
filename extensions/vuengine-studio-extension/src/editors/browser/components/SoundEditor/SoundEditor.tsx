import { nls, QuickPickItem, QuickPickOptions, QuickPickSeparator } from '@theia/core';
import { ConfirmDialog } from '@theia/core/lib/browser';
import { nanoid } from 'nanoid';
import React, { useContext, useEffect, useState } from 'react';
import styled from 'styled-components';
import { EDITORS_COMMAND_EXECUTED_EVENT_NAME, EditorsContext, EditorsContextType } from '../../ves-editors-types';
import HContainer from '../Common/Base/HContainer';
import PopUpDialog from '../Common/Base/PopUpDialog';
import VContainer from '../Common/Base/VContainer';
import EmptyContainer from '../Common/EmptyContainer';
import PaletteColorSelect from '../Common/PaletteColorSelect';
import { sortObjectByKeys } from '../Common/Utils';
import Emulator from './Emulator/Emulator';
import EventList from './EventList';
import ImportExport from './ImportExport/ImportExport';
import Instruments from './Instruments/Instruments';
import CurrentPattern from './Other/CurrentPattern';
import CurrentTrack from './Other/CurrentTrack';
import { getMaxNoteDuration } from './Other/Note';
import Song from './Other/Song';
import PianoRoll from './PianoRoll/PianoRoll';
import Sequencer from './Sequencer/Sequencer';
import { SoundEditorCommands } from './SoundEditorCommands';
import SoundEditorToolbar from './SoundEditorToolbar';
import {
    BAR_NOTE_RESOLUTION,
    DEFAULT_NEW_NOTE_DURATION,
    DEFAULT_PATTERN_SIZE,
    DEFAULT_TRACK_SETTINGS,
    EventsMap,
    InstrumentMap,
    NEW_PATTERN_ID,
    NOTES,
    PatternConfig,
    PIANO_ROLL_NOTE_HEIGHT_DEFAULT,
    PIANO_ROLL_NOTE_HEIGHT_MAX,
    PIANO_ROLL_NOTE_HEIGHT_MIN,
    PIANO_ROLL_NOTE_WIDTH_DEFAULT,
    PIANO_ROLL_NOTE_WIDTH_MAX,
    PIANO_ROLL_NOTE_WIDTH_MIN,
    ScrollWindow,
    SEQUENCER_PATTERN_HEIGHT_DEFAULT,
    SEQUENCER_PATTERN_HEIGHT_MAX,
    SEQUENCER_PATTERN_HEIGHT_MIN,
    SEQUENCER_PATTERN_WIDTH_DEFAULT,
    SEQUENCER_PATTERN_WIDTH_MAX,
    SEQUENCER_PATTERN_WIDTH_MIN,
    SEQUENCER_RESOLUTION,
    SINGLE_NOTE_TESTING_DURATION,
    SoundData,
    SoundEditorTrackType,
    SoundEvent,
    SUB_NOTE_RESOLUTION,
    TRACK_DEFAULT_INSTRUMENT_ID,
    TRACK_TYPE_LABELS,
    TrackConfig,
    TrackSettings
} from './SoundEditorTypes';
import ModulationData from './Waveforms/ModulationData';
import WaveformWithPresets from './Waveforms/WaveformWithPresets';

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

export const getPatternName = (soundData: SoundData, patternId: string): string =>
    soundData.patterns[patternId].name.length
        ? soundData.patterns[patternId].name
        : `(${patternId.slice(0, 4)})`;

export const getInstrumentName = (soundData: SoundData, instrumentId: string): string =>
    soundData.instruments[instrumentId].name.length
        ? soundData.instruments[instrumentId].name
        : `(${instrumentId.slice(0, 4)})`;

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
    const [trackSettings, setTrackSettings] = useState<TrackSettings[]>([...soundData.tracks.map(t => (DEFAULT_TRACK_SETTINGS))]);
    const [testingDuration, setTestingDuration] = useState<number>(0);
    const [testingNote, setTestingNote] = useState<number>(0);
    const [testingInstrument, setTestingInstrument] = useState<string>('');
    const [testingTrack, setTestingTrack] = useState<number>(0);
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
    const [pianoRollScrollWindow, setPianoRollScrollWindow] = useState<ScrollWindow>({ x: 0, y: 0, w: 0, h: 0 });
    const [pianoRollNoteHeight, setPianoRollNoteHeight] = useState<number>(PIANO_ROLL_NOTE_HEIGHT_DEFAULT);
    const [pianoRollNoteWidth, setPianoRollNoteWidth] = useState<number>(PIANO_ROLL_NOTE_WIDTH_DEFAULT);
    const [sequencerPatternHeight, setSequencerPatternHeight] = useState<number>(SEQUENCER_PATTERN_HEIGHT_DEFAULT);
    const [sequencerPatternWidth, setSequencerPatternWidth] = useState<number>(SEQUENCER_PATTERN_WIDTH_DEFAULT);
    const [sequencerHidden, setSequencerHidden] = useState<boolean>(false);
    const [effectsPanelHidden, setEffectsPanelHidden] = useState<boolean>(true);
    const [eventListHidden, setEventListHidden] = useState<boolean>(true);
    const [noteSnapping, setNoteSnapping] = useState<boolean>(true);
    const [instrumentDialogOpen, setInstrumentDialogOpen] = useState<boolean>(false);
    const [toolsDialogOpen, setToolsDialogOpen] = useState<boolean>(false);
    const [songSettingsDialogOpen, setSongSettingsDialogOpen] = useState<boolean>(false);
    const [trackDialogOpen, setTrackDialogOpen] = useState<boolean>(false);
    const [patternDialogOpen, setPatternDialogOpen] = useState<boolean>(false);
    const [waveformDialogOpen, setWaveformDialogOpen] = useState<string>('');
    const [modulationDataDialogOpen, setModulationDataDialogOpen] = useState<string>('');
    const [instrumentColorDialogOpen, setInstrumentColorDialogOpen] = useState<string>('');

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
        setTrackSettings(prev => ([
            ...prev.slice(0, trackId),
            ...prev.slice(trackId + 1)
        ]));
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
        const patternSteps = size * BAR_NOTE_RESOLUTION / SEQUENCER_RESOLUTION;
        Object.keys(pattern.events).forEach(stepStr => {
            const step = parseInt(stepStr);
            if (step < patternSteps) {
                updatedEvents[step] = pattern.events[step];

                // cut note duration if it would reach beyond the pattern limits
                if (updatedEvents[step][SoundEvent.Duration] &&
                    updatedEvents[step][SoundEvent.Duration] + step >= patternSteps
                ) {
                    updatedEvents[step][SoundEvent.Duration] = patternSteps - step;
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
        setNoteCursor(newSequenceIndex * SEQUENCER_RESOLUTION * SUB_NOTE_RESOLUTION);
    };

    const updateCurrentPatternId = (trackId: number, patternId: string): void => {
        setCurrentTrackId(trackId);
        setCurrentPatternId(patternId);
        let sequenceIndex = -1;
        for (const [step, pId] of Object.entries(soundData.tracks[trackId].sequence)) {
            if (pId === patternId) {
                sequenceIndex = parseInt(step);
                break;
            }
        }
        setCurrentSequenceIndex(sequenceIndex);
        setNoteCursor(sequenceIndex * SEQUENCER_RESOLUTION * SUB_NOTE_RESOLUTION);
    };

    const updateCurrentSequenceIndex = (trackId: number, sequenceIndex: number): void => {
        const track = soundData.tracks[trackId];
        const sequence = track?.sequence;
        setCurrentTrackId(trackId);
        setCurrentPatternId(sequence && sequence[sequenceIndex] ? sequence[sequenceIndex] : '');
        setCurrentSequenceIndex(sequenceIndex);
        setNoteCursor(sequenceIndex * SEQUENCER_RESOLUTION * SUB_NOTE_RESOLUTION);
    };

    const showTrackTypeSelection = async (): Promise<QuickPickItem | undefined> => {
        const quickPickOptions: QuickPickOptions<QuickPickItem> = {
            title: nls.localize('vuengine/editors/sound/addTrack', 'Add Track'),
            placeholder: nls.localize('vuengine/editors/sound/selectTrackTypeToAdd', 'Select a track type to add...'),
        };
        const items: (QuickPickItem | QuickPickSeparator)[] = [];

        const waveAvailable = isTrackAvailable(SoundEditorTrackType.WAVE, soundData.tracks);
        const sweepModAvailable = isTrackAvailable(SoundEditorTrackType.SWEEPMOD, soundData.tracks);
        const noiseAvailable = isTrackAvailable(SoundEditorTrackType.NOISE, soundData.tracks);

        if (waveAvailable || sweepModAvailable || noiseAvailable) {
            items.push({
                id: SoundEditorTrackType.ANY,
                label: nls.localize('vuengine/editors/sound/allAvailable', 'All available'),
            });
        }
        if (waveAvailable) {
            items.push({
                id: SoundEditorTrackType.WAVE,
                label: TRACK_TYPE_LABELS[SoundEditorTrackType.WAVE],
            });
        }
        if (sweepModAvailable) {
            items.push({
                id: SoundEditorTrackType.SWEEPMOD,
                label: TRACK_TYPE_LABELS[SoundEditorTrackType.SWEEPMOD],
            });
        }
        if (noiseAvailable) {
            items.push({
                id: SoundEditorTrackType.NOISE,
                label: TRACK_TYPE_LABELS[SoundEditorTrackType.NOISE],
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
            if (trackType.id === SoundEditorTrackType.ANY) {
                doAddTracks([
                    SoundEditorTrackType.WAVE,
                    SoundEditorTrackType.WAVE,
                    SoundEditorTrackType.WAVE,
                    SoundEditorTrackType.WAVE,
                    SoundEditorTrackType.SWEEPMOD,
                    SoundEditorTrackType.NOISE
                ]);
            } else {
                doAddTracks([
                    trackType.id as SoundEditorTrackType
                ]);
            }
        }
    };

    const isTrackAvailable = (trackType: SoundEditorTrackType, tracks: TrackConfig[]) => {
        switch (trackType) {
            case SoundEditorTrackType.WAVE:
                return tracks.filter(t => t.type === SoundEditorTrackType.WAVE).length < 4;
            case SoundEditorTrackType.SWEEPMOD:
                return tracks.filter(t => t.type === SoundEditorTrackType.SWEEPMOD).length === 0;
            case SoundEditorTrackType.NOISE:
                return tracks.filter(t => t.type === SoundEditorTrackType.NOISE).length === 0;
            default:
                return false;
        }
    };

    const doAddTracks = async (trackTypes: SoundEditorTrackType[]): Promise<void> => {
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

        const updatedTracks = [...soundData.tracks];
        const updatedTrackSettings = [...trackSettings.map((track, trackId) => ({
            ...track,
            type: updatedTracks[trackId].type,
        }))];
        trackTypes.forEach(trackType => {
            if (!isTrackAvailable(trackType, updatedTracks)) {
                return;
            }

            updatedTrackSettings.push({
                ...DEFAULT_TRACK_SETTINGS,
                type: trackType,
            });

            updatedTracks.push({
                ...newTrackData,
                type: trackType
            });
        });

        updateSoundData({
            ...soundData,
            tracks: updatedTracks.sort((a, b) => b.type.localeCompare(a.type)),
        });
        setTrackSettings(updatedTrackSettings.sort((a, b) => b.type.localeCompare(a.type)));
        setTrackDialogOpen(false);
    };

    const removePatternFromSequence = (trackId: number, step: number): void => {
        const updatedSequence = { ...soundData.tracks[trackId].sequence };

        // Select previous (or none) pattern
        const sequenceSteps = Object.keys(updatedSequence);
        const stepSequenceIndex = sequenceSteps.indexOf(step.toString());
        if (stepSequenceIndex > 0) {
            const prevStep = parseInt(sequenceSteps[stepSequenceIndex - 1]);
            setCurrentPatternId(updatedSequence[prevStep]);
            setCurrentSequenceIndex(prevStep);
        } else {
            setCurrentSequenceIndex(-1);
        }

        // Remove pattern
        delete (updatedSequence[step]);
        setTrack(trackId, {
            sequence: updatedSequence,
        });
    };

    const removeUnusedPatterns = async (): Promise<void> => {
        // find all unused patterns
        const unusedPatterns: Record<string, string> = {};
        Object.keys(soundData.patterns).forEach(patternId => {
            let found = false;
            soundData.tracks.forEach(track => {
                if (Object.values(track.sequence).includes(patternId)) {
                    found = true;
                }
            });

            if (!found) {
                unusedPatterns[patternId] = getPatternName(soundData, patternId);
            }
        });
        const unusedPatternsNames = Object.values(unusedPatterns);

        // stop if no unused patterns found
        if (unusedPatternsNames.length === 0) {
            services.messageService.info(nls.localize(
                'vuengine/editors/sound/noUnusedPatternsFound',
                'No unused patterns could be found.'
            ));
            return;
        }

        // prompt
        const ellipsis = unusedPatternsNames.length > 15 ? '\n[…]' : '';
        const patternList = `• ${unusedPatternsNames.slice(0, 15).join('\n• ')}${ellipsis}`;

        const dialog = new ConfirmDialog({
            title: SoundEditorCommands.REMOVE_UNUSED_PATTERNS.label,
            msg: `${nls.localize(
                'vuengine/editors/sound/confirmRemoveUnusedPatterns',
                'This will delete all patterns that are not currently placed on any track.\n\
Are you sure you want to do this?\n\n\
A total of {0} patterns will be deleted.',
                unusedPatternsNames.length
            )}\n\n${patternList}`,
        });

        const confirmed = await dialog.open();
        if (confirmed) {
            const updatedPatterns = { ...soundData.patterns };

            const unusedPatternsIds = Object.keys(unusedPatterns);
            unusedPatternsIds.forEach(patternId => {
                delete updatedPatterns[patternId];
            });

            updateSoundData({
                ...soundData,
                patterns: updatedPatterns,
            });

            services.messageService.info(nls.localize(
                'vuengine/editors/sound/unusedPatternsDeleted',
                'Successfully deleted {0} unused patterns.',
                unusedPatternsNames.length
            ));
        }
    };

    const setInstrumentColor = (instrumentId: string, color: number) => {
        const updatedInstruments = { ...soundData.instruments };
        updatedInstruments[instrumentId] = {
            ...updatedInstruments[instrumentId],
            color,
        };

        setInstruments(updatedInstruments);
    };

    const removeUnusedInstruments = async (): Promise<void> => {
        const dialog = new ConfirmDialog({
            title: SoundEditorCommands.REMOVE_UNUSED_INSTRUMENTS.label,
            msg: nls.localize(
                'vuengine/editors/sound/confirmRemoveUnusedInstruments',
                'This will delete all instruments that are not currently used in any pattern that is placed on a track.\nAre you sure you want to do this?'
            ),
        });
        const confirmed = await dialog.open();
        if (confirmed) {
            // TODO
            alert('not yet implemented');
        }
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
        setTrackSettings(prev => prev.map((track, index) => (index === trackId ? {
            ...track,
            muted: !track.muted,
            solo: false,
        } : track)));
    };

    const toggleTrackSolo = (trackId: number): void => {
        setTrackSettings(prev => prev.map((track, index) => (index === trackId ? {
            ...track,
            solo: !track.solo,
            muted: false,
        } : {
            ...track,
            solo: false,
        })));
    };

    const toggleTrackSeeThrough = (trackId: number): void => {
        setTrackSettings(prev => [
            ...prev.slice(0, trackId),
            {
                ...prev[trackId],
                seeThrough: !prev[trackId].seeThrough,
            },
            ...prev.slice(trackId + 1)
        ]);
    };

    const setNote = (step: number, note?: string, prevStep?: number, duration?: number): void => {
        const currentPattern = soundData.patterns[currentPatternId];
        const currentPatternEvents = currentPattern.events;

        if (currentPattern === undefined) {
            return;
        }

        const removeNoteFromEvents = (stepToRemove: number) => {
            // remove all note-related events
            delete updatedEvents[stepToRemove][SoundEvent.Note];
            delete updatedEvents[stepToRemove][SoundEvent.Duration];
            delete updatedEvents[stepToRemove][SoundEvent.NoteSlide];

            // if no events remain, remove entirely
            if (Object.keys(updatedEvents[stepToRemove]).length === 0) {
                delete updatedEvents[stepToRemove];
            }
        };

        const updatedEvents: EventsMap = {
            ...currentPattern.events,
            [step]: {
                ...(prevStep ? currentPattern.events[prevStep] : {}),
                [SoundEvent.Note]: note,
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

            // set and cap new note's duration
            let cappedDuration = Math.min(
                getMaxNoteDuration(currentPattern.events, step, currentPattern.size),
                duration ?? updatedEvents[step][SoundEvent.Duration] ?? newNoteDuration,
            );
            stop = false;
            eventKeys.forEach(key => {
                const nextEventStep = parseInt(key);
                const event = currentPatternEvents[nextEventStep];
                if (!stop && nextEventStep > step && event[SoundEvent.Note] !== undefined) {
                    stop = true;
                    cappedDuration = Math.min(cappedDuration, nextEventStep - step);
                }
            });
            if (cappedDuration === 0) {
                cappedDuration = Math.min(newNoteDuration, currentPattern.size / SEQUENCER_RESOLUTION * BAR_NOTE_RESOLUTION - step);
            }
            updatedEvents[step][SoundEvent.Duration] = cappedDuration;

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

            // set instrument
            if (currentInstrumentId === TRACK_DEFAULT_INSTRUMENT_ID) {
                if (updatedEvents[step][SoundEvent.Instrument] !== undefined) {
                    delete (updatedEvents[step][SoundEvent.Instrument]);
                }
            } else {
                updatedEvents[step][SoundEvent.Instrument] = currentInstrumentId;
            }

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

        // remove step, if empty
        if (Object.keys(updatedEvents[step]).length === 0) {
            delete (updatedEvents[step]);
        }

        setPattern(currentPatternId, {
            events: updatedEvents,
        });
    };

    const setInstruments = (instruments: InstrumentMap): void => {
        updateSoundData({ ...soundData, instruments });
    };

    const setInstrumentWaveForm = (instrumentId: string, waveform: number[]) => {
        const updatedInstruments = { ...soundData.instruments };
        updatedInstruments[instrumentId] = {
            ...updatedInstruments[instrumentId],
            waveform,
        };

        setInstruments(updatedInstruments);
    };

    const setInstrumentModulationData = (instrumentId: string, modulationData: number[]) => {
        const updatedInstruments = { ...soundData.instruments };
        updatedInstruments[instrumentId] = {
            ...updatedInstruments[instrumentId],
            modulationData,
        };

        setInstruments(updatedInstruments);
    };

    const editInstrument = (instrument: string): void => {
        setTrackDialogOpen(false);
        setCurrentInstrumentId(instrument);
        setInstrumentDialogOpen(true);
    };

    const addPatternToSequence = async (trackId: number, step: number, patternId: string, size: number): Promise<void> => {
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

            const newNameLabel = nls.localizeByDefault('New');
            let newNameNumber = 1;
            const patterns = Object.values(soundData.patterns);
            while (patterns.filter(i => i.name === `${newNameLabel} ${newNameNumber}`).length) {
                newNameNumber++;
            }

            updateSoundData({
                ...soundData,
                tracks: updatedTracks,
                patterns: {
                    ...soundData.patterns,
                    [newPatternId]: {
                        ...newPattern,
                        name: `${newNameLabel} ${newNameNumber}`,
                        size,
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

    const showPatternSelection = async (size?: number): Promise<QuickPickItem | undefined> =>
        services.quickPickService.show(
            [
                {
                    id: NEW_PATTERN_ID,
                    label: nls.localize('vuengine/editors/sound/newPattern', 'New Pattern'),
                },
                ...Object.keys(soundData.patterns)
                    .filter(patternId => size === undefined || size <= 1 || soundData.patterns[patternId].size === size)
                    .map((patternId, i) => ({
                        id: patternId,
                        label: getPatternName(soundData, patternId),
                    }))
                    .sort((a, b) => a.label.localeCompare(b.label)),
            ],
            {
                title: nls.localize('vuengine/editors/sound/addPattern', 'Add Pattern'),
                placeholder: size !== undefined && size > 1
                    ? nls.localize('vuengine/editors/sound/selectPatternOfSizeToAdd', 'Select a pattern to add... (Size: {0})', size)
                    : nls.localize('vuengine/editors/sound/selectPatternToAdd', 'Select a pattern to add...'),
            }
        );

    const addPattern = async (trackId: number, step: number, size?: number): Promise<boolean> => {
        const patternToAdd = await showPatternSelection(size);
        if (patternToAdd && patternToAdd.id) {
            await addPatternToSequence(trackId, step, patternToAdd.id, size !== undefined && size > 1 ? size : DEFAULT_PATTERN_SIZE);
            updateCurrentSequenceIndex(currentTrackId, step);

            return true;
        }

        return false;
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
            case SoundEditorCommands.ADD_NOTE.id:
                // TODO
                alert('not yet implemented');
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
            case SoundEditorCommands.SEQUENCER_VERTICAL_SCALE_REDUCE.id:
                setSequencerPatternHeight(prev =>
                    prev > SEQUENCER_PATTERN_HEIGHT_MIN ? prev - 2 : prev
                );
                break;
            case SoundEditorCommands.SEQUENCER_VERTICAL_SCALE_INCREASE.id:
                setSequencerPatternHeight(prev =>
                    prev < SEQUENCER_PATTERN_HEIGHT_MAX ? prev + 2 : prev
                );
                break;
            case SoundEditorCommands.SEQUENCER_VERTICAL_SCALE_RESET.id:
                setSequencerPatternHeight(SEQUENCER_PATTERN_HEIGHT_DEFAULT);
                break;
            case SoundEditorCommands.SEQUENCER_HORIZONTAL_SCALE_REDUCE.id:
                setSequencerPatternWidth(prev =>
                    prev > SEQUENCER_PATTERN_WIDTH_MIN ? prev - 2 : prev
                );
                break;
            case SoundEditorCommands.SEQUENCER_HORIZONTAL_SCALE_INCREASE.id:
                setSequencerPatternWidth(prev =>
                    prev < SEQUENCER_PATTERN_WIDTH_MAX ? prev + 2 : prev
                );
                break;
            case SoundEditorCommands.SEQUENCER_HORIZONTAL_SCALE_RESET.id:
                setSequencerPatternWidth(SEQUENCER_PATTERN_WIDTH_DEFAULT);
                break;
            case SoundEditorCommands.PIANO_ROLL_VERTICAL_SCALE_REDUCE.id:
                setPianoRollNoteHeight(prev =>
                    prev > PIANO_ROLL_NOTE_HEIGHT_MIN ? prev - 1 : prev
                );
                break;
            case SoundEditorCommands.PIANO_ROLL_VERTICAL_SCALE_INCREASE.id:
                setPianoRollNoteHeight(prev =>
                    prev < PIANO_ROLL_NOTE_HEIGHT_MAX ? prev + 1 : prev
                );
                break;
            case SoundEditorCommands.PIANO_ROLL_VERTICAL_SCALE_RESET.id:
                setPianoRollNoteHeight(PIANO_ROLL_NOTE_HEIGHT_DEFAULT);
                break;
            case SoundEditorCommands.PIANO_ROLL_HORIZONTAL_SCALE_REDUCE.id:
                setPianoRollNoteWidth(prev =>
                    prev > PIANO_ROLL_NOTE_WIDTH_MIN ? prev - 1 : prev
                );
                break;
            case SoundEditorCommands.PIANO_ROLL_HORIZONTAL_SCALE_INCREASE.id:
                setPianoRollNoteWidth(prev =>
                    prev < PIANO_ROLL_NOTE_WIDTH_MAX ? prev + 1 : prev
                );
                break;
            case SoundEditorCommands.PIANO_ROLL_HORIZONTAL_SCALE_RESET.id:
                setPianoRollNoteWidth(PIANO_ROLL_NOTE_WIDTH_DEFAULT);
                break;
            case SoundEditorCommands.ADD_PATTERN.id:
                // TODO
                alert('not yet implemented');
                break;
            case SoundEditorCommands.REMOVE_UNUSED_PATTERNS.id:
                removeUnusedPatterns();
                break;
            case SoundEditorCommands.REMOVE_UNUSED_INSTRUMENTS.id:
                removeUnusedInstruments();
                break;
            case SoundEditorCommands.OPEN_INSTRUMENT_EDITOR.id:
                editInstrument(currentInstrumentId);
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
        soundData,
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
                trackSettings={trackSettings}
            />
            <VContainer gap={0} grow={1} overflow="hidden">
                <SoundEditorToolbar
                    soundData={soundData}
                    updateSoundData={updateSoundData}
                    currentTrackId={currentTrackId}
                    currentPatternId={currentPatternId}
                    currentPlayerPosition={currentPlayerPosition}
                    currentSequenceIndex={currentSequenceIndex}
                    noteCursor={noteCursor}
                    playing={playing}
                    emulatorInitialized={emulatorInitialized}
                    noteSnapping={noteSnapping}
                    newNoteDuration={newNoteDuration}
                    setNewNoteDuration={setNewNoteDuration}
                    currentInstrumentId={currentInstrumentId}
                    setCurrentInstrumentId={setCurrentInstrumentId}
                    toolsDialogOpen={toolsDialogOpen}
                    setToolsDialogOpen={setToolsDialogOpen}
                    songSettingsDialogOpen={songSettingsDialogOpen}
                    setSongSettingsDialogOpen={setSongSettingsDialogOpen}
                    setNoteEvent={setNoteEvent}
                    setTrack={setTrack}
                />
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
                                currentTrackId={currentTrackId}
                                setCurrentTrackId={updateCurrentTrackId}
                                currentSequenceIndex={currentSequenceIndex}
                                setCurrentSequenceIndex={updateCurrentSequenceIndex}
                                toggleTrackMuted={toggleTrackMuted}
                                toggleTrackSolo={toggleTrackSolo}
                                toggleTrackSeeThrough={toggleTrackSeeThrough}
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
                                removePatternFromSequence={removePatternFromSequence}
                                trackSettings={trackSettings}
                            />
                        }
                        <StyledLowerContainer>
                            {!eventListHidden &&
                                <EventList
                                    soundData={soundData}
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
                                setCurrentInstrumentId={setCurrentInstrumentId}
                                pianoRollScrollWindow={pianoRollScrollWindow}
                                setPatternDialogOpen={setPatternDialogOpen}
                                removePatternFromSequence={removePatternFromSequence}
                                trackSettings={trackSettings}
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
                >
                    <Instruments
                        soundData={soundData}
                        updateSoundData={updateSoundData}
                        currentTrackId={currentTrackId}
                        currentInstrumentId={currentInstrumentId}
                        setInstruments={setInstruments}
                        setWaveformDialogOpen={setWaveformDialogOpen}
                        setModulationDataDialogOpen={setModulationDataDialogOpen}
                        setInstrumentColorDialogOpen={setInstrumentColorDialogOpen}
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
                    height='460px'
                    width='460px'
                    overflow='visible'
                >
                    <VContainer gap={15}>
                        <Song
                            soundData={soundData}
                            updateSoundData={updateSoundData}
                        />
                    </VContainer>
                </PopUpDialog>
            }
            {toolsDialogOpen &&
                <PopUpDialog
                    open={toolsDialogOpen}
                    onClose={() => setToolsDialogOpen(false)}
                    onOk={() => setToolsDialogOpen(false)}
                    title={nls.localizeByDefault('Tools')}
                    height='460px'
                    width='460px'
                    overflow='visible'
                >
                    <VContainer gap={15}>
                        <ImportExport
                            soundData={soundData}
                            updateSoundData={updateSoundData}
                            setToolsDialogOpen={setToolsDialogOpen}
                            setTrackSettings={setTrackSettings}
                            setCurrentSequenceIndex={updateCurrentSequenceIndex}
                        />
                        <VContainer>
                            <label>
                                {nls.localize('vuengine/editors/sound/clean', 'Clean')}
                            </label>
                            <HContainer>
                                <button
                                    className='theia-button secondary'
                                    onClick={() => services.commandService.executeCommand(SoundEditorCommands.REMOVE_UNUSED_PATTERNS.id)}
                                >
                                    {SoundEditorCommands.REMOVE_UNUSED_PATTERNS.label}
                                </button>
                                <button
                                    className='theia-button secondary'
                                    onClick={() => services.commandService.executeCommand(SoundEditorCommands.REMOVE_UNUSED_INSTRUMENTS.id)}
                                >
                                    {SoundEditorCommands.REMOVE_UNUSED_INSTRUMENTS.label}
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
                    height='400px'
                    width='320px'
                    overflow='visible'
                >
                    <CurrentTrack
                        soundData={soundData}
                        setSoundData={updateSoundData}
                        currentTrackId={currentTrackId}
                        setCurrentTrackId={updateCurrentTrackId}
                        setTrack={setTrack}
                        removeTrack={removeTrack}
                        editInstrument={editInstrument}
                        isTrackAvailable={isTrackAvailable}
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
                        updateSoundData={updateSoundData}
                        currentTrackId={currentTrackId}
                        currentPatternId={currentPatternId}
                        setCurrentPatternId={updateCurrentPatternId}
                        setPattern={setPattern}
                        setPatternSize={setPatternSize}
                        setPatternDialogOpen={setPatternDialogOpen}
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
                    <WaveformWithPresets
                        value={soundData.instruments[waveformDialogOpen].waveform}
                        setValue={value => setInstrumentWaveForm(waveformDialogOpen, value)}
                    />
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
                            setValue={value => setInstrumentModulationData(modulationDataDialogOpen, value)}
                        />
                    }
                </PopUpDialog>
            }
            {instrumentColorDialogOpen !== '' &&
                <PopUpDialog
                    open={instrumentColorDialogOpen !== ''}
                    onClose={() => setInstrumentColorDialogOpen('')}
                    onOk={() => setInstrumentColorDialogOpen('')}
                    title={nls.localize('vuengine/editors/sound/editInstrumentColor', 'Edit Instrument Color')}
                    height='180px'
                    width='460px'
                >
                    {soundData.instruments[instrumentColorDialogOpen] &&
                        <PaletteColorSelect
                            color={soundData.instruments[instrumentColorDialogOpen].color}
                            updateColor={color => setInstrumentColor(instrumentColorDialogOpen, color)}
                        />
                    }
                </PopUpDialog>
            }
        </HContainer >
    );
}
