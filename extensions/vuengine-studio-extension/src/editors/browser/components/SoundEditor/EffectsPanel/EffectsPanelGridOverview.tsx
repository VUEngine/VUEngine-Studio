import chroma from 'chroma-js';
import React, { MouseEvent, useContext, useEffect, useRef } from 'react';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import { scaleCanvasAccountForDpi } from '../../Common/Utils';
import { getGridLine, getTimeSignatureSegments, TimeSignatureSegment } from '../Other/timeSignature';
import {
    EFFECTS_PANEL_COLLAPSED_HEIGHT,
    GLOBAL_SOUND_EVENTS,
    ScrollWindow,
    SoundData,
    SoundEvent,
    SoundEventMap,
    SUB_NOTE_RESOLUTION
} from '../SoundEditorTypes';

// columns with more effects than this show their count instead of their short labels
const MAX_SHORT_LABELS = 2;

export interface LaneEvent {
    step: number
    value: number
    inCurrentPattern: boolean
}

export interface TrackStepEvents {
    step: number
    events: SoundEventMap
    inCurrentPattern: boolean
}

export const getTrackEvents = (
    soundData: SoundData,
    trackId: number,
    currentSequenceIndex: number
): TrackStepEvents[] => {
    const track = soundData.tracks[trackId];
    if (!track) {
        return [];
    }

    const result: TrackStepEvents[] = [];
    const sequenceIndexes = Object.keys(track.sequence).map(si => parseInt(si)).sort((a, b) => a - b);
    sequenceIndexes.forEach((sequenceIndex, i) => {
        const pattern = soundData.patterns[track.sequence[sequenceIndex]];
        if (!pattern) {
            return;
        }
        // patterns get cut off by the next one in the sequence
        const nextSequenceIndex = sequenceIndexes[i + 1] ?? Infinity;
        const patternEndStep = Math.min(pattern.size, nextSequenceIndex - sequenceIndex) * SUB_NOTE_RESOLUTION;
        Object.keys(pattern.events).forEach(s => {
            const step = parseInt(s);
            if (step < patternEndStep) {
                result.push({
                    step: sequenceIndex * SUB_NOTE_RESOLUTION + step,
                    events: pattern.events[step],
                    inCurrentPattern: sequenceIndex === currentSequenceIndex,
                });
            }
        });
    });

    return result.sort((a, b) => a.step - b.step);
};

// all of a track's events of the given type
export const getTrackLaneEvents = (
    soundData: SoundData,
    trackId: number,
    currentSequenceIndex: number,
    eventType: SoundEvent
): LaneEvent[] => {
    // global events are editable everywhere, so they count as part of the current pattern
    if (GLOBAL_SOUND_EVENTS.includes(eventType)) {
        const globalEvents = soundData.events ?? {};
        return Object.keys(globalEvents)
            .map(s => parseInt(s))
            .filter(step => globalEvents[step][eventType] !== undefined)
            .sort((a, b) => a - b)
            .map(step => ({
                step,
                value: globalEvents[step][eventType],
                inCurrentPattern: true,
            }));
    }

    return getTrackEvents(soundData, trackId, currentSequenceIndex)
        .filter(e => e.events[eventType] !== undefined)
        .map(e => ({
            step: e.step,
            value: e.events[eventType],
            inCurrentPattern: e.inCurrentPattern,
        }));
};

export const drawGrid = (
    canvas: HTMLCanvasElement,
    context: CanvasRenderingContext2D,
    themeType: string,
    bars: number,
    noteWidth: number,
    scrollOffset: number,
    scrollWidth: number,
    timeSignatureSegments: TimeSignatureSegment[],
) => {
    const highContrastTheme = ['hc', 'hcLight'].includes(themeType);
    const c = ['light', 'hcLight'].includes(themeType) ? 0 : 255;
    const lowColor = highContrastTheme
        ? `rgba(${c}, ${c}, ${c}, 0)`
        : `rgba(${c}, ${c}, ${c}, .1)`;
    const medColor = highContrastTheme
        ? `rgba(${c}, ${c}, ${c}, 1)`
        : `rgba(${c}, ${c}, ${c}, .2)`;
    const hiColor = highContrastTheme
        ? `rgba(${c}, ${c}, ${c}, 1)`
        : `rgba(${c}, ${c}, ${c}, .4)`;

    context.strokeStyle = lowColor;
    context.lineWidth = 1;
    const h = canvas.height;

    // vertical lines
    const lastColumn = Math.max(bars, Math.ceil((scrollOffset + scrollWidth) / noteWidth));
    for (let x = 1; x <= lastColumn; x++) {
        const offsetElement = x * noteWidth;
        if (offsetElement < scrollOffset) {
            continue;
        }
        if (offsetElement > scrollOffset + scrollWidth) {
            break;
        }
        const offset = offsetElement - 0.5 - scrollOffset;
        context.beginPath();
        context.moveTo(offset, 0);
        context.lineTo(offset, h);
        const gridLine = getGridLine(timeSignatureSegments, x);
        context.strokeStyle = gridLine.isBarStart
            ? hiColor
            : gridLine.isBeatStart
                ? medColor
                : lowColor;
        context.stroke();
    }
};

const AFTER_SONG_END_OPACITY = 0.25;

// for views which are wider than the sound is long, fades everything drawn after the end of the sound and marks the end,
// so it has to be called after everything else got drawn
export const drawSongEnd = (
    context: CanvasRenderingContext2D,
    themeType: string,
    songWidth: number,
    scrollOffset: number,
    width: number,
    height: number,
) => {
    const x = Math.max(0, songWidth - scrollOffset);
    if (x >= width) {
        return;
    }

    context.save();
    context.globalCompositeOperation = 'destination-out';
    context.fillStyle = `rgba(0, 0, 0, ${1 - AFTER_SONG_END_OPACITY})`;
    context.fillRect(x, 0, width - x, height);
    context.restore();

    const c = ['light', 'hcLight'].includes(themeType) ? 0 : 255;
    context.strokeStyle = `rgba(${c}, ${c}, ${c}, .6)`;
    context.beginPath();
    context.moveTo(x - 0.5, 0);
    context.lineTo(x - 0.5, height);
    context.stroke();
};

export interface OverviewEffect {
    eventType: SoundEvent
    shortLabel: string
}

interface ColumnEffects {
    eventTypes: SoundEvent[]
    inCurrentPattern: boolean
}

interface EffectsPanelGridOverviewProps {
    soundData: SoundData
    effects: OverviewEffect[]
    currentTrackId: number
    currentPatternId: string
    currentSequenceIndex: number
    expandPanel: (eventType?: SoundEvent) => void
    pianoRollNoteWidth: number
    pianoRollScrollWindow: ScrollWindow
}

export default function EffectsPanelGridOverview(props: EffectsPanelGridOverviewProps): React.JSX.Element {
    const {
        soundData,
        effects,
        currentTrackId,
        currentPatternId,
        currentSequenceIndex,
        expandPanel,
        pianoRollNoteWidth,
        pianoRollScrollWindow,
    } = props;
    const { currentThemeType, services } = useContext(EditorsContext) as EditorsContextType;
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const height = EFFECTS_PANEL_COLLAPSED_HEIGHT;

    // always as wide as the view, even if the sound is shorter
    const width = pianoRollScrollWindow.w;

    const getColumnEffects = (): Record<number, ColumnEffects> => {
        const result: Record<number, ColumnEffects> = {};
        effects.forEach(effect => {
            getTrackLaneEvents(soundData, currentTrackId, currentSequenceIndex, effect.eventType).forEach(e => {
                const column = Math.floor(e.step / SUB_NOTE_RESOLUTION);
                result[column] = result[column] ?? { eventTypes: [], inCurrentPattern: false };
                if (!result[column].eventTypes.includes(effect.eventType)) {
                    result[column].eventTypes.push(effect.eventType);
                }
                result[column].inCurrentPattern ||= e.inCurrentPattern;
            });
        });

        return result;
    };

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
        const currentPattern = soundData.patterns[currentPatternId];
        if (currentPattern && currentSequenceIndex > -1) {
            const highlightColor = services.colorRegistry.getCurrentColor('focusBorder') ?? 'red';
            context.fillStyle = chroma(highlightColor).alpha(0.1).toString();
            context.fillRect(
                currentSequenceIndex * pianoRollNoteWidth - pianoRollScrollWindow.x - 0.5,
                0,
                currentPattern.size * pianoRollNoteWidth - 0.5,
                height,
            );
        }

        drawGrid(canvas, context, currentThemeType, soundData.size, pianoRollNoteWidth, pianoRollScrollWindow.x, pianoRollScrollWindow.w, getTimeSignatureSegments(soundData));

        // label the columns which have effect events
        const color = services.colorRegistry.getCurrentColor('editor.foreground') ?? '#fff';
        context.font = 'bold 10px sans-serif';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        Object.entries(getColumnEffects()).forEach(([c, columnEffects]) => {
            const x = parseInt(c) * pianoRollNoteWidth - pianoRollScrollWindow.x;
            if (x + pianoRollNoteWidth < 0 || x > width) {
                return;
            }

            // highlight the column, leaving the grid line at its right edge visible
            context.fillStyle = chroma(color).alpha(columnEffects.inCurrentPattern ? 0.2 : 0.1).toString();
            context.fillRect(x, 0, Math.max(1, pianoRollNoteWidth - 1), height);

            const label = columnEffects.eventTypes.length > MAX_SHORT_LABELS
                ? columnEffects.eventTypes.length.toString()
                : effects
                    .filter(effect => columnEffects.eventTypes.includes(effect.eventType))
                    .map(effect => effect.shortLabel)
                    .join('');
            context.fillStyle = chroma(color).alpha(columnEffects.inCurrentPattern ? 1 : 0.5).toString();
            const centerX = x + pianoRollNoteWidth / 2;
            // fall back to a dot if the label does not fit into the column
            if (context.measureText(label).width <= pianoRollNoteWidth - 2) {
                context.fillText(label, centerX, height / 2 + 1);
            } else {
                context.beginPath();
                context.arc(centerX, height / 2, Math.min(2, pianoRollNoteWidth / 2), 0, 2 * Math.PI);
                context.fill();
            }
        });
    };

    // expand the panel, showing the first effect of the clicked column, if any
    const onMouseDown = (e: MouseEvent<HTMLCanvasElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const column = Math.floor((e.clientX - rect.left + pianoRollScrollWindow.x) / pianoRollNoteWidth);
        const columnEventTypes = getColumnEffects()[column]?.eventTypes ?? [];
        expandPanel(effects.find(effect => columnEventTypes.includes(effect.eventType))?.eventType);
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
        currentTrackId,
        currentPatternId,
        currentSequenceIndex,
        pianoRollNoteWidth,
        pianoRollScrollWindow.x,
        pianoRollScrollWindow.w,
    ]);

    return (
        <canvas
            height={height}
            width={width}
            onMouseDown={onMouseDown}
            ref={canvasRef}
            style={{
                cursor: 'pointer',
            }}
        />
    );
}
