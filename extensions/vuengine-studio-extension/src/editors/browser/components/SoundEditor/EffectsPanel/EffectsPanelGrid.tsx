import chroma from 'chroma-js';
import React, { MouseEvent, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import { COLOR_PALETTE, DEFAULT_COLOR_INDEX } from '../../Common/PaletteColorSelect';
import { clamp, scaleCanvasAccountForDpi } from '../../Common/Utils';
import { VSU_INTERVAL_VALUES } from '../Emulator/VsuTypes';
import {
    getEffectiveVolumeAndPanning,
    getEnvelopeValueAt,
    getMasterVolume,
    getOutputVolume,
    getPanningLabel,
    getRegisterLevels,
    RegisterLevels,
    snapPanning,
    snapVolume
} from '../Other/volume';
import { getTimeSignatureSegments, TIME_SIGNATURE_DEFAULT } from '../Other/timeSignature';
import { getToolModeCursor } from '../SoundEditor';
import {
    EventsMap,
    GLOBAL_SOUND_EVENTS,
    INSTRUMENT_PANNING_DEFAULT,
    INSTRUMENT_PANNING_MAX,
    INSTRUMENT_PANNING_MIN,
    INSTRUMENT_VOLUME_MAX,
    INSTRUMENT_VOLUME_MIN,
    MASTER_VOLUME_DEFAULT,
    MASTER_VOLUME_EVENT_MAX,
    MASTER_VOLUME_EVENT_MIN,
    ScrollWindow,
    SoundData,
    SoundEditorTool,
    SoundEvent,
    SoundEventMap,
    SUB_NOTE_RESOLUTION
} from '../SoundEditorTypes';
import { drawGrid, drawSongEnd, getTrackEvents, getTrackLaneEvents, LaneEvent } from './EffectsPanelGridOverview';

export interface EffectLane {
    min: number
    max: number
    // value the bars grow from
    baseline: number
    format: (value: number) => string
    // for the value range at the left, if it differs from the values' format
    formatScale?: (value: number) => string
    // rounds a value to the lane's resolution
    snap: (value: number) => number
    // shows the minimum at the top instead of the bottom
    inverted?: boolean
    // lanes for values without a scale, e.g. time signatures, show their events as labelled bars and edit them in a dialog
    editInDialog?: boolean
    // the value of a global lane before its first event
    getDefaultValue?: (soundData: SoundData) => number | string
}

export const EFFECT_LANES: Record<string, EffectLane> = {
    [SoundEvent.Volume]: {
        min: INSTRUMENT_VOLUME_MIN,
        max: INSTRUMENT_VOLUME_MAX,
        baseline: INSTRUMENT_VOLUME_MIN,
        format: v => `${v}%`,
        snap: snapVolume,
    },
    [SoundEvent.Panning]: {
        min: INSTRUMENT_PANNING_MIN,
        max: INSTRUMENT_PANNING_MAX,
        baseline: INSTRUMENT_PANNING_DEFAULT,
        format: getPanningLabel,
        formatScale: v => `${getPanningLabel(v)}%`,
        snap: snapPanning,
        inverted: true,
    },
    [SoundEvent.MasterVolume]: {
        min: MASTER_VOLUME_EVENT_MIN,
        max: MASTER_VOLUME_EVENT_MAX,
        baseline: MASTER_VOLUME_EVENT_MIN,
        format: v => `${v}%`,
        snap: Math.round,
        getDefaultValue: () => MASTER_VOLUME_EVENT_MAX,
    },
    [SoundEvent.TimeSignature]: {
        // there is no scale, see editInDialog
        min: 0,
        max: 1,
        baseline: 0,
        format: v => `${v}`,
        snap: Math.round,
        editInDialog: true,
        getDefaultValue: soundData => soundData.timeSignature?.[0] ?? TIME_SIGNATURE_DEFAULT,
    },
};

// sets a global event or, without a value, removes it, dropping steps without events
export const withGlobalEvent = (events: EventsMap, step: number, eventType: SoundEvent, value: number | string | undefined): EventsMap => {
    const { [eventType]: removedEvent, ...remainingStepEvents } = events[step] ?? {};
    const stepEvents = value === undefined
        ? remainingStepEvents
        : { ...remainingStepEvents, [eventType]: value };
    const { [step]: removedStep, ...remainingEvents } = events;

    return Object.keys(stepEvents).length > 0
        ? { ...remainingEvents, [step]: stepEvents }
        : remainingEvents;
};

// all distinct values a lane allows, ascending
export const getEffectLaneValues = (lane: EffectLane): number[] => {
    const values = new Set<number>();
    for (let v = lane.min; v <= lane.max; v++) {
        values.add(lane.snap(v));
    }

    return [...values].sort((a, b) => a - b);
};

export interface LaneValue {
    step: number
    value: number
}

interface SetLaneValue extends LaneValue {
    // whether an effect sets the value, rather than e.g. an instrument change
    explicit: boolean
}

// the values set by instruments and effects,
// without side effects like envelopes or the master volume
export const getTrackSetValues = (
    soundData: SoundData,
    trackId: number,
    currentSequenceIndex: number,
    eventType: SoundEvent,
    laneEvents: LaneEvent[],
    globalDefaultValue: number = MASTER_VOLUME_EVENT_MAX
): SetLaneValue[] => {
    const track = soundData.tracks[trackId];
    const isGlobal = GLOBAL_SOUND_EVENTS.includes(eventType);
    const changes: Record<number, SoundEventMap> = { 0: {} };
    if (!isGlobal) {
        getTrackEvents(soundData, trackId, currentSequenceIndex).forEach(e => {
            if (e.events[SoundEvent.Note] !== undefined) {
                changes[e.step] = { ...changes[e.step], [SoundEvent.Instrument]: e.events[SoundEvent.Instrument] ?? track?.instrument };
            }
        });
    }
    laneEvents.forEach(e => {
        changes[e.step] = { ...changes[e.step], [eventType]: e.value };
    });

    const result: SetLaneValue[] = [];
    let instrument = soundData.instruments[track?.instrument];
    let eventValue: number | undefined;
    Object.keys(changes).map(s => parseInt(s)).sort((a, b) => a - b).forEach(step => {
        const change = changes[step];
        // a different instrument brings its own values, which effects replace until the next instrument change
        const changedInstrument = soundData.instruments[change[SoundEvent.Instrument]];
        if (changedInstrument && changedInstrument !== instrument && !isGlobal) {
            instrument = changedInstrument;
            eventValue = undefined;
        }
        eventValue = change[eventType] ?? eventValue;

        const value = isGlobal
            ? eventValue ?? globalDefaultValue
            : eventValue ?? (eventType === SoundEvent.Panning ? instrument?.panning : instrument?.volume);
        const explicit = change[eventType] !== undefined;
        if (value !== undefined && (explicit || result.length === 0 || result[result.length - 1].value !== value)) {
            result.push({ step, value, explicit });
        }
    });

    return result;
};

// the volume the track actually plays with over time, including side effects like envelopes, note lengths and the master volume
export const getTrackVolumeCurve = (
    soundData: SoundData,
    trackId: number,
    currentSequenceIndex: number,
    volumeEvents: LaneEvent[]
): LaneValue[] => {
    const track = soundData.tracks[trackId];
    let instrument = soundData.instruments[track?.instrument];
    if (!instrument) {
        return [];
    }

    const changes: Record<number, SoundEventMap> = {};
    getTrackEvents(soundData, trackId, currentSequenceIndex).forEach(e => {
        const change: SoundEventMap = {};
        if (e.events[SoundEvent.Note] !== undefined) {
            change[SoundEvent.Instrument] = e.events[SoundEvent.Instrument] ?? track.instrument;
            change[SoundEvent.Duration] = e.events[SoundEvent.Duration] ?? SUB_NOTE_RESOLUTION;
        }
        if (e.events[SoundEvent.Panning] !== undefined) {
            change[SoundEvent.Panning] = e.events[SoundEvent.Panning];
        }
        changes[e.step] = { ...changes[e.step], ...change };
    });
    [
        ...volumeEvents.map(e => ({ ...e, eventType: SoundEvent.Volume })),
        ...getTrackLaneEvents(soundData, trackId, currentSequenceIndex, SoundEvent.MasterVolume).map(e => ({ ...e, eventType: SoundEvent.MasterVolume })),
    ].forEach(e => {
        changes[e.step] = { ...changes[e.step], [e.eventType]: e.value };
    });

    const totalSize = soundData.size * SUB_NOTE_RESOLUTION;
    const msPerStep = (soundData.speed?.[0] ?? 0) / SUB_NOTE_RESOLUTION;
    const result: LaneValue[] = [];
    let volume: number | undefined;
    let panning: number | undefined;
    let masterVolumeEvent = MASTER_VOLUME_EVENT_MAX;
    let noteStartStep = -1;
    let noteEndStep = -1;
    let registerLevels: RegisterLevels | undefined;
    for (let step = 0; step < totalSize; step++) {
        const change = changes[step];
        if (change) {
            const changedInstrument = soundData.instruments[change[SoundEvent.Instrument]];
            if (changedInstrument && changedInstrument !== instrument) {
                instrument = changedInstrument;
                volume = undefined;
                panning = undefined;
            }
            volume = change[SoundEvent.Volume] ?? volume;
            panning = change[SoundEvent.Panning] ?? panning;
            masterVolumeEvent = change[SoundEvent.MasterVolume] ?? masterVolumeEvent;
            if (change[SoundEvent.Duration] !== undefined) {
                noteStartStep = step;
                noteEndStep = step + change[SoundEvent.Duration];
            }
            registerLevels = undefined;
        }

        // silent before the first note, after a note's duration and after the instrument's hardware note length
        let value = 0;
        const elapsedMs = (step - noteStartStep) * msPerStep;
        if (noteStartStep > -1 && step < noteEndStep &&
            !(instrument.interval.enabled && elapsedMs >= VSU_INTERVAL_VALUES[instrument.interval.value])
        ) {
            if (!registerLevels) {
                const masterVolume = getMasterVolume(soundData.volume ?? MASTER_VOLUME_DEFAULT, masterVolumeEvent);
                const effective = getEffectiveVolumeAndPanning(instrument, volume, panning, masterVolume);
                registerLevels = getRegisterLevels(effective.volume, effective.panning, instrument.envelope);
            }
            value = getOutputVolume(
                registerLevels.stereoLevels,
                instrument.envelope.enabled ? getEnvelopeValueAt(instrument.envelope, elapsedMs) : registerLevels.envelopeInitialValue
            );
        }

        if (result.length === 0 || result[result.length - 1].value !== value) {
            result.push({ step, value });
        }
    }

    return result;
};

const LANE_PADDING = 6;
const MIN_NOTE_WIDTH_FOR_LABELS = 18;

type DragMode = 'draw' | 'erase';

interface PendingEdits {
    // values to set, by step from the start of the sound
    values: Record<number, number>
    // ranges of steps, from inclusive to exclusive, whose existing events get removed
    clearedRanges: [number, number][]
}

const NO_PENDING_EDITS: PendingEdits = { values: {}, clearedRanges: [] };

interface EffectsPanelGridProps {
    soundData: SoundData
    eventType?: SoundEvent
    currentTrackId: number
    currentPatternId: string
    currentSequenceIndex: number
    noteCursor: number
    setNoteCursor: (step: number) => void
    setNotes: (notes: EventsMap) => void
    setGlobalEvents: (events: EventsMap) => void
    setCurrentSequenceIndex: (trackId: number, sequenceIndex: number) => void
    editGlobalEvent: (step: number, eventType: SoundEvent) => void
    tool: SoundEditorTool
    noteSnapping: boolean
    height: number
    pianoRollNoteWidth: number
    pianoRollScrollWindow: ScrollWindow
}

export default function EffectsPanelGrid(props: EffectsPanelGridProps): React.JSX.Element {
    const {
        soundData,
        eventType,
        currentTrackId,
        currentPatternId,
        currentSequenceIndex,
        noteCursor, setNoteCursor,
        setNotes,
        setGlobalEvents,
        setCurrentSequenceIndex,
        editGlobalEvent,
        tool,
        noteSnapping,
        height,
        pianoRollNoteWidth,
        pianoRollScrollWindow,
    } = props;
    const { currentThemeType, services } = useContext(EditorsContext) as EditorsContextType;
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const dragModeRef = useRef<DragMode | undefined>();
    const dragStartStepRef = useRef<number>(-1);
    const lastDragStepRef = useRef<number>(-1);
    const lastDragValueRef = useRef<number>(0);
    // edits of the current drag, which get applied when it ends
    const [pendingEdits, setPendingEdits] = useState<PendingEdits>(NO_PENDING_EDITS);
    const pendingEditsRef = useRef<PendingEdits>(NO_PENDING_EDITS);

    const lane = eventType !== undefined ? EFFECT_LANES[eventType] : undefined;
    const currentPattern = soundData.patterns[currentPatternId];

    // always as wide as the view, even if the sound is shorter
    const width = pianoRollScrollWindow.w;

    // position of a value from the bottom (0) to the top (1) of the lane
    const valueToPosition = (l: EffectLane, value: number): number => {
        const position = (value - l.min) / (l.max - l.min);
        return l.inverted ? 1 - position : position;
    };

    const valueToY = (l: EffectLane, value: number): number =>
        LANE_PADDING + (1 - valueToPosition(l, value)) * (height - 2 * LANE_PADDING);

    const yToValue = (l: EffectLane, y: number): number => {
        const position = 1 - (y - LANE_PADDING) / (height - 2 * LANE_PADDING);
        return clamp(l.snap(l.min + (l.inverted ? 1 - position : position) * (l.max - l.min)), l.min, l.max);
    };

    // global events are not bound to patterns
    const isGlobal = eventType !== undefined && GLOBAL_SOUND_EVENTS.includes(eventType);

    const isEditable = (step: number): boolean => isGlobal
        ? step >= 0 && step < soundData.size * SUB_NOTE_RESOLUTION
        : currentPattern !== undefined &&
        step >= currentSequenceIndex * SUB_NOTE_RESOLUTION &&
        step < (currentSequenceIndex + currentPattern.size) * SUB_NOTE_RESOLUTION;

    const isCleared = (edits: PendingEdits, step: number): boolean =>
        edits.clearedRanges.some(([from, to]) => step >= from && step < to);

    // all of the current track's events of the lane's type, with the current drag's edits applied
    const getLaneEvents = (): LaneEvent[] => {
        if (eventType === undefined) {
            return [];
        }

        const result = getTrackLaneEvents(soundData, currentTrackId, currentSequenceIndex, eventType)
            .filter(e => !(e.inCurrentPattern && isCleared(pendingEdits, e.step)));
        Object.entries(pendingEdits.values).forEach(([step, value]) => {
            result.push({ step: parseInt(step), value, inCurrentPattern: true });
        });

        return result.sort((a, b) => a.step - b.step);
    };

    const laneData = useMemo(() => {
        const laneEvents = getLaneEvents();
        if (!lane || eventType === undefined || lane.editInDialog) {
            return { laneEvents, noteInstruments: [], setValues: [], volumeCurve: [] };
        }

        const track = soundData.tracks[currentTrackId];
        const noteInstruments = isGlobal
            ? []
            : getTrackEvents(soundData, currentTrackId, currentSequenceIndex)
                .filter(e => e.events[SoundEvent.Note] !== undefined)
                .map(e => ({ step: e.step, instrumentId: e.events[SoundEvent.Instrument] ?? track?.instrument }));
        const defaultValue = lane.getDefaultValue?.(soundData);
        const globalDefaultValue = typeof defaultValue === 'number' ? defaultValue : undefined;

        return {
            laneEvents,
            noteInstruments,
            setValues: getTrackSetValues(soundData, currentTrackId, currentSequenceIndex, eventType, laneEvents, globalDefaultValue),
            volumeCurve: eventType === SoundEvent.Volume
                ? getTrackVolumeCurve(soundData, currentTrackId, currentSequenceIndex, laneEvents)
                : [],
        };
    }, [soundData, eventType, currentTrackId, currentSequenceIndex, pendingEdits]);

    const draw = (): void => {
        const canvas = canvasRef.current;
        if (!canvas) {
            return;
        }
        const context = canvas.getContext('2d');
        if (!context) {
            return;
        }

        scaleCanvasAccountForDpi(canvas, context, width, height);

        // highlight current pattern
        const highlightColor = services.colorRegistry.getCurrentColor('focusBorder') ?? 'red';
        if (currentPattern && currentSequenceIndex > -1) {
            context.fillStyle = chroma(highlightColor).alpha(0.1).toString();
            context.fillRect(
                currentSequenceIndex * pianoRollNoteWidth - pianoRollScrollWindow.x - 0.5,
                0,
                currentPattern.size * pianoRollNoteWidth - 0.5,
                height,
            );
        }

        drawGrid(canvas, context, currentThemeType, soundData.size, pianoRollNoteWidth, pianoRollScrollWindow.x, pianoRollScrollWindow.w, getTimeSignatureSegments(soundData));

        if (!lane) {
            return;
        }

        const textColor = services.colorRegistry.getCurrentColor('editor.foreground') ?? '#fff';
        // bars of lanes which start at their minimum grow from the bottom edge
        const growsFromBottom = lane.baseline === lane.min && !lane.inverted;
        const baselineY = growsFromBottom ? height : valueToY(lane, lane.baseline);
        const stepToX = (step: number) => step / SUB_NOTE_RESOLUTION * pianoRollNoteWidth - pianoRollScrollWindow.x;
        const { laneEvents, noteInstruments, setValues, volumeCurve } = laneData;

        if (lane.editInDialog) {
            // labelled bars over the full height, a pale one shows the value before the first event
            const labelledBarWidth = Math.max(2, pianoRollNoteWidth - 1);
            const drawLabelledBar = (step: number, label: string, alpha: number) => {
                const x = stepToX(step);
                if (x + labelledBarWidth < 0 || x > width) {
                    return;
                }
                context.fillStyle = chroma(textColor).alpha(alpha).toString();
                context.fillRect(x, 0, labelledBarWidth, height);
                context.save();
                context.translate(x + labelledBarWidth / 2, height - 4);
                context.rotate(-Math.PI / 2);
                context.font = '10px sans-serif';
                context.textAlign = 'left';
                context.textBaseline = 'middle';
                context.fillStyle = alpha < 1
                    ? textColor
                    : chroma.contrast(textColor, 'white') > 2 ? 'white' : 'black';
                context.fillText(label, 0, 0);
                context.restore();
            };
            if (!laneEvents.some(e => e.step < SUB_NOTE_RESOLUTION)) {
                drawLabelledBar(0, `${lane.getDefaultValue?.(soundData) ?? ''}`, 0.3);
            }
            laneEvents.forEach(e => drawLabelledBar(e.step, lane.format(e.value), e.inCurrentPattern ? 1 : 0.3));
            return;
        }

        // baseline
        if (!growsFromBottom) {
            context.strokeStyle = chroma(textColor).alpha(0.2).toString();
            context.beginPath();
            context.moveTo(0, Math.round(baselineY) + 0.5);
            context.lineTo(width, Math.round(baselineY) + 0.5);
            context.stroke();
        }

        const barWidth = Math.max(2, pianoRollNoteWidth - 1);
        // bars of track events have the color of the instrument active at their step, which is the one of the latest note
        const track = soundData.tracks[currentTrackId];
        const getBarColor = (step: number): string => {
            if (isGlobal) {
                return textColor;
            }
            let instrumentId = track?.instrument;
            for (const noteInstrument of noteInstruments) {
                if (noteInstrument.step > step) {
                    break;
                }
                instrumentId = noteInstrument.instrumentId;
            }
            return COLOR_PALETTE[soundData.instruments[instrumentId]?.color ?? DEFAULT_COLOR_INDEX];
        };

        const drawBar = (step: number, value: number, alpha: number) => {
            const x = stepToX(step);
            if (x + barWidth < 0 || x > width) {
                return;
            }
            const valueY = valueToY(lane, value);
            context.fillStyle = chroma(getBarColor(step)).alpha(alpha).toString();
            context.fillRect(x, Math.min(valueY, baselineY), barWidth, Math.max(1, Math.abs(baselineY - valueY)));
        };
        const drawStepLine = (values: LaneValue[], color: string, alpha: number, lineWidth: number) => {
            if (values.length === 0) {
                return;
            }
            context.strokeStyle = chroma(color).alpha(alpha).toString();
            context.lineWidth = lineWidth;
            context.beginPath();
            let y = valueToY(lane, values[0].value);
            context.moveTo(0, y);
            values.forEach(v => {
                const x = stepToX(v.step);
                context.lineTo(x, y);
                y = valueToY(lane, v.value);
                context.lineTo(x, y);
            });
            context.lineTo(width, y);
            context.stroke();
            context.lineWidth = 1;
        };

        context.font = '9px sans-serif';

        // shadow bars where values change without an effect, e.g. with an instrument change
        setValues.filter(v => !v.explicit).forEach(v => drawBar(v.step, v.value, 0.2));

        // effect bars
        context.textAlign = 'center';
        laneEvents.forEach(e => {
            drawBar(e.step, e.value, e.inCurrentPattern ? 1 : 0.3);
            const x = stepToX(e.step);
            if (pianoRollNoteWidth >= MIN_NOTE_WIDTH_FOR_LABELS && x + barWidth >= 0 && x <= width) {
                const labelY = Math.min(valueToY(lane, e.value), baselineY);
                context.fillStyle = chroma(textColor).alpha(e.inCurrentPattern ? 0.9 : 0.4).toString();
                context.fillText(lane.format(e.value), x + barWidth / 2, labelY < 12 ? labelY + 10 : labelY - 2);
            }
        });

        // the volume actually played, including side effects like envelopes and the master volume
        if (eventType === SoundEvent.Volume) {
            drawStepLine(volumeCurve, highlightColor, 0.8, 1);
        }

        // the values set by instruments and effects
        drawStepLine(setValues, textColor, 0.9, 2);

        // value range
        context.textAlign = 'left';
        context.fillStyle = chroma(textColor).alpha(0.5).toString();
        const formatScale = lane.formatScale ?? lane.format;
        context.fillText(formatScale(lane.inverted ? lane.min : lane.max), 2, 10);
        context.fillText(formatScale(lane.inverted ? lane.max : lane.min), 2, height - 3);
    };

    const getColumn = (e: MouseEvent<HTMLCanvasElement>): number => {
        const rect = e.currentTarget.getBoundingClientRect();
        return Math.floor((e.clientX - rect.left + pianoRollScrollWindow.x) / pianoRollNoteWidth);
    };

    // with note snapping, the start of the column, otherwise the exact step under the mouse
    const getStep = (e: MouseEvent<HTMLCanvasElement>): number => {
        if (noteSnapping) {
            return getColumn(e) * SUB_NOTE_RESOLUTION;
        }
        const rect = e.currentTarget.getBoundingClientRect();
        return Math.floor((e.clientX - rect.left + pianoRollScrollWindow.x) * SUB_NOTE_RESOLUTION / pianoRollNoteWidth);
    };

    const getValue = (e: MouseEvent<HTMLCanvasElement>): number => {
        const rect = e.currentTarget.getBoundingClientRect();
        return yToValue(lane!, e.clientY - rect.top);
    };

    const updatePendingEdits = (step: number, value: number): void => {
        const isFirst = lastDragStepRef.current === -1;
        const fromStep = isFirst ? step : lastDragStepRef.current;
        const fromValue = isFirst ? value : lastDragValueRef.current;
        const erase = dragModeRef.current === 'erase';
        const values = { ...pendingEditsRef.current.values };
        const clearedRanges = [...pendingEditsRef.current.clearedRanges];

        if (noteSnapping) {
            // a column holds at most one value, and every column between the previous and the current mouse position gets one,
            // so fast moves leave no gaps
            const fromColumn = fromStep / SUB_NOTE_RESOLUTION;
            const column = step / SUB_NOTE_RESOLUTION;
            const distance = Math.abs(column - fromColumn);
            const direction = column >= fromColumn ? 1 : -1;
            for (let i = 0; i <= distance; i++) {
                const columnStep = (fromColumn + i * direction) * SUB_NOTE_RESOLUTION;
                if (!isEditable(columnStep)) {
                    continue;
                }
                clearedRanges.push([columnStep, columnStep + SUB_NOTE_RESOLUTION]);
                delete values[columnStep];
                if (!erase) {
                    values[columnStep] = lane!.snap(fromValue + (value - fromValue) * (distance === 0 ? 1 : i / distance));
                }
            }
        } else {
            // values replace the ones the mouse passes over, erasing hits every bar under the mouse
            const minStep = Math.min(fromStep, step);
            const maxStep = Math.max(fromStep, step);
            clearedRanges.push([minStep - (erase ? SUB_NOTE_RESOLUTION - 1 : 0), maxStep + 1]);
            if (!erase) {
                // values get set every SUB_NOTE_RESOLUTION steps, counting from where the drag started
                if (isFirst) {
                    dragStartStepRef.current = step;
                }
                const origin = dragStartStepRef.current;
                const firstGridStep = origin + Math.ceil((minStep - origin) / SUB_NOTE_RESOLUTION) * SUB_NOTE_RESOLUTION;
                for (let gridStep = firstGridStep; gridStep <= maxStep; gridStep += SUB_NOTE_RESOLUTION) {
                    if (isEditable(gridStep)) {
                        values[gridStep] = lane!.snap(step === fromStep
                            ? value
                            : fromValue + (value - fromValue) * (gridStep - fromStep) / (step - fromStep));
                    }
                }
            }
        }

        lastDragStepRef.current = step;
        lastDragValueRef.current = value;
        pendingEditsRef.current = { values, clearedRanges };
        setPendingEdits(pendingEditsRef.current);
    };

    const commitPendingEdits = (): void => {
        const edits = pendingEditsRef.current;
        dragModeRef.current = undefined;
        lastDragStepRef.current = -1;
        pendingEditsRef.current = NO_PENDING_EDITS;
        setPendingEdits(NO_PENDING_EDITS);

        if (isGlobal) {
            let globalEvents = soundData.events ?? {};
            Object.keys(globalEvents).map(s => parseInt(s)).forEach(step => {
                if (isCleared(edits, step) && isEditable(step)) {
                    globalEvents = withGlobalEvent(globalEvents, step, eventType, undefined);
                }
            });
            Object.entries(edits.values).forEach(([step, value]) => {
                globalEvents = withGlobalEvent(globalEvents, parseInt(step), eventType, value);
            });
            setGlobalEvents(globalEvents);
            return;
        }

        if (!currentPattern || eventType === undefined) {
            return;
        }

        const patternStartStep = currentSequenceIndex * SUB_NOTE_RESOLUTION;
        const notes: EventsMap = {};
        Object.keys(currentPattern.events).map(s => parseInt(s)).forEach(step => {
            if (currentPattern.events[step][eventType] !== undefined && isCleared(edits, patternStartStep + step)) {
                notes[step] = { [eventType]: undefined };
            }
        });
        Object.entries(edits.values).forEach(([step, value]) => {
            notes[parseInt(step) - patternStartStep] = { [eventType]: value };
        });

        if (Object.keys(notes).length > 0) {
            setNotes(notes);
        }
    };

    // the sequence index of the current track's pattern at the given column, if any
    const getSequenceIndexAtColumn = (column: number): number | undefined => {
        const sequence = soundData.tracks[currentTrackId]?.sequence ?? {};
        const sequenceIndexes = Object.keys(sequence).map(si => parseInt(si)).sort((a, b) => a - b);
        return sequenceIndexes.find((sequenceIndex, i) => {
            const patternSize = soundData.patterns[sequence[sequenceIndex]]?.size ?? 0;
            const end = Math.min(sequenceIndex + patternSize, sequenceIndexes[i + 1] ?? Infinity);
            return column >= sequenceIndex && column < end;
        });
    };

    // the step of the lane's event within the given column, if any
    const getEventStepInColumn = (column: number): number | undefined => eventType === undefined
        ? undefined
        : getTrackLaneEvents(soundData, currentTrackId, currentSequenceIndex, eventType)
            .find(e => e.inCurrentPattern && Math.floor(e.step / SUB_NOTE_RESOLUTION) === column)?.step;

    const onMouseDown = (e: MouseEvent<HTMLCanvasElement>) => {
        const column = getColumn(e);

        // clicking another pattern only switches to it, editing starts with the next click
        if (e.button === 0) {
            const sequenceIndex = getSequenceIndexAtColumn(column);
            if (sequenceIndex !== undefined && sequenceIndex !== currentSequenceIndex) {
                setCurrentSequenceIndex(currentTrackId, sequenceIndex);
                return;
            }
        }

        // lanes edited in a dialog get an event with the default value on click, existing ones get edited on double-click
        if (lane?.editInDialog && isGlobal && e.button === 0 && tool === SoundEditorTool.EDIT) {
            const columnStep = column * SUB_NOTE_RESOLUTION;
            if (isEditable(columnStep) && getEventStepInColumn(column) === undefined) {
                setGlobalEvents(withGlobalEvent(soundData.events ?? {}, columnStep, eventType, lane.getDefaultValue?.(soundData)));
                editGlobalEvent(columnStep, eventType);
            }
            return;
        }

        if (lane && e.button === 0 && tool === SoundEditorTool.EDIT) {
            dragModeRef.current = 'draw';
        } else if (lane && (
            e.button === 0 && tool === SoundEditorTool.ERASER ||
            e.button === 2 && (e.metaKey || e.ctrlKey || e.altKey)
        )) {
            dragModeRef.current = 'erase';
        } else if (e.button === 2) {
            if (column < soundData.size) {
                setNoteCursor(column * SUB_NOTE_RESOLUTION);
            }
            return;
        } else {
            return;
        }

        lastDragStepRef.current = -1;
        updatePendingEdits(getStep(e), getValue(e));
    };

    const onMouseMove = (e: MouseEvent<HTMLCanvasElement>) => {
        if (dragModeRef.current !== undefined) {
            updatePendingEdits(getStep(e), getValue(e));
        }
    };

    const onDoubleClick = (e: MouseEvent<HTMLCanvasElement>) => {
        if (!lane?.editInDialog || eventType === undefined || tool !== SoundEditorTool.EDIT) {
            return;
        }
        const step = getEventStepInColumn(getColumn(e));
        if (step !== undefined) {
            editGlobalEvent(step, eventType);
        }
    };

    const onMouseUp = () => {
        if (dragModeRef.current !== undefined) {
            commitPendingEdits();
        }
    };

    useEffect(() => {
        draw();
        const context = canvasRef.current?.getContext('2d');
        if (context) {
            drawSongEnd(context, currentThemeType, soundData.size * pianoRollNoteWidth, pianoRollScrollWindow.x, width, height);
        }
    }, [
        currentThemeType,
        soundData,
        eventType,
        currentTrackId,
        currentPatternId,
        currentSequenceIndex,
        noteCursor,
        pendingEdits,
        height,
        pianoRollNoteWidth,
        pianoRollScrollWindow.x,
        pianoRollScrollWindow.w,
    ]);

    return (
        <canvas
            height={height}
            width={width}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            onDoubleClick={onDoubleClick}
            onContextMenu={e => e.preventDefault()}
            ref={canvasRef}
            style={{
                cursor: lane ? getToolModeCursor(tool) : undefined,
            }}
        />
    );
}
