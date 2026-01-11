import { environment, nls, QuickPickItem, QuickPickOptions, QuickPickSeparator, URI } from '@theia/core';
import { CommonCommands, ConfirmDialog } from '@theia/core/lib/browser';
import { OpenFileDialogProps, SaveFileDialogProps } from '@theia/filesystem/lib/browser';
import * as midiManager from 'midi-file';
import React, { useContext, useEffect, useState } from 'react';
import styled from 'styled-components';
import { EditorsContext, EditorsContextType } from '../../ves-editors-types';
import HContainer from '../Common/Base/HContainer';
import PopUpDialog from '../Common/Base/PopUpDialog';
import VContainer from '../Common/Base/VContainer';
import EmptyContainer from '../Common/EmptyContainer';
import PaletteColorSelect from '../Common/PaletteColorSelect';
import { sortObjectByKeys } from '../Common/Utils';
import PlayerRomBuilder from './Emulator/PlayerRomBuilder';
import EventList from './EventList';
import ImportExport from './ImportExport/ImportExport';
import { convertUgeSong } from './ImportExport/uge/ugeConverter';
import { loadUGESong } from './ImportExport/uge/ugeHelper';
import { convertVbmSong } from './ImportExport/vbm/vbmConverter';
import { parseVbmSong } from './ImportExport/vbm/vbmParser';
import Instruments from './Instruments/Instruments';
import AddPattern from './Other/AddPattern';
import CurrentPattern from './Other/CurrentPattern';
import CurrentTrack from './Other/CurrentTrack';
import Properties from './Other/Properties';
import PianoRoll from './PianoRoll/PianoRoll';
import Sequencer from './Sequencer/Sequencer';
import { SoundEditorCommands } from './SoundEditorCommands';
import SoundEditorToolbar from './SoundEditorToolbar';
import {
    ALL_TRACK_TYPES,
    BAR_NOTE_RESOLUTION,
    DEFAULT_NEW_NOTE_DURATION,
    DEFAULT_TRACK_SETTINGS,
    EventsMap,
    InstrumentMap,
    NOTES_LABELS,
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

export interface SetNoteEventProps {
    step: number
    event: SoundEvent
    value?: any
}

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
            return TRACK_TYPE_LABELS[SoundEditorTrackType.NOISE];
        case SoundEditorTrackType.SWEEPMOD:
            return nls.localize('vuengine/editors/sound/trackType/sweepModShort', 'Wave + SM');
        default:
        case SoundEditorTrackType.WAVE:
            return `${TRACK_TYPE_LABELS[SoundEditorTrackType.WAVE]} ${i + 1}`;
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

export const getNoteSlideLabel = (note: string, slide: number): string => {
    const directionLabel = slide < 0 ? '↘' : '↗';
    const noteId = NOTES_LABELS.indexOf(note);
    const targetNoteLabel = NOTES_LABELS[noteId - slide];
    return `${directionLabel}${targetNoteLabel}`;
};

interface SoundEditorProps {
    soundData: SoundData
    updateSoundData: (soundData: SoundData) => void
}

export default function SoundEditor(props: SoundEditorProps): React.JSX.Element {
    const { soundData, updateSoundData } = props;
    const { fileUri, services, setCommands, onCommandExecute, enableCommands } = useContext(EditorsContext) as EditorsContextType;
    const [emulatorInitialized, setEmulatorInitialized] = useState<boolean>(false);
    const [emulatorRomReady, setEmulatorRomReady] = useState<boolean>(false);
    const [playing, setPlaying] = useState<boolean>(false);
    const [testNote, setTestNote] = useState<string>('');
    const [testInstrumentId, setTestInstrumentId] = useState<string>('');
    const [trackSettings, setTrackSettings] = useState<TrackSettings[]>([...soundData.tracks.map(t => (DEFAULT_TRACK_SETTINGS))]);
    const [playRangeStart, setPlayRangeStart] = useState<number>(-1);
    const [playRangeEnd, setPlayRangeEnd] = useState<number>(-1);
    const [currentPlayerPosition, setCurrentPlayerPosition] = useState<number>(-1);
    const [newNoteDuration, setNewNoteDuration] = useState<number>(DEFAULT_NEW_NOTE_DURATION * SUB_NOTE_RESOLUTION);
    const [currentInstrumentId, setCurrentInstrumentId] = useState<string>(TRACK_DEFAULT_INSTRUMENT_ID);
    const [currentTrackId, setCurrentTrackId] = useState<number>(0);
    const [currentPatternId, setCurrentPatternId] = useState<string>(soundData.tracks[0]
        ? Object.values(soundData.tracks[0].sequence)[0] ?? '' : '');
    const [currentSequenceIndex, setCurrentSequenceIndex] = useState<number>(soundData.tracks[0]
        ? parseInt(Object.keys(soundData.tracks[0].sequence)[0]) ?? -1 : -1);
    const [noteCursor, setNoteCursor] = useState<number>(0);
    const [selectedNotes, setSelectedNotes] = useState<number[]>([]);
    const [pianoRollScrollWindow, setPianoRollScrollWindow] = useState<ScrollWindow>({ x: 0, y: 0, w: 0, h: 0 });
    const [pianoRollNoteHeight, setPianoRollNoteHeight] = useState<number>(PIANO_ROLL_NOTE_HEIGHT_DEFAULT);
    const [pianoRollNoteWidth, setPianoRollNoteWidth] = useState<number>(PIANO_ROLL_NOTE_WIDTH_DEFAULT);
    const [sequencerPatternHeight, setSequencerPatternHeight] = useState<number>(SEQUENCER_PATTERN_HEIGHT_DEFAULT);
    const [sequencerPatternWidth, setSequencerPatternWidth] = useState<number>(SEQUENCER_PATTERN_WIDTH_DEFAULT);
    const [sequencerHidden, setSequencerHidden] = useState<boolean>(false);
    const [effectsPanelHidden, setEffectsPanelHidden] = useState<boolean>(true);
    const [eventListHidden, setEventListHidden] = useState<boolean>(true);
    const [noteSnapping, setNoteSnapping] = useState<boolean>(true);
    const [addPatternDialogOpen, setAddPatternDialogOpen] = useState<{ trackId: number, step: number, size?: number }>({ trackId: -1, step: -1 });
    const [instrumentDialogOpen, setInstrumentDialogOpen] = useState<boolean>(false);
    const [toolsDialogOpen, setToolsDialogOpen] = useState<boolean>(false);
    const [propertiesDialogOpen, setPropertiesDialogOpen] = useState<boolean>(false);
    const [trackDialogOpen, setTrackDialogOpen] = useState<boolean>(false);
    const [patternDialogOpen, setPatternDialogOpen] = useState<boolean>(false);
    const [waveformDialogOpen, setWaveformDialogOpen] = useState<string>('');
    const [modulationDataDialogOpen, setModulationDataDialogOpen] = useState<string>('');
    const [instrumentColorDialogOpen, setInstrumentColorDialogOpen] = useState<string>('');
    const [playerRomBuilder] = useState<PlayerRomBuilder>(new PlayerRomBuilder(services));
    const [forcePlayerRomRebuild, setForcePlayerRomRebuild] = useState<number>(0);
    const [rangeDragStartStep, setRangeDragStartStep] = useState<number>(-1);
    const [rangeDragEndStep, setRangeDragEndStep] = useState<number>(-1);
    const [noteClipboard, setNoteClipboard] = useState<EventsMap>({});

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

    const playNote = (note: string, instrumentId: string = ''): void => {
        setTestNote(note);
        setTestInstrumentId(instrumentId);
        setPlaying(!!note);
        setCurrentPlayerPosition(-1);
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
        setSelectedNotes([]);
        setNoteCursor(newSequenceIndex * SEQUENCER_RESOLUTION * SUB_NOTE_RESOLUTION);
        setCurrentInstrumentId(TRACK_DEFAULT_INSTRUMENT_ID);
    };

    const updateCurrentPatternId = (trackId: number, patternId: string): void => {
        setCurrentPatternId(patternId);
        if (trackId !== currentTrackId) {
            setCurrentTrackId(trackId);
            setCurrentInstrumentId(TRACK_DEFAULT_INSTRUMENT_ID);
        }
        let sequenceIndex = -1;
        for (const [step, pId] of Object.entries(soundData.tracks[trackId].sequence)) {
            if (pId === patternId) {
                sequenceIndex = parseInt(step);
                break;
            }
        }
        setCurrentSequenceIndex(sequenceIndex);
        setSelectedNotes([]);
        setNoteCursor(sequenceIndex * SEQUENCER_RESOLUTION * SUB_NOTE_RESOLUTION);
    };

    const updateCurrentSequenceIndex = (trackId: number, sequenceIndex: number): void => {
        const track = soundData.tracks[trackId];
        const sequence = track?.sequence;
        if (trackId !== currentTrackId) {
            setCurrentTrackId(trackId);
            setCurrentInstrumentId(TRACK_DEFAULT_INSTRUMENT_ID);
        }
        setCurrentPatternId(sequence && sequence[sequenceIndex] ? sequence[sequenceIndex] : '');
        setCurrentSequenceIndex(sequenceIndex);
        setSelectedNotes([]);
        setNoteCursor(sequenceIndex * SEQUENCER_RESOLUTION * SUB_NOTE_RESOLUTION);
    };

    const updateNoteCursor = (step: number): void => {
        setNoteCursor(step);

        // Select note at note cursor step, if there is one
        const updatedSelectedNotes: number[] = [];
        const currentPatternStartStep = currentSequenceIndex * SEQUENCER_RESOLUTION * SUB_NOTE_RESOLUTION;
        const patternRelativeStep = step - currentPatternStartStep;
        const currentPattern = soundData.patterns[currentPatternId];
        const currentPatternEvents = currentPattern?.events;
        if (currentPatternEvents[patternRelativeStep] && currentPatternEvents[patternRelativeStep][SoundEvent.Note]) {
            updatedSelectedNotes.push(patternRelativeStep);
        }
        setSelectedNotes(updatedSelectedNotes);
    };

    const updateSelectedNotes = (notes: number[]): void => {
        setSelectedNotes(notes);
        const currentPatternStartStep = currentSequenceIndex * SEQUENCER_RESOLUTION * SUB_NOTE_RESOLUTION;
        setNoteCursor(currentPatternStartStep + (notes[0] ?? 0));
    };

    const selectAllNotesInCurrentPattern = (): void => {
        const currentPattern = soundData.patterns[currentPatternId];
        const currentPatternEvents = currentPattern?.events;
        if (!currentPatternEvents) {
            return;
        }
        const currentPatternNoteSteps = Object.keys(currentPatternEvents)
            .map(step => parseInt(step))
            .filter(step => currentPatternEvents[step][SoundEvent.Note]);

        setSelectedNotes(currentPatternNoteSteps);
    };

    const copyNotes = (): void => {
        const noteEvents: EventsMap = {};
        selectedNotes.forEach(sn => {
            const currentPattern = soundData.patterns[currentPatternId];
            if (currentPattern.events[sn] !== undefined) {
                noteEvents[sn] = currentPattern.events[sn];
            }
        });
        setNoteClipboard(noteEvents);
    };

    const pasteNotes = (): void => {
        const notesToPaste: EventsMap = {};
        const currentPattern = soundData.patterns[currentPatternId];
        if (currentPattern === undefined) {
            return;
        }

        const patternStepOffset = currentSequenceIndex * BAR_NOTE_RESOLUTION / SEQUENCER_RESOLUTION;
        const relativeNoteCursor = noteCursor - patternStepOffset;
        const smallestStep = Math.min(...Object.keys(noteClipboard).map(n => parseInt(n)));
        Object.keys(noteClipboard).forEach(step => {
            const stepInt = parseInt(step);
            if (currentPattern.events[stepInt] !== undefined) {
                notesToPaste[stepInt - smallestStep + relativeNoteCursor] = currentPattern.events[stepInt];
            }
        });

        if (Object.keys(notesToPaste).length) {
            setNotes(notesToPaste);
        }
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
                id: ALL_TRACK_TYPES,
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
            if (trackType.id === ALL_TRACK_TYPES) {
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

        const ellipsis = unusedPatternsNames.length > 15 ? '\n[…]' : '';
        const patternList = `• ${unusedPatternsNames.slice(0, 15).join('\n• ')}${ellipsis}`;

        // prompt
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
        // get all instruments used on placed patterns or set as track default instrument
        const usedInstruments: string[] = [];
        soundData.tracks.forEach(track => {
            usedInstruments.push(track.instrument);

            Object.values(track.sequence).forEach(patternId => {
                const pattern = soundData.patterns[patternId];
                Object.values(pattern?.events ?? {}).forEach(event => {
                    if (event[SoundEvent.Instrument]) {
                        usedInstruments.push(event[SoundEvent.Instrument]);
                    }
                });
            });
        });

        // get all instruments, then filter out used ones
        const unusedInstrumentIds = Object.keys(soundData.instruments)
            .filter(instrumentId => !usedInstruments.includes(instrumentId));

        // stop if no unused instruments found
        if (unusedInstrumentIds.length === 0) {
            services.messageService.info(nls.localize(
                'vuengine/editors/sound/noUnusedInstrumentsFound',
                'No unused instruments could be found.'
            ));
            return;
        }

        const unusedInstrumentsNames = unusedInstrumentIds.map(instrumentId => soundData.instruments[instrumentId].name ?? 'unnamed');
        const ellipsis = unusedInstrumentsNames.length > 15 ? '\n[…]' : '';
        const patternList = `• ${unusedInstrumentsNames.slice(0, 15).join('\n• ')}${ellipsis}`;

        const dialog = new ConfirmDialog({
            title: SoundEditorCommands.REMOVE_UNUSED_INSTRUMENTS.label,
            msg: `${nls.localize(
                'vuengine/editors/sound/confirmRemoveUnusedInstruments',
                "This will delete all instruments that are not currently used as a track's default instrument or in any pattern that is placed on a track.\n\
Are you sure you want to do this?\n\n\
A total of {0} instruments will be deleted.",
                unusedInstrumentsNames.length
            )}\n\n${patternList}`,
        });
        const confirmed = await dialog.open();
        if (confirmed) {
            const updatedInstruments = { ...soundData.instruments };

            unusedInstrumentIds.forEach(instrumentId => {
                delete updatedInstruments[instrumentId];
            });

            updateSoundData({
                ...soundData,
                instruments: updatedInstruments,
            });

            services.messageService.info(nls.localize(
                'vuengine/editors/sound/unusedInstrumentsDeleted',
                'Successfully deleted {0} unused instruments.',
                unusedInstrumentsNames.length
            ));
        }
    };

    const togglePlaying = (): void => {
        setPlaying(!playing);
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

    const setNotes = (notes: EventsMap): void => {
        const currentPattern = soundData.patterns[currentPatternId];
        if (currentPattern === undefined) {
            return;
        }

        const updatedEvents: EventsMap = {
            ...sortObjectByKeys(currentPattern.events),
        };

        const removeNoteFromEvents = (stepToRemove: number) => {
            if (updatedEvents[stepToRemove] === undefined) {
                return;
            }

            // remove all note-related events
            delete updatedEvents[stepToRemove][SoundEvent.Note];
            delete updatedEvents[stepToRemove][SoundEvent.Instrument];
            delete updatedEvents[stepToRemove][SoundEvent.Duration];
            delete updatedEvents[stepToRemove][SoundEvent.NoteSlide];

            // if no events remain, remove entirely
            if (Object.keys(updatedEvents[stepToRemove]).length === 0) {
                delete updatedEvents[stepToRemove];
            }
        };

        // remove notes
        Object.keys(notes).forEach(step => {
            const stepInt = parseInt(step);
            if (Object.keys(notes[stepInt]).length === 0) {
                removeNoteFromEvents(stepInt);
            }
        });

        // set notes
        Object.keys(sortObjectByKeys(notes)).forEach(step => {
            const stepInt = parseInt(step);
            if (Object.keys(notes[stepInt]).length > 0) {
                updatedEvents[stepInt] = {
                    ...currentPattern.events[stepInt] ?? {},
                    ...notes[stepInt],
                };

                // remove explicit default instrument
                const currentTrack = soundData.tracks[currentTrackId];
                if (updatedEvents[stepInt][SoundEvent.Instrument] !== undefined && updatedEvents[stepInt][SoundEvent.Instrument] === currentTrack?.instrument) {
                    delete (updatedEvents[stepInt][SoundEvent.Instrument]);
                }

                // remove events with empty value
                Object.keys(updatedEvents[stepInt]).forEach(e => {
                    if (updatedEvents[stepInt][e] === '') {
                        delete updatedEvents[stepInt][e];
                    }
                });

                // if no events remain, remove entirely
                if (Object.keys(updatedEvents[stepInt]).length === 0) {
                    delete updatedEvents[stepInt];
                }

                // ensure clean key order
                updatedEvents[stepInt] = sortObjectByKeys(updatedEvents[stepInt]);
            }
        });

        // cap all note durations
        let prevStep = -1;
        [
            ...Object.keys(updatedEvents),
            (currentPattern.size * SUB_NOTE_RESOLUTION * SEQUENCER_RESOLUTION).toString(), // pattern size is last note's limit
        ].forEach(step => {
            const stepInt = parseInt(step);
            if (
                updatedEvents[prevStep] !== undefined &&
                updatedEvents[prevStep][SoundEvent.Duration] !== undefined &&
                updatedEvents[prevStep][SoundEvent.Duration] > (stepInt - prevStep)
            ) {
                updatedEvents[prevStep][SoundEvent.Duration] = stepInt - prevStep;
            }

            prevStep = stepInt;
        });

        setPattern(currentPatternId, {
            events: updatedEvents,
        });
    };

    // TODO: remove and replace all usage with setNotes()
    const setNoteEvent = (notes: SetNoteEventProps[]): void => {
        const currentPattern = soundData.patterns[currentPatternId];

        if (currentPattern === undefined) {
            return;
        }

        const updatedEvents: EventsMap = {
            ...currentPattern.events,
        };

        notes.forEach(n => {
            updatedEvents[n.step] = {
                ...(currentPattern.events[n.step] ?? {})
            };

            if (n.value === undefined) {
                delete (updatedEvents[n.step][n.event]);
            } else {
                updatedEvents[n.step][n.event] = n.value;
            }

            // remove step, if empty
            if (Object.keys(updatedEvents[n.step]).length === 0) {
                delete (updatedEvents[n.step]);
            }
        });

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

    const addPattern = (trackId: number, step: number, size?: number): void => {
        setAddPatternDialogOpen({ trackId, step, size });
    };

    const confirmOverwrite = async (uri: URI): Promise<boolean> => {
        // We only need this in browsers. Electron brings up the OS-level confirmation dialog instead.
        if (environment.electron.is()) {
            return true;
        }
        const confirmed = await new ConfirmDialog({
            title: nls.localize('vuengine/editors/sound/overwrite', 'Overwrite'),
            msg: nls.localize('vuengine/editors/sound/doYouReallyWantToOverwrite', 'Do you really want to overwrite "{0}"?', uri.path.fsPath()),
        }).open();
        return !!confirmed;
    };

    const exportFile = async (): Promise<void> => {
        const romUri = await playerRomBuilder.buildSoundPlayerRom(soundData, -1, -1, -1, [...soundData.tracks.map(t => (DEFAULT_TRACK_SETTINGS))], false);
        let exists: boolean = false;
        let overwrite: boolean = false;
        let selected: URI | undefined;
        const saveFilterDialogProps: SaveFileDialogProps = {
            title: nls.localize('vuengine/export/exportRom', 'Export ROM'),
            inputValue: `${fileUri.path.name}.vb`,
        };
        const homedir = await services.envVariablesServer.getHomeDirUri();
        const romStat = await services.fileService.resolve(new URI(homedir).withScheme('file'));
        do {
            selected = await services.fileDialogService.showSaveDialog(
                saveFilterDialogProps,
                romStat
            );
            if (selected) {
                exists = await services.fileService.exists(selected);
                if (exists) {
                    overwrite = await confirmOverwrite(selected);
                }
            }
        } while (selected && exists && !overwrite);
        if (selected) {
            try {
                await services.commandService.executeCommand(CommonCommands.SAVE.id);
                await services.fileService.copy(romUri, selected, { overwrite });
            } catch (e) {
                console.warn(e);
            }
        }
    };

    const importFile = async (): Promise<void> => {
        const openFileDialogProps: OpenFileDialogProps = {
            title: nls.localize('vuengine/editors/sound/selectFiles', 'Select file to import'),
            canSelectFolders: false,
            canSelectFiles: true,
            canSelectMany: false,
            filters: {
                [nls.localize('vuengine/editors/sound/supportedFiles', 'Supported Files')]: [
                    // 'midi', 'mid',
                    // 's3m',
                    'uge',
                    'vbm',
                ],
            }
        };
        const currentPath = await services.fileService.resolve(fileUri.parent);
        const uri: URI | undefined = await services.fileDialogService.showOpenDialog(openFileDialogProps, currentPath);
        if (uri) {
            const fileContent = await services.fileService.readFile(uri);
            const fileArrayBuffer = fileContent.value.buffer as unknown as ArrayBuffer;
            let importedSoundData: SoundData | undefined;
            switch (uri.path.ext) {
                case '.mid':
                case '.midi':
                    const parsedMidi = midiManager.parseMidi(fileContent.value.buffer);
                    console.log('parsed', parsedMidi);
                    break;
                case '.s3m':
                    const parsedS3mSong = window.electronVesCore.kaitaiParse(fileArrayBuffer, uri.path.ext);
                    console.log('parsed', parsedS3mSong);
                    break;
                case '.uge':
                    const parsedUgeSong = loadUGESong(fileArrayBuffer);
                    if (parsedUgeSong) {
                        importedSoundData = convertUgeSong(parsedUgeSong);
                    }
                    break;
                case '.vbm':
                    const parsedVbmSong = parseVbmSong(fileArrayBuffer);
                    if (parsedVbmSong) {
                        importedSoundData = convertVbmSong(parsedVbmSong);
                    }
                    break;
            }

            if (!importedSoundData) {
                services.messageService.error(
                    nls.localize(
                        'vuengine/editors/sound/importError',
                        'The was an error importing the file {0}.',
                        uri.path.base,
                    ));
                return;
            }

            setTrackSettings([...importedSoundData.tracks.map(t => (DEFAULT_TRACK_SETTINGS))]);
            updateSoundData({ ...soundData, ...importedSoundData });
            setToolsDialogOpen(false);
            updateCurrentSequenceIndex(0, 0);
        }
    };

    const commandListener = (commandId: string): void => {
        switch (commandId) {
            case SoundEditorCommands.ADD_TRACK.id:
                addTrack();
                break;
            case SoundEditorCommands.PLAY_PAUSE.id:
                if (soundData.tracks.length > 0) {
                    togglePlaying();
                }
                break;
            case SoundEditorCommands.STOP.id:
                if (soundData.tracks.length > 0) {
                    stopPlaying();
                }
                break;
            case SoundEditorCommands.ADD_PATTERN.id:
                if (soundData.tracks.length > 0) {
                    const noteCursorStep = Math.floor(noteCursor / SUB_NOTE_RESOLUTION / SEQUENCER_RESOLUTION);
                    addPattern(currentTrackId, noteCursorStep);
                }
                break;
            case SoundEditorCommands.TOGGLE_NOTE_SNAPPING.id:
                if (soundData.tracks.length > 0) {
                    setNoteSnapping(prev => !prev);
                }
                break;
            case SoundEditorCommands.TOGGLE_EVENT_LIST_VISIBILITY.id:
                if (soundData.tracks.length > 0) {
                    setEventListHidden(prev => !prev);
                }
                break;
            case SoundEditorCommands.TOGGLE_SEQUENCER_VISIBILITY.id:
                if (soundData.tracks.length > 0) {
                    setSequencerHidden(prev => !prev);
                }
                break;
            case SoundEditorCommands.SEQUENCER_VERTICAL_SCALE_REDUCE.id:
                if (soundData.tracks.length > 0) {
                    setSequencerPatternHeight(prev =>
                        prev > SEQUENCER_PATTERN_HEIGHT_MIN ? prev - 2 : prev
                    );
                }
                break;
            case SoundEditorCommands.SEQUENCER_VERTICAL_SCALE_INCREASE.id:
                if (soundData.tracks.length > 0) {
                    setSequencerPatternHeight(prev =>
                        prev < SEQUENCER_PATTERN_HEIGHT_MAX ? prev + 2 : prev
                    );
                }
                break;
            case SoundEditorCommands.SEQUENCER_VERTICAL_SCALE_RESET.id:
                if (soundData.tracks.length > 0) {
                    setSequencerPatternHeight(SEQUENCER_PATTERN_HEIGHT_DEFAULT);
                }
                break;
            case SoundEditorCommands.SEQUENCER_HORIZONTAL_SCALE_REDUCE.id:
                if (soundData.tracks.length > 0) {
                    setSequencerPatternWidth(prev =>
                        prev > SEQUENCER_PATTERN_WIDTH_MIN ? prev - 2 : prev
                    );
                }
                break;
            case SoundEditorCommands.SEQUENCER_HORIZONTAL_SCALE_INCREASE.id:
                if (soundData.tracks.length > 0) {
                    setSequencerPatternWidth(prev =>
                        prev < SEQUENCER_PATTERN_WIDTH_MAX ? prev + 2 : prev
                    );
                }
                break;
            case SoundEditorCommands.SEQUENCER_HORIZONTAL_SCALE_RESET.id:
                if (soundData.tracks.length > 0) {
                    setSequencerPatternWidth(SEQUENCER_PATTERN_WIDTH_DEFAULT);
                }
                break;
            case SoundEditorCommands.PIANO_ROLL_VERTICAL_SCALE_REDUCE.id:
                if (soundData.tracks.length > 0) {
                    setPianoRollNoteHeight(prev =>
                        prev > PIANO_ROLL_NOTE_HEIGHT_MIN ? prev - 1 : prev
                    );
                }
                break;
            case SoundEditorCommands.PIANO_ROLL_VERTICAL_SCALE_INCREASE.id:
                if (soundData.tracks.length > 0) {
                    setPianoRollNoteHeight(prev =>
                        prev < PIANO_ROLL_NOTE_HEIGHT_MAX ? prev + 1 : prev
                    );
                }
                break;
            case SoundEditorCommands.PIANO_ROLL_VERTICAL_SCALE_RESET.id:
                if (soundData.tracks.length > 0) {
                    setPianoRollNoteHeight(PIANO_ROLL_NOTE_HEIGHT_DEFAULT);
                }
                break;
            case SoundEditorCommands.PIANO_ROLL_HORIZONTAL_SCALE_REDUCE.id:
                if (soundData.tracks.length > 0) {
                    setPianoRollNoteWidth(prev =>
                        prev > PIANO_ROLL_NOTE_WIDTH_MIN ? prev / 1.2 : prev
                    );
                }
                break;
            case SoundEditorCommands.PIANO_ROLL_HORIZONTAL_SCALE_INCREASE.id:
                if (soundData.tracks.length > 0) {
                    setPianoRollNoteWidth(prev =>
                        prev < PIANO_ROLL_NOTE_WIDTH_MAX ? prev * 1.2 : prev
                    );
                }
                break;
            case SoundEditorCommands.PIANO_ROLL_HORIZONTAL_SCALE_RESET.id:
                if (soundData.tracks.length > 0) {
                    setPianoRollNoteWidth(PIANO_ROLL_NOTE_WIDTH_DEFAULT);
                }
                break;
            case SoundEditorCommands.REMOVE_UNUSED_PATTERNS.id:
                if (soundData.tracks.length > 0) {
                    removeUnusedPatterns();
                    setToolsDialogOpen(false);
                }
                break;
            case SoundEditorCommands.REMOVE_UNUSED_INSTRUMENTS.id:
                if (soundData.tracks.length > 0) {
                    removeUnusedInstruments();
                    setToolsDialogOpen(false);
                }
                break;
            case SoundEditorCommands.OPEN_INSTRUMENT_EDITOR.id:
                if (soundData.tracks.length > 0) {
                    editInstrument(currentInstrumentId);
                }
                break;
            case SoundEditorCommands.IMPORT.id:
                importFile();
                break;
            case SoundEditorCommands.EXPORT.id:
                if (soundData.tracks.length > 0) {
                    exportFile();
                }
                break;
            case SoundEditorCommands.SELECT_ALL_NOTES.id:
                if (soundData.tracks.length > 0) {
                    selectAllNotesInCurrentPattern();
                }
                break;
            case SoundEditorCommands.COPY_SELECTED_NOTES.id:
                if (soundData.tracks.length > 0) {
                    copyNotes();
                }
                break;
            case SoundEditorCommands.PASTE_SELECTED_NOTES.id:
                if (soundData.tracks.length > 0) {
                    pasteNotes();
                }
                break;
            case SoundEditorCommands.SET_NOTE_LENGTH_1.id:
                if (soundData.tracks.length > 0) {
                    setNewNoteDuration(16 * SUB_NOTE_RESOLUTION);
                }
                break;
            case SoundEditorCommands.SET_NOTE_LENGTH_2.id:
                if (soundData.tracks.length > 0) {
                    setNewNoteDuration(8 * SUB_NOTE_RESOLUTION);
                }
                break;
            case SoundEditorCommands.SET_NOTE_LENGTH_4.id:
                if (soundData.tracks.length > 0) {
                    setNewNoteDuration(4 * SUB_NOTE_RESOLUTION);
                }
                break;
            case SoundEditorCommands.SET_NOTE_LENGTH_8.id:
                if (soundData.tracks.length > 0) {
                    setNewNoteDuration(2 * SUB_NOTE_RESOLUTION);
                }
                break;
            case SoundEditorCommands.SET_NOTE_LENGTH_16.id:
                if (soundData.tracks.length > 0) {
                    setNewNoteDuration(1 * SUB_NOTE_RESOLUTION);
                }
                break;
        }
    };

    useEffect(() => {
        setCommands([
            ...Object.values(SoundEditorCommands).map(c => c.id)
        ]);
    }, []);

    useEffect(() => {
        const disp = onCommandExecute(commandListener);
        return () => disp.dispose();
    }, [
        currentTrackId,
        noteCursor,
        playing,
        setPlaying,
        soundData,
    ]);

    useEffect(() => {
        if (!instrumentDialogOpen && testInstrumentId !== '') {
            setTestInstrumentId('');
            setTestNote('');
            setPlaying(false);
        }
    }, [
        instrumentDialogOpen,
    ]);

    return (
        <HContainer
            className="musicEditor"
            gap={0}
            overflow="hidden"
            style={{ padding: 0 }}
        >
            <VContainer gap={0} grow={1} overflow="hidden">
                <SoundEditorToolbar
                    soundData={soundData}
                    updateSoundData={updateSoundData}
                    currentTrackId={currentTrackId}
                    currentPatternId={currentPatternId}
                    currentPlayerPosition={currentPlayerPosition}
                    setCurrentPlayerPosition={setCurrentPlayerPosition}
                    currentSequenceIndex={currentSequenceIndex}
                    playing={playing}
                    emulatorInitialized={emulatorInitialized}
                    setEmulatorInitialized={setEmulatorInitialized}
                    emulatorRomReady={emulatorRomReady}
                    setEmulatorRomReady={setEmulatorRomReady}
                    noteSnapping={noteSnapping}
                    newNoteDuration={newNoteDuration}
                    setNewNoteDuration={setNewNoteDuration}
                    testNote={testNote}
                    testInstrumentId={testInstrumentId}
                    playRangeStart={playRangeStart}
                    playRangeEnd={playRangeEnd}
                    trackSettings={trackSettings}
                    playerRomBuilder={playerRomBuilder}
                    currentInstrumentId={currentInstrumentId}
                    setCurrentInstrumentId={setCurrentInstrumentId}
                    toolsDialogOpen={toolsDialogOpen}
                    setToolsDialogOpen={setToolsDialogOpen}
                    propertiesDialogOpen={propertiesDialogOpen}
                    setPropertiesDialogOpen={setPropertiesDialogOpen}
                    selectedNotes={selectedNotes}
                    setNoteEvent={setNoteEvent}
                    setTrack={setTrack}
                    forcePlayerRomRebuild={forcePlayerRomRebuild}
                />
                {soundData.tracks.length === 0
                    ? <VContainer grow={1} style={{ position: 'relative' }}>
                        <EmptyContainer
                            title={nls.localize('vuengine/editors/sound/soundIsEmpty', 'This sound is empty')}
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
                                setCurrentPlayerPosition={setCurrentPlayerPosition}
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
                                playRangeStart={playRangeStart}
                                setPlayRangeStart={setPlayRangeStart}
                                playRangeEnd={playRangeEnd}
                                setPlayRangeEnd={setPlayRangeEnd}
                                rangeDragStartStep={rangeDragStartStep}
                                setRangeDragStartStep={setRangeDragStartStep}
                                rangeDragEndStep={rangeDragEndStep}
                                setRangeDragEndStep={setRangeDragEndStep}
                                setForcePlayerRomRebuild={setForcePlayerRomRebuild}
                            />
                        }
                        <StyledLowerContainer>
                            {!eventListHidden &&
                                <EventList
                                    soundData={soundData}
                                    currentTrackId={currentTrackId}
                                    currentSequenceIndex={currentSequenceIndex}
                                    pattern={soundData.patterns[currentPatternId]}
                                    noteCursor={noteCursor}
                                    setNotes={setNotes}
                                    setNoteCursor={updateNoteCursor}
                                />
                            }
                            <PianoRoll
                                soundData={soundData}
                                currentPlayerPosition={currentPlayerPosition}
                                setCurrentPlayerPosition={setCurrentPlayerPosition}
                                setForcePlayerRomRebuild={setForcePlayerRomRebuild}
                                noteCursor={noteCursor}
                                setNoteCursor={updateNoteCursor}
                                currentPatternId={currentPatternId}
                                currentTrackId={currentTrackId}
                                currentSequenceIndex={currentSequenceIndex}
                                setCurrentSequenceIndex={updateCurrentSequenceIndex}
                                playRangeStart={playRangeStart}
                                setPlayRangeStart={setPlayRangeStart}
                                playRangeEnd={playRangeEnd}
                                setPlayRangeEnd={setPlayRangeEnd}
                                playNote={playNote}
                                setNotes={setNotes}
                                setNoteEvent={setNoteEvent}
                                addPattern={addPattern}
                                sequencerHidden={sequencerHidden}
                                setSequencerHidden={setSequencerHidden}
                                effectsPanelHidden={effectsPanelHidden}
                                setEffectsPanelHidden={setEffectsPanelHidden}
                                eventListHidden={eventListHidden}
                                setEventListHidden={setEventListHidden}
                                selectedNotes={selectedNotes}
                                setSelectedNotes={updateSelectedNotes}
                                noteSnapping={noteSnapping}
                                newNoteDuration={newNoteDuration}
                                pianoRollNoteHeight={pianoRollNoteHeight}
                                setPianoRollNoteHeight={setPianoRollNoteHeight}
                                pianoRollNoteWidth={pianoRollNoteWidth}
                                setPianoRollNoteWidth={setPianoRollNoteWidth}
                                sequencerPatternHeight={sequencerPatternHeight}
                                sequencerPatternWidth={sequencerPatternWidth}
                                setPianoRollScrollWindow={setPianoRollScrollWindow}
                                setCurrentInstrumentId={setCurrentInstrumentId}
                                pianoRollScrollWindow={pianoRollScrollWindow}
                                setPatternDialogOpen={setPatternDialogOpen}
                                removePatternFromSequence={removePatternFromSequence}
                                trackSettings={trackSettings}
                                rangeDragStartStep={rangeDragStartStep}
                                setRangeDragStartStep={setRangeDragStartStep}
                                rangeDragEndStep={rangeDragEndStep}
                                setRangeDragEndStep={setRangeDragEndStep}
                            />
                        </StyledLowerContainer>
                    </>}
            </VContainer>
            {addPatternDialogOpen.trackId > -1 &&
                <PopUpDialog
                    open={addPatternDialogOpen.trackId > -1}
                    onClose={() => {
                        setAddPatternDialogOpen({ trackId: -1, step: -1 });
                        enableCommands();
                    }}
                    onOk={() => {
                        setAddPatternDialogOpen({ trackId: -1, step: -1 });
                        enableCommands();
                    }}
                    title={nls.localize('vuengine/editors/sound/addPattern', 'Add Pattern')}
                    height='100%'
                    width='100%'
                >
                    <AddPattern
                        soundData={soundData}
                        updateSoundData={updateSoundData}
                        step={addPatternDialogOpen.step}
                        trackId={addPatternDialogOpen.trackId}
                        size={addPatternDialogOpen.size !== undefined && addPatternDialogOpen.size > -1 ? addPatternDialogOpen.size : undefined}
                        sequencerPatternHeight={sequencerPatternHeight}
                        sequencerPatternWidth={sequencerPatternWidth}
                        setCurrentSequenceIndex={updateCurrentSequenceIndex}
                        setTrack={setTrack}
                        setAddPatternDialogOpen={setAddPatternDialogOpen}
                    />
                </PopUpDialog>
            }
            {instrumentDialogOpen &&
                <PopUpDialog
                    open={instrumentDialogOpen}
                    onClose={() => {
                        setInstrumentDialogOpen(false);
                        enableCommands();
                    }}
                    onOk={() => {
                        setInstrumentDialogOpen(false);
                        enableCommands();
                    }}
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
                        playingTestNote={playing && !!testNote}
                        playNote={playNote}
                        emulatorInitialized={emulatorInitialized}
                        setForcePlayerRomRebuild={setForcePlayerRomRebuild}
                    />
                </PopUpDialog>
            }
            {propertiesDialogOpen &&
                <PopUpDialog
                    open={propertiesDialogOpen}
                    onClose={() => {
                        setPropertiesDialogOpen(false);
                        enableCommands();
                    }}
                    onOk={() => {
                        setPropertiesDialogOpen(false);
                        enableCommands();
                    }}
                    title={nls.localize('vuengine/editors/sound/properties', 'Properties')}
                    height='460px'
                    width='460px'
                    overflow='visible'
                >
                    <VContainer gap={15}>
                        <Properties
                            soundData={soundData}
                            updateSoundData={updateSoundData}
                        />
                    </VContainer>
                </PopUpDialog>
            }
            {toolsDialogOpen &&
                <PopUpDialog
                    open={toolsDialogOpen}
                    onClose={() => {
                        setToolsDialogOpen(false);
                        enableCommands();
                    }}
                    onOk={() => {
                        setToolsDialogOpen(false);
                        enableCommands();
                    }}
                    title={nls.localize('vuengine/editors/sound/tools', 'Tools')}
                    height='260px'
                    width='460px'
                    overflow='visible'
                >
                    <VContainer gap={15}>
                        <ImportExport
                            soundData={soundData}
                        />
                        {soundData.tracks.length > 0 &&
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
                        }
                    </VContainer>
                </PopUpDialog>
            }
            {trackDialogOpen &&
                <PopUpDialog
                    open={trackDialogOpen}
                    onClose={() => {
                        setTrackDialogOpen(false);
                        enableCommands();
                    }}
                    onOk={() => {
                        setTrackDialogOpen(false);
                        enableCommands();
                    }}
                    title={nls.localize('vuengine/editors/sound/editTrack', 'Edit Track')}
                    height='340px'
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
                    onClose={() => {
                        setPatternDialogOpen(false);
                        enableCommands();
                    }}
                    onOk={() => {
                        setPatternDialogOpen(false);
                        enableCommands();
                    }}
                    title={nls.localize('vuengine/editors/sound/editPattern', 'Edit Pattern')
                    }
                    height='350px'
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
                    onClose={() => {
                        setWaveformDialogOpen('');
                        enableCommands();
                    }}
                    onOk={() => {
                        setWaveformDialogOpen('');
                        enableCommands();
                    }}
                    title={nls.localize('vuengine/editors/sound/editWaveform', 'Edit Waveform')
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
                    onClose={() => {
                        setModulationDataDialogOpen('');
                        enableCommands();
                    }}
                    onOk={() => {
                        setModulationDataDialogOpen('');
                        enableCommands();
                    }}
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
                    onClose={() => {
                        setInstrumentColorDialogOpen('');
                        enableCommands();
                    }}
                    onOk={() => {
                        setInstrumentColorDialogOpen('');
                        enableCommands();
                    }}
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
