import { deepClone, environment, nls, URI } from '@theia/core';
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
import { VsuChannelStereoLevelsData } from './Emulator/VsuTypes';
import EventList from './EventList/EventList';
import { convertUgeSong } from './ImportExport/uge/ugeConverter';
import { loadUGESong } from './ImportExport/uge/ugeHelper';
import { convertVbmSong } from './ImportExport/vbm/vbmConverter';
import { parseVbmSong } from './ImportExport/vbm/vbmParser';
import Instruments from './Instruments/Instruments';
import AddPattern from './Other/AddPattern';
import AddTrack from './Other/AddTrack';
import CurrentPattern from './Other/CurrentPattern';
import CurrentTrack from './Other/CurrentTrack';
import Keybindings from './Other/Keybindings';
import NoteProperties from './Other/NoteProperties';
import Properties from './Other/Properties';
import Utilities from './Other/Utilities';
import PianoRoll from './PianoRoll/PianoRoll';
import Sequencer from './Sequencer/Sequencer';
import { SoundEditorCommands } from './SoundEditorCommands';
import SoundEditorToolbar from './SoundEditorToolbar';
import {
    DEFAULT_TRACK_SETTINGS,
    EventsMap,
    InstrumentMap,
    NOTE_RESOLUTION,
    NOTES_LABELS,
    PatternConfig,
    PIANO_ROLL_NOTE_HEIGHT_DEFAULT,
    PIANO_ROLL_NOTE_WIDTH_DEFAULT,
    ScrollWindow,
    SEQUENCER_PATTERN_HEIGHT_DEFAULT,
    SEQUENCER_PATTERN_WIDTH_DEFAULT,
    SoundData,
    SoundEditorMarqueeMode,
    SoundEditorTool,
    SoundEditorTrackType,
    SoundEvent,
    SUB_NOTE_RESOLUTION,
    TRACK_DEFAULT_INSTRUMENT_ID,
    TRACK_DEFAULT_INSTRUMENT_NAME,
    TRACK_TYPE_LABELS,
    TrackConfig,
    TrackSettings
} from './SoundEditorTypes';
import ModulationDataWithPresets from './Waveforms/ModulationDataWithPresets';
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
    instrumentId === TRACK_DEFAULT_INSTRUMENT_ID
        ? TRACK_DEFAULT_INSTRUMENT_NAME
        : soundData.instruments[instrumentId].name.length
            ? soundData.instruments[instrumentId].name
            : `(${instrumentId.slice(0, 4)})`;

export const getNoteSlideLabel = (note: string, slide: number): string => {
    if (!slide) {
        return '–';
    }
    const directionLabel = slide < 0 ? '↘' : '↗';
    const noteId = NOTES_LABELS.indexOf(note);
    const targetNoteLabel = NOTES_LABELS[noteId - slide];
    return `${directionLabel}${targetNoteLabel}`;
};

export const getFoundPatternSequenceIndex = (soundData: SoundData, trackId: number, step: number) => {
    let result = -1;
    Object.keys(soundData.tracks[trackId].sequence).forEach(si => {
        const siInt = parseInt(si);
        const patternId = soundData.tracks[trackId].sequence[siInt];
        const pattern = soundData.patterns[patternId];
        if (result === -1 && pattern && step >= siInt && step < siInt + pattern.size) {
            result = siInt;
        }
    });

    return result;
};

export const getToolModeCursor = (tool: SoundEditorTool, isDragging?: boolean) => {
    if (isDragging) {
        return 'grabbing';
    }

    switch (tool) {
        default:
        case SoundEditorTool.EDIT:
            return 'crosshair';
        case SoundEditorTool.ERASER:
            return 'not-allowed';
        case SoundEditorTool.DRAG:
            return 'grab';
        case SoundEditorTool.MARQUEE:
            return 'initial';
    }
};

export const getSnappedStep = (step: number, noteSnapping: boolean, stepsPerBar: number) => noteSnapping
    ? Math.floor(step / stepsPerBar) * stepsPerBar
    : step;

export const getVolumeEventValueFromStereoLevels = (volume: VsuChannelStereoLevelsData) => volume
    ? ((volume.left ?? 0) << 4) + (volume.right ?? 0)
    : 0;

export const getStereoLevelsFromVolumeEventValue = (volume: number) => {
    const left = volume >> 4;
    const right = volume - (left << 4);

    return { left, right };
};

interface SoundEditorProps {
    soundData: SoundData
    updateSoundData: (soundData: SoundData) => void
}

export default function SoundEditor(props: SoundEditorProps): React.JSX.Element {
    const { soundData, updateSoundData } = props;
    const { fileUri, services, setCommands, onCommandExecute, enableCommands, focusEditor } = useContext(EditorsContext) as EditorsContextType;
    const [emulatorInitialized, setEmulatorInitialized] = useState<boolean>(false);
    const [emulatorRomReady, setEmulatorRomReady] = useState<boolean>(false);
    const [playing, setPlaying] = useState<boolean>(false);
    const [testNote, setTestNote] = useState<string>('');
    const [testInstrumentId, setTestInstrumentId] = useState<string>('');
    const [trackSettings, setTrackSettings] = useState<TrackSettings[]>([...soundData.tracks.map(t => (DEFAULT_TRACK_SETTINGS))]);
    const [playRangeStart, setPlayRangeStart] = useState<number>(-1);
    const [playRangeEnd, setPlayRangeEnd] = useState<number>(-1);
    const [currentPlayerPosition, setCurrentPlayerPosition] = useState<number>(-1);
    const [newNoteDuration, setNewNoteDuration] = useState<number>(NOTE_RESOLUTION / parseInt(soundData.timeSignature[0].split('/')[1] ?? 4));
    const [tool, setTool] = useState<SoundEditorTool>(SoundEditorTool.EDIT);
    const [marqueeMode, setMarqueeMode] = useState<SoundEditorMarqueeMode>(SoundEditorMarqueeMode.REPLACE);
    const [currentInstrumentId, setCurrentInstrumentId] = useState<string>(TRACK_DEFAULT_INSTRUMENT_ID);
    const [currentTrackId, setCurrentTrackId] = useState<number>(0);
    const [currentPatternId, setCurrentPatternId] = useState<string>(soundData.tracks[0]
        ? Object.values(soundData.tracks[0].sequence)[0] ?? '' : '');
    const [currentSequenceIndex, setCurrentSequenceIndex] = useState<number>(soundData.tracks[0]
        ? parseInt(Object.keys(soundData.tracks[0].sequence)[0]) ?? -1 : -1);
    const [noteCursor, setNoteCursor] = useState<number>(0);
    const [selectedPatterns, setSelectedPatterns] = useState<string[]>(soundData.tracks[0] && Object.keys(soundData.tracks[0].sequence).length
        ? [`0-${Object.keys(soundData.tracks[0].sequence)[0]}`]
        : []);
    const [selectedNotes, setSelectedNotes] = useState<number[]>([]);
    const [pianoRollScrollWindow, setPianoRollScrollWindow] = useState<ScrollWindow>({ x: 0, y: 0, w: 0, h: 0 });
    const [pianoRollNoteHeight, setPianoRollNoteHeight] = useState<number>(PIANO_ROLL_NOTE_HEIGHT_DEFAULT);
    const [pianoRollNoteWidth, setPianoRollNoteWidth] = useState<number>(PIANO_ROLL_NOTE_WIDTH_DEFAULT);
    const [sequencerPatternHeight, setSequencerPatternHeight] = useState<number>(SEQUENCER_PATTERN_HEIGHT_DEFAULT);
    const [sequencerNoteWidth, setSequencerNoteWidth] = useState<number>(SEQUENCER_PATTERN_WIDTH_DEFAULT);
    const [sequencerHidden, setSequencerHidden] = useState<boolean>(false);
    const [effectsPanelHidden, setEffectsPanelHidden] = useState<boolean>(true);
    const [eventListHidden, setEventListHidden] = useState<boolean>(true);
    const [noteSnapping, setNoteSnapping] = useState<boolean>(true);
    const [addPatternDialogOpen, setAddPatternDialogOpen] = useState<{ trackId: number, sequenceIndex: number, size?: number }>({ trackId: -1, sequenceIndex: -1 });
    const [addTrackDialogOpen, setAddTrackDialogOpen] = useState<boolean>(false);
    const [instrumentDialogOpen, setInstrumentDialogOpen] = useState<boolean>(false);
    const [utilitiesDialogOpen, setUtilitiesDialogOpen] = useState<boolean>(false);
    const [keyBindingsDialogOpen, setKeyBindingsDialogOpen] = useState<boolean>(false);
    const [propertiesDialogOpen, setPropertiesDialogOpen] = useState<boolean>(false);
    const [editTrackDialogOpen, setEditTrackDialogOpen] = useState<boolean>(false);
    const [patternDialogOpen, setPatternDialogOpen] = useState<boolean>(false);
    const [waveformDialogOpen, setWaveformDialogOpen] = useState<string>('');
    const [modulationDataDialogOpen, setModulationDataDialogOpen] = useState<string>('');
    const [instrumentColorDialogOpen, setInstrumentColorDialogOpen] = useState<string>('');
    const [noteDialogOpen, setNoteDialogOpen] = useState<boolean>(false);
    const [playerRomBuilder] = useState<PlayerRomBuilder>(new PlayerRomBuilder(services));
    const [forcePlayerRomRebuild, setForcePlayerRomRebuild] = useState<number>(0);
    const [rangeDragStartStep, setRangeDragStartStep] = useState<number>(-1);
    const [rangeDragEndStep, setRangeDragEndStep] = useState<number>(-1);

    const beats = parseInt(soundData.timeSignature[0].split('/')[0] ?? 4);
    const bar = parseInt(soundData.timeSignature[0].split('/')[1] ?? 4);
    const stepsPerNote = NOTE_RESOLUTION / bar;
    const stepsPerBar = beats * stepsPerNote;

    const updateSelectedNotes = (sn: number[]) => {
        if (!sn) {
            return;
        }

        const updatedSelectedNotes = sn
            .filter((item, pos, self) => self.indexOf(item) === pos) // remove double
            .sort();

        setSelectedNotes(updatedSelectedNotes);

        if (updatedSelectedNotes.length) {
            setSelectedPatterns([]);
        }
    };

    const updateSelectedPatterns = (sp: string[]) => {
        if (!sp) {
            return;
        }

        const updatedSelectedPatterns = sp
            .filter((item, pos, self) => self.indexOf(item) === pos) // remove double
            .sort();

        setSelectedPatterns(updatedSelectedPatterns);

        if (updatedSelectedPatterns.length) {
            setSelectedNotes([]);
        }
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

        setEditTrackDialogOpen(false);
        enableCommands();
        focusEditor();
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

    const setPatternSizes = (patterns: { [patternId: string]: number }): void => {
        const updatedPatterns = {
            ...soundData.patterns,
        };

        Object.keys(patterns).forEach(pId => {
            const size = patterns[pId];
            const pattern = soundData.patterns[pId];
            if (!pattern) {
                return;
            }
            // removed all events that are beyond the limits of the pattern
            // this would come into play when resizing down
            const updatedEvents: EventsMap = {};
            const patternSteps = size * SUB_NOTE_RESOLUTION;
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

            updatedPatterns[pId] = {
                ...updatedPatterns[pId],
                events: updatedEvents,
                size: size,
            };
        });

        updateSoundData({
            ...soundData,
            patterns: updatedPatterns,
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
        updateSelectedNotes([]);
        setNoteCursor(newSequenceIndex * SUB_NOTE_RESOLUTION);
        setCurrentInstrumentId(TRACK_DEFAULT_INSTRUMENT_ID);
    };

    const updateCurrentPatternId = (trackId: number, patternId: string): void => {
        setCurrentPatternId(patternId);
        if (trackId !== currentTrackId) {
            setCurrentTrackId(trackId);
            setCurrentInstrumentId(TRACK_DEFAULT_INSTRUMENT_ID);
        }

        updateSelectedNotes([]);
    };

    const updateCurrentSequenceIndex = (trackId: number, sequenceIndex: number): void => {
        if (trackId !== currentTrackId) {
            setCurrentTrackId(trackId);
            setCurrentInstrumentId(TRACK_DEFAULT_INSTRUMENT_ID);
        }
        if (sequenceIndex < 0) {
            sequenceIndex = 0;
        }

        const track = soundData.tracks[trackId];
        const sequence = track?.sequence ?? {};
        setCurrentPatternId(sequence[sequenceIndex] ?? '');

        setCurrentSequenceIndex(sequenceIndex);
        updateSelectedNotes([]);
        setNoteCursor(sequenceIndex * SUB_NOTE_RESOLUTION);
    };

    const updateNoteCursor = (step: number): void => {
        setNoteCursor(step);

        // Select note at note cursor step, if there is one
        const updatedSelectedNotes: number[] = [];
        const currentPatternStartStep = currentSequenceIndex * SUB_NOTE_RESOLUTION;
        const patternRelativeStep = step - currentPatternStartStep;
        const currentPattern = soundData.patterns[currentPatternId];
        const currentPatternEvents = currentPattern?.events;
        if (currentPatternEvents[patternRelativeStep] && currentPatternEvents[patternRelativeStep][SoundEvent.Note]) {
            updatedSelectedNotes.push(patternRelativeStep);
        }
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

        updateSelectedNotes(currentPatternNoteSteps);
    };

    const addTrack = (): void => {
        if (soundData.tracks.length < 6) {
            setAddTrackDialogOpen(true);
        }
    };

    const removePatternsFromSequence = (patterns: string[]): void => {
        if (!patterns.length) {
            return;
        }

        const updatedTracks = deepClone(soundData.tracks);
        patterns.forEach(identifier => {
            const trackId = parseInt(identifier.split('-')[0]);
            const sequenceIndex = parseInt(identifier.split('-')[1]);

            if (updatedTracks[trackId] && updatedTracks[trackId].sequence[sequenceIndex]) {
                // filter out at sequenceIndex
                updatedTracks[trackId].sequence = Object.fromEntries(
                    Object.entries(updatedTracks[trackId].sequence)
                        .filter(([si, v]) => parseInt(si) !== sequenceIndex)
                );

                // Select previous, next or no pattern if deleted currently selected pattern
                if (currentTrackId === trackId && currentSequenceIndex === sequenceIndex) {
                    const sequenceSteps = Object.keys(updatedTracks[trackId].sequence);
                    const stepSequenceIndex = sequenceSteps.indexOf(sequenceIndex.toString());
                    if (stepSequenceIndex > 0) {
                        const prevSequenceIndex = parseInt(sequenceSteps[stepSequenceIndex - 1]);
                        setCurrentPatternId(updatedTracks[trackId].sequence[prevSequenceIndex]);
                        setCurrentSequenceIndex(prevSequenceIndex);
                        if (selectedPatterns.length <= 1) {
                            updateSelectedPatterns([`${trackId}-${prevSequenceIndex}`]);
                        }
                    } else if (sequenceSteps[stepSequenceIndex + 1] !== undefined) {
                        const nextSequenceIndex = parseInt(sequenceSteps[stepSequenceIndex + 1]);
                        setCurrentPatternId(updatedTracks[trackId].sequence[nextSequenceIndex]);
                        setCurrentSequenceIndex(nextSequenceIndex);
                        if (selectedPatterns.length <= 1) {
                            updateSelectedPatterns([`${trackId}-${nextSequenceIndex}`]);
                        }
                    } else {
                        setCurrentPatternId('');
                        setCurrentSequenceIndex(-1);
                    }
                }
            }
        });

        updateSoundData({
            ...soundData,
            tracks: updatedTracks,
        });
    };

    const setInstrumentColor = (instrumentId: string, color: number) => {
        const updatedInstruments = { ...soundData.instruments };
        updatedInstruments[instrumentId] = {
            ...updatedInstruments[instrumentId],
            color,
        };

        setInstruments(updatedInstruments);
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

        let updatedEvents: EventsMap = deepClone(currentPattern.events);
        updatedEvents = sortObjectByKeys(updatedEvents);

        const removeNoteFromEvents = (stepToRemove: number) => {
            if (updatedEvents[stepToRemove] === undefined) {
                return;
            }

            // remove all note-related events
            updatedEvents[stepToRemove] = Object.fromEntries(
                Object.entries({ ...updatedEvents[stepToRemove] })
                    .filter(([e, v]) => ![
                        SoundEvent.Note,
                        SoundEvent.Instrument,
                        SoundEvent.Duration,
                        SoundEvent.NoteSlide,
                    ].includes(e as SoundEvent))
            );

            // if no events remain, remove entirely
            if (Object.keys(updatedEvents[stepToRemove]).length === 0) {
                updatedEvents = Object.fromEntries(
                    Object.entries({ ...updatedEvents })
                        .filter(([s, e]) => parseInt(s) !== stepToRemove)
                );
            }
        };

        // remove empty notes
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
                    updatedEvents[stepInt] = Object.fromEntries(
                        Object.entries({ ...updatedEvents[stepInt] })
                            .filter(([e, v]) => e !== SoundEvent.Instrument)
                    );
                }

                // remove events with empty value
                updatedEvents[stepInt] = Object.fromEntries(
                    Object.entries({ ...updatedEvents[stepInt] })
                        .filter(([e, v]) => v !== '' && v !== undefined)
                );

                // remove dependent events
                if (!updatedEvents[stepInt][SoundEvent.Note]) {
                    updatedEvents[stepInt] = Object.fromEntries(
                        Object.entries({ ...updatedEvents[stepInt] })
                            .filter(([e, v]) => ![
                                SoundEvent.Duration,
                                SoundEvent.Instrument,
                                SoundEvent.NoteSlide,
                            ].includes(e as SoundEvent))
                    );
                }

                if (Object.keys(updatedEvents[stepInt]).length === 0) {
                    // if no events remain, remove entirely
                    updatedEvents = Object.fromEntries(
                        Object.entries({ ...updatedEvents })
                            .filter(([s, e]) => parseInt(s) !== stepInt)
                    );

                } else {
                    // ...otherwise ensure clean key order
                    updatedEvents[stepInt] = sortObjectByKeys(updatedEvents[stepInt]);
                }
            }
        });

        // cap all note durations
        let prevStep = -1;
        [
            ...Object.keys(updatedEvents),
            (currentPattern.size * SUB_NOTE_RESOLUTION).toString(), // pattern size is last note's limit
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

        // cap all note slide amounts
        Object.keys(updatedEvents).map(step => {
            const stepInt = parseInt(step);
            const stepEvents = updatedEvents[stepInt];
            if (stepEvents[SoundEvent.NoteSlide] !== undefined && stepEvents[SoundEvent.Note] !== undefined) {
                const noteId = NOTES_LABELS.indexOf(stepEvents[SoundEvent.Note]);
                const noteSlide = stepEvents[SoundEvent.NoteSlide];
                if (noteId - noteSlide >= NOTES_LABELS.length) {
                    stepEvents[SoundEvent.NoteSlide] = noteId - NOTES_LABELS.length + 1;
                } else if (noteId - noteSlide <= 0) {
                    stepEvents[SoundEvent.NoteSlide] = noteId;
                }
            }

            return stepEvents;
        });

        setPattern(currentPatternId, {
            events: updatedEvents,
        });
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
        setEditTrackDialogOpen(false);
        setCurrentInstrumentId(instrument);
        setInstrumentDialogOpen(true);
    };

    const addPattern = (trackId: number, step: number, size?: number): void => {
        setAddPatternDialogOpen({ trackId, sequenceIndex: step, size });
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
            updateCurrentSequenceIndex(0, 0);

            setUtilitiesDialogOpen(false);
            enableCommands();
            focusEditor();
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
            case SoundEditorCommands.TOOL_EDIT.id:
                if (soundData.tracks.length > 0) {
                    setTool(SoundEditorTool.EDIT);
                }
                break;
            case SoundEditorCommands.TOOL_ERASER.id:
                if (soundData.tracks.length > 0) {
                    setTool(SoundEditorTool.ERASER);
                }
                break;
            case SoundEditorCommands.TOOL_MARQUEE.id:
                if (soundData.tracks.length > 0) {
                    setTool(SoundEditorTool.MARQUEE);
                }
                break;
            case SoundEditorCommands.TOOL_DRAG.id:
                if (soundData.tracks.length > 0) {
                    setTool(SoundEditorTool.DRAG);
                }
                break;
            case SoundEditorCommands.TOOL_MARQUEE_MODE_REPLACE.id:
                if (soundData.tracks.length > 0) {
                    setMarqueeMode(SoundEditorMarqueeMode.REPLACE);
                }
                break;
            case SoundEditorCommands.TOOL_MARQUEE_MODE_ADD.id:
                if (soundData.tracks.length > 0) {
                    setMarqueeMode(SoundEditorMarqueeMode.ADD);
                }
                break;
            case SoundEditorCommands.TOOL_MARQUEE_MODE_SUBTRACT.id:
                if (soundData.tracks.length > 0) {
                    setMarqueeMode(SoundEditorMarqueeMode.SUBTRACT);
                }
                break;
            case SoundEditorCommands.ADD_PATTERN.id:
                if (soundData.tracks.length > 0) {
                    const noteCursorStep = Math.floor(noteCursor / SUB_NOTE_RESOLUTION);
                    addPattern(currentTrackId, noteCursorStep);
                }
                break;
            case SoundEditorCommands.TOGGLE_NOTE_SNAPPING.id:
                if (soundData.tracks.length > 0) {
                    setNoteSnapping(prev => !prev);
                }
                break;
            case SoundEditorCommands.TOGGLE_SEQUENCER_VISIBILITY.id:
                if (soundData.tracks.length > 0) {
                    setSequencerHidden(prev => !prev);
                }
                break;
            case SoundEditorCommands.TOGGLE_EVENT_LIST_VISIBILITY.id:
                if (soundData.tracks.length > 0) {
                    setEventListHidden(prev => !prev);
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
                    if (marqueeMode === SoundEditorMarqueeMode.SUBTRACT) {
                        updateSelectedNotes([]);
                    } else {
                        selectAllNotesInCurrentPattern();
                    }
                }
                break;
            case SoundEditorCommands.SET_NOTE_LENGTH_1.id:
                if (soundData.tracks.length > 0) {
                    setNewNoteDuration(16);
                }
                break;
            case SoundEditorCommands.SET_NOTE_LENGTH_2.id:
                if (soundData.tracks.length > 0) {
                    setNewNoteDuration(8);
                }
                break;
            case SoundEditorCommands.SET_NOTE_LENGTH_4.id:
                if (soundData.tracks.length > 0) {
                    setNewNoteDuration(4);
                }
                break;
            case SoundEditorCommands.SET_NOTE_LENGTH_8.id:
                if (soundData.tracks.length > 0) {
                    setNewNoteDuration(2);
                }
                break;
            case SoundEditorCommands.SET_NOTE_LENGTH_16.id:
                if (soundData.tracks.length > 0) {
                    setNewNoteDuration(1);
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
        marqueeMode,
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
                    playing={playing}
                    emulatorInitialized={emulatorInitialized}
                    setEmulatorInitialized={setEmulatorInitialized}
                    emulatorRomReady={emulatorRomReady}
                    setEmulatorRomReady={setEmulatorRomReady}
                    noteSnapping={noteSnapping}
                    tool={tool}
                    marqueeMode={marqueeMode}
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
                    utilitiesDialogOpen={utilitiesDialogOpen}
                    setUtilitiesDialogOpen={setUtilitiesDialogOpen}
                    propertiesDialogOpen={propertiesDialogOpen}
                    setPropertiesDialogOpen={setPropertiesDialogOpen}
                    keyBindingsDialogOpen={keyBindingsDialogOpen}
                    setKeyBindingsDialogOpen={setKeyBindingsDialogOpen}
                    selectedNotes={selectedNotes}
                    setNotes={setNotes}
                    setTrack={setTrack}
                    forcePlayerRomRebuild={forcePlayerRomRebuild}
                    stepsPerNote={stepsPerNote}
                    stepsPerBar={stepsPerBar}
                    setPlaying={setPlaying}
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
                                tool={tool}
                                marqueeMode={marqueeMode}
                                updateSoundData={updateSoundData}
                                currentPlayerPosition={currentPlayerPosition}
                                setCurrentPlayerPosition={setCurrentPlayerPosition}
                                currentPatternId={currentPatternId}
                                setCurrentPatternId={updateCurrentPatternId}
                                currentTrackId={currentTrackId}
                                setCurrentTrackId={updateCurrentTrackId}
                                currentSequenceIndex={currentSequenceIndex}
                                setCurrentSequenceIndex={updateCurrentSequenceIndex}
                                selectedPatterns={selectedPatterns}
                                setSelectedPatterns={updateSelectedPatterns}
                                toggleTrackMuted={toggleTrackMuted}
                                toggleTrackSolo={toggleTrackSolo}
                                toggleTrackSeeThrough={toggleTrackSeeThrough}
                                removeTrack={removeTrack}
                                addPattern={addPattern}
                                setEditTrackDialogOpen={setEditTrackDialogOpen}
                                setPatternDialogOpen={setPatternDialogOpen}
                                noteSnapping={noteSnapping}
                                effectsPanelHidden={effectsPanelHidden}
                                pianoRollNoteHeight={pianoRollNoteHeight}
                                pianoRollNoteWidth={pianoRollNoteWidth}
                                sequencerPatternHeight={sequencerPatternHeight}
                                setSequencerPatternHeight={setSequencerPatternHeight}
                                sequencerNoteWidth={sequencerNoteWidth}
                                setSequencerNoteWidth={setSequencerNoteWidth}
                                pianoRollScrollWindow={pianoRollScrollWindow}
                                setPatternSizes={setPatternSizes}
                                removePatternsFromSequence={removePatternsFromSequence}
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
                                noteCursor={noteCursor}
                                stepsPerNote={stepsPerNote}
                                stepsPerBar={stepsPerBar}
                            />
                        }
                        <StyledLowerContainer>
                            {!eventListHidden &&
                                <EventList
                                    soundData={soundData}
                                    currentTrackId={currentTrackId}
                                    currentSequenceIndex={currentSequenceIndex}
                                    noteSnapping={noteSnapping}
                                    pattern={soundData.patterns[currentPatternId]}
                                    noteCursor={noteCursor}
                                    setNotes={setNotes}
                                    setNoteCursor={updateNoteCursor}
                                />
                            }
                            <PianoRoll
                                soundData={soundData}
                                tool={tool}
                                marqueeMode={marqueeMode}
                                currentPlayerPosition={currentPlayerPosition}
                                setCurrentPlayerPosition={setCurrentPlayerPosition}
                                setForcePlayerRomRebuild={setForcePlayerRomRebuild}
                                noteCursor={noteCursor}
                                setNoteCursor={updateNoteCursor}
                                currentPatternId={currentPatternId}
                                currentTrackId={currentTrackId}
                                currentSequenceIndex={currentSequenceIndex}
                                setCurrentSequenceIndex={updateCurrentSequenceIndex}
                                currentInstrumentId={currentInstrumentId}
                                setCurrentInstrumentId={setCurrentInstrumentId}
                                playRangeStart={playRangeStart}
                                setPlayRangeStart={setPlayRangeStart}
                                playRangeEnd={playRangeEnd}
                                setPlayRangeEnd={setPlayRangeEnd}
                                playNote={playNote}
                                playing={playing}
                                testNote={testNote}
                                setNotes={setNotes}
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
                                sequencerNoteWidth={sequencerNoteWidth}
                                setPianoRollScrollWindow={setPianoRollScrollWindow}
                                pianoRollScrollWindow={pianoRollScrollWindow}
                                setPatternDialogOpen={setPatternDialogOpen}
                                setNoteDialogOpen={setNoteDialogOpen}
                                trackSettings={trackSettings}
                                rangeDragStartStep={rangeDragStartStep}
                                setRangeDragStartStep={setRangeDragStartStep}
                                rangeDragEndStep={rangeDragEndStep}
                                setRangeDragEndStep={setRangeDragEndStep}
                                stepsPerNote={stepsPerNote}
                                stepsPerBar={stepsPerBar}
                            />
                        </StyledLowerContainer>
                    </>}
            </VContainer>
            {addTrackDialogOpen &&
                <PopUpDialog
                    open={addTrackDialogOpen}
                    onClose={() => {
                        setAddTrackDialogOpen(false);
                        enableCommands();
                        focusEditor();
                    }}
                    onOk={() => {
                        setAddTrackDialogOpen(false);
                        enableCommands();
                        focusEditor();
                    }}
                    title={nls.localize('vuengine/editors/sound/addTrack', 'Add Track')}
                    height='300px'
                    width='438px'
                    cancelButton={true}
                    okButton={false}
                >
                    <AddTrack
                        soundData={soundData}
                        updateSoundData={updateSoundData}
                        trackSettings={trackSettings}
                        setTrackSettings={setTrackSettings}
                        isTrackAvailable={isTrackAvailable}
                        setAddTrackDialogOpen={setAddTrackDialogOpen}
                        setEditTrackDialogOpen={setEditTrackDialogOpen}
                    />
                </PopUpDialog>
            }
            {addPatternDialogOpen.trackId > -1 &&
                <PopUpDialog
                    open={addPatternDialogOpen.trackId > -1}
                    onClose={() => {
                        setAddPatternDialogOpen({ trackId: -1, sequenceIndex: -1 });
                        enableCommands();
                        focusEditor();
                    }}
                    onOk={() => {
                        setAddPatternDialogOpen({ trackId: -1, sequenceIndex: -1 });
                        enableCommands();
                        focusEditor();
                    }}
                    title={nls.localize('vuengine/editors/sound/addPattern', 'Add Pattern')}
                    height='100%'
                    width='100%'
                    cancelButton={true}
                    okButton={false}
                >
                    <AddPattern
                        soundData={soundData}
                        updateSoundData={updateSoundData}
                        sequenceIndex={addPatternDialogOpen.sequenceIndex}
                        trackId={addPatternDialogOpen.trackId}
                        size={addPatternDialogOpen.size !== undefined && addPatternDialogOpen.size > -1 ? addPatternDialogOpen.size : undefined}
                        sequencerPatternHeight={sequencerPatternHeight}
                        sequencerNoteWidth={sequencerNoteWidth}
                        setCurrentPatternId={updateCurrentPatternId}
                        setCurrentSequenceIndex={updateCurrentSequenceIndex}
                        setTrack={setTrack}
                        selectedPatterns={selectedPatterns}
                        setSelectedPatterns={updateSelectedPatterns}
                        setAddPatternDialogOpen={setAddPatternDialogOpen}
                        stepsPerBar={stepsPerBar}
                    />
                </PopUpDialog>
            }
            {instrumentDialogOpen &&
                <PopUpDialog
                    open={instrumentDialogOpen}
                    onClose={() => {
                        setInstrumentDialogOpen(false);
                        enableCommands();
                        focusEditor();
                    }}
                    onOk={() => {
                        setInstrumentDialogOpen(false);
                        enableCommands();
                        focusEditor();
                    }}
                    title={nls.localize('vuengine/editors/sound/editInstrument', 'Edit Instrument')}
                    height='100%'
                    width='100%'
                    maxWidth='1251px'
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
                        focusEditor();
                    }}
                    onOk={() => {
                        setPropertiesDialogOpen(false);
                        enableCommands();
                        focusEditor();
                    }}
                    title={nls.localize('vuengine/editors/sound/properties', 'Properties')}
                    height='540px'
                    width='460px'
                >
                    <VContainer gap={15}>
                        <Properties
                            soundData={soundData}
                            beats={beats}
                            bar={bar}
                            updateSoundData={updateSoundData}
                            setNewNoteDuration={setNewNoteDuration}
                        />
                    </VContainer>
                </PopUpDialog>
            }
            {keyBindingsDialogOpen &&
                <PopUpDialog
                    open={keyBindingsDialogOpen}
                    onClose={() => {
                        setKeyBindingsDialogOpen(false);
                        enableCommands();
                        focusEditor();
                    }}
                    onOk={() => {
                        setKeyBindingsDialogOpen(false);
                        enableCommands();
                        focusEditor();
                    }}
                    title={nls.localizeByDefault('Keybindings')}
                    height='100%'
                    width='100%'
                >
                    <Keybindings />
                </PopUpDialog>
            }
            {utilitiesDialogOpen &&
                <PopUpDialog
                    open={utilitiesDialogOpen}
                    onClose={() => {
                        setUtilitiesDialogOpen(false);
                        enableCommands();
                        focusEditor();
                    }}
                    onOk={() => {
                        setUtilitiesDialogOpen(false);
                        enableCommands();
                        focusEditor();
                    }}
                    title={nls.localize('vuengine/editors/sound/utilities', 'Utilities')}
                    height='260px'
                    width='460px'
                    overflow='visible'
                >
                    <Utilities
                        soundData={soundData}
                        updateSoundData={updateSoundData}
                        setUtilitiesDialogOpen={setUtilitiesDialogOpen}
                    />
                </PopUpDialog>
            }
            {editTrackDialogOpen &&
                <PopUpDialog
                    open={editTrackDialogOpen}
                    onClose={() => {
                        setEditTrackDialogOpen(false);
                        enableCommands();
                        focusEditor();
                    }}
                    onOk={() => {
                        setEditTrackDialogOpen(false);
                        enableCommands();
                        focusEditor();
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
                        focusEditor();
                    }}
                    onOk={() => {
                        setPatternDialogOpen(false);
                        enableCommands();
                        focusEditor();
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
                        setPatternSizes={setPatternSizes}
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
                        focusEditor();
                    }}
                    onOk={() => {
                        setWaveformDialogOpen('');
                        enableCommands();
                        focusEditor();
                    }}
                    title={nls.localize('vuengine/editors/sound/editWaveform', 'Edit Waveform')
                    }
                    height='100%'
                    width='100%'
                    maxWidth='1600px'
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
                        focusEditor();
                    }}
                    onOk={() => {
                        setModulationDataDialogOpen('');
                        enableCommands();
                        focusEditor();
                    }}
                    title={nls.localize('vuengine/editors/sound/editModulationData', 'Edit Modulation Data')}
                    height='100%'
                    width='100%'
                    maxWidth='1600px'
                >
                    {soundData.instruments[modulationDataDialogOpen] &&
                        <ModulationDataWithPresets
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
                        focusEditor();
                    }}
                    onOk={() => {
                        setInstrumentColorDialogOpen('');
                        enableCommands();
                        focusEditor();
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
            {noteDialogOpen &&
                <PopUpDialog
                    open={noteDialogOpen}
                    onClose={() => {
                        setNoteDialogOpen(false);
                        enableCommands();
                        focusEditor();
                    }}
                    onOk={() => {
                        setNoteDialogOpen(false);
                        enableCommands();
                        focusEditor();
                    }}
                    title={nls.localize('vuengine/editors/sound/editNote', 'Edit Note')}
                    height='340px'
                    width='513px'
                >
                    <NoteProperties
                        soundData={soundData}
                        currentTrackId={currentTrackId}
                        noteSnapping={noteSnapping}
                        noteCursor={noteCursor}
                        setNoteCursor={updateNoteCursor}
                        currentSequenceIndex={currentSequenceIndex}
                        pattern={soundData.patterns[currentPatternId]}
                        emulatorInitialized={emulatorInitialized}
                        playingTestNote={playing && !!testNote}
                        playNote={playNote}
                        setNotes={setNotes}
                        newNoteDuration={newNoteDuration}
                        stepsPerBar={stepsPerBar}
                        setNoteDialogOpen={setNoteDialogOpen}
                    />
                </PopUpDialog>
            }
        </HContainer >
    );
}
