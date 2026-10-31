import chroma from 'chroma-js';
import React, { Dispatch, MouseEvent, RefObject, SetStateAction, useContext, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import { COLOR_PALETTE, DEFAULT_COLOR_INDEX } from '../../Common/PaletteColorSelect';
import { clamp, scaleCanvasAccountForDpi } from '../../Common/Utils';
import { drawSongEnd } from '../EffectsPanel/EffectsPanelGridOverview';
import { getBarsLength, getGridLine, getNearestBarStartColumn, getNextBarStartColumn, getTimeSignatureSegments } from '../Other/timeSignature';
import { getFoundPatternSequenceIndex, getPatternName, getSnappedStep, getToolModeCursor } from '../SoundEditor';
import {
    DEFAULT_BARS_PER_PATTERN,
    NOTES_LABELS,
    NOTES_SPECTRUM,
    SCROLL_BAR_WIDTH,
    ScrollWindow,
    SEQUENCER_GRID_METER_HEIGHT,
    SEQUENCER_GRID_WIDTH,
    SEQUENCER_NOTE_HEIGHT,
    SoundData,
    SoundEditorMarqueeMode,
    SoundEditorTool,
    SoundEvent,
    SUB_NOTE_RESOLUTION,
    TrackSettings
} from '../SoundEditorTypes';

const SELECTED_PATTERN_OUTLINE_WIDTH = 2;
// how far the mouse has to move before grabbing a pattern moves or resizes it, so that clicks do not
const PATTERN_GRAB_THRESHOLD = 3;

type PatternGrabMode = 'move' | 'size';

const PATTERN_GRAB_CURSORS: Record<PatternGrabMode, string> = {
    move: 'move',
    size: 'ew-resize',
};

interface PatternHit {
    trackId: number
    sequenceIndex: number
    mode: PatternGrabMode
}

interface PatternGrab extends PatternHit {
    // identifiers of all patterns that get moved or resized, including the grabbed one
    patterns: string[]
    startX: number
    startY: number
    // undefined until the mouse has moved past the threshold
    moved?: boolean
    trackOffset?: number
    sequenceIndexOffset?: number
    sizes?: { [patternId: string]: number }
}

const parsePatternIdentifier = (identifier: string) => ({
    trackId: parseInt(identifier.split('-')[0]),
    sequenceIndex: parseInt(identifier.split('-')[1]),
});

const StyledSequencerCanvas = styled.canvas`
    left: 0;
    position: sticky;
    z-index: 20;
`;

interface SequencerGridProps {
    soundData: SoundData
    updateSoundData: (soundData: SoundData) => void
    tool: SoundEditorTool
    marqueeMode: SoundEditorMarqueeMode
    currentTrackId: number
    currentPatternId: string
    currentSequenceIndex: number
    setCurrentSequenceIndex: (trackId: number, sequenceIndex: number) => void
    setCurrentPatternId: (trackId: number, patternId: string) => void
    setPatternSizes: (patterns: { [patternId: string]: number }) => void
    selectedPatterns: string[]
    setSelectedPatterns: (sn: string[]) => void
    addPattern: (trackId: number, bar: number, size?: number) => void
    playRangeStart: number
    setPlayRangeStart: (playRangeStart: number) => void
    playRangeEnd: number
    setPlayRangeEnd: (playRangeEnd: number) => void
    sequencerPatternHeight: number
    sequencerNoteWidth: number
    patternDragTrackId: number
    setPatternDragTrackId: Dispatch<SetStateAction<number>>
    patternDragStartStep: number
    setPatternDragStartStep: Dispatch<SetStateAction<number>>
    patternDragEndStep: number
    setPatternDragEndStep: Dispatch<SetStateAction<number>>
    sequencerScrollWindow: ScrollWindow
    rangeDragStartStep: number
    setRangeDragStartStep: Dispatch<SetStateAction<number>>
    rangeDragEndStep: number
    setRangeDragEndStep: Dispatch<SetStateAction<number>>
    setCurrentPlayerPosition: Dispatch<SetStateAction<number>>
    setPlayerSeekRequest: Dispatch<SetStateAction<number>>
    trackSettings: TrackSettings[]
    soloTrack: number
    editCurrentPattern: () => void
    sequencerContainerRef: RefObject<HTMLDivElement>
    pianoRollScrollWindow: ScrollWindow
    pianoRollNoteWidth: number
    removePatternsFromSequence: (patterns: string[]) => void
    noteSnapping: boolean
    noteCursor: number
    setNoteCursor: (step: number) => void
    openSongLengthDialog: () => void
}

export default function SequencerGrid(props: SequencerGridProps): React.JSX.Element {
    const {
        soundData, updateSoundData,
        tool, marqueeMode,
        currentTrackId,
        currentPatternId, setCurrentPatternId,
        currentSequenceIndex, setCurrentSequenceIndex,
        setPatternSizes,
        selectedPatterns, setSelectedPatterns,
        addPattern,
        playRangeStart, setPlayRangeStart,
        playRangeEnd, setPlayRangeEnd,
        sequencerPatternHeight, sequencerNoteWidth,
        patternDragTrackId, setPatternDragTrackId,
        patternDragStartStep, setPatternDragStartStep,
        patternDragEndStep, setPatternDragEndStep,
        sequencerScrollWindow,
        rangeDragStartStep, setRangeDragStartStep,
        rangeDragEndStep, setRangeDragEndStep,
        setCurrentPlayerPosition,
        setPlayerSeekRequest,
        trackSettings,
        soloTrack,
        editCurrentPattern,
        sequencerContainerRef,
        pianoRollScrollWindow,
        pianoRollNoteWidth,
        removePatternsFromSequence,
        noteSnapping,
        noteCursor, setNoteCursor,
        openSongLengthDialog,
    } = props;
    const { currentThemeType, services } = useContext(EditorsContext) as EditorsContextType;
    const [isDragScrolling, setIsDragScrolling] = useState<boolean>(false);
    const [marqueeStartStep, setMarqueeStartStep] = useState<number>(-1);
    const [marqueeEndStep, setMarqueeEndStep] = useState<number>(-1);
    const [marqueeStartTrack, setMarqueeStartTrack] = useState<number>(-1);
    const [marqueeEndTrack, setMarqueeEndTrack] = useState<number>(-1);
    const [patternGrab, setPatternGrab] = useState<PatternGrab>();
    const [hoveredPatternGrabMode, setHoveredPatternGrabMode] = useState<PatternGrabMode>();
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const height = soundData.tracks.length * sequencerPatternHeight + SEQUENCER_GRID_METER_HEIGHT;
    // always as wide as the view, even if the sound is shorter
    const width = sequencerScrollWindow.w - SCROLL_BAR_WIDTH;

    const noteHeightOverlap = (SEQUENCER_NOTE_HEIGHT - 1) / 2;

    // while resizing, patterns get drawn with the sizes they would get
    const getPatternSize = (patternId: string): number =>
        patternGrab?.sizes?.[patternId] ?? soundData.patterns[patternId]?.size ?? 0;

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

        const highContrastTheme = ['hc', 'hcLight'].includes(currentThemeType);
        const c = currentThemeType === 'light' ? 0 : 255;
        const highlightColor = services.colorRegistry.getCurrentColor('focusBorder') ?? 'red';
        const medHighlightColor = chroma(highlightColor).alpha(0.2).toString();
        const strongHighlightColor = chroma(highlightColor).alpha(0.6).toString();
        const otherPlacementHighlightColor = chroma(highlightColor).alpha(0.2).toString();
        const faintHighlightColor = chroma(highlightColor).alpha(0.1).toString();
        const patternBackgroundColor = services.colorRegistry.getCurrentColor('secondaryButton.background')!;
        const hiPatternBackgroundColor = chroma(patternBackgroundColor).alpha(0.5).toString();
        const patternForegroundColor = services.colorRegistry.getCurrentColor('secondaryButton.foreground')!;
        const fullColor = `rgba(${c}, ${c}, ${c}, 1)`;
        const lowColor = highContrastTheme
            ? fullColor
            : `rgba(${c}, ${c}, ${c}, .1)`;
        const medColor = highContrastTheme
            ? fullColor
            : `rgba(${c}, ${c}, ${c}, .2)`;
        const hiColor = highContrastTheme
            ? fullColor
            : `rgba(${c}, ${c}, ${c}, .4)`;
        const strongColor = highContrastTheme
            ? fullColor
            : `rgba(${c}, ${c}, ${c}, .6)`;

        context.strokeStyle = medColor;
        context.lineWidth = 1;

        // highlight current track
        context.rect(
            0,
            SEQUENCER_GRID_METER_HEIGHT + currentTrackId * sequencerPatternHeight,
            width,
            sequencerPatternHeight - 1
        );
        context.fillStyle = lowColor;
        context.fill();

        // play range
        if (playRangeStart > -1 && playRangeEnd > -1) {
            context.strokeStyle = services.colorRegistry.getCurrentColor('focusBorder')!;
            context.fillStyle = context.strokeStyle;
            const leftOffset = playRangeStart * sequencerNoteWidth - sequencerScrollWindow.x - 0.5;
            const rightOffset = playRangeEnd * sequencerNoteWidth - sequencerScrollWindow.x - 0.5;

            context.beginPath();
            context.moveTo(leftOffset, 0.5);
            context.lineTo(rightOffset, 0.5);
            context.stroke();

            context.beginPath();
            context.moveTo(leftOffset, 0.5);
            context.lineTo(leftOffset, 0.5 + SEQUENCER_GRID_METER_HEIGHT / 2);
            context.lineTo(leftOffset + SEQUENCER_GRID_METER_HEIGHT / 2, 0.5);
            context.fill();

            context.beginPath();
            context.moveTo(rightOffset, 0.5);
            context.lineTo(rightOffset, 0.5 + SEQUENCER_GRID_METER_HEIGHT / 2);
            context.lineTo(rightOffset - SEQUENCER_GRID_METER_HEIGHT / 2, 0.5);
            context.fill();
        }

        // range draw
        if (rangeDragStartStep > -1 && rangeDragEndStep > -1) {
            const rangeDrawLeft = Math.min(rangeDragStartStep, rangeDragEndStep) * sequencerNoteWidth - sequencerScrollWindow.x;
            const rangeDrawWidth = sequencerNoteWidth * (rangeDragStartStep === rangeDragEndStep
                ? getBarsLength(getTimeSignatureSegments(soundData), rangeDragStartStep, DEFAULT_BARS_PER_PATTERN)
                : Math.abs(rangeDragStartStep - rangeDragEndStep) + 1);
            const rangeDrawHeight = SEQUENCER_GRID_METER_HEIGHT / 2;

            context.strokeStyle = highlightColor;
            context.setLineDash([3, 2]);
            context.beginPath();
            context.moveTo(rangeDrawLeft, 0 + rangeDrawHeight);
            context.lineTo(rangeDrawLeft, 0);
            context.lineTo(rangeDrawLeft + rangeDrawWidth, 0);
            context.lineTo(rangeDrawLeft + rangeDrawWidth, 0 + rangeDrawHeight);
            context.stroke();
            context.setLineDash([]);
        }

        // piano roll scroll window
        const scrollWindowLeft = sequencerNoteWidth / pianoRollNoteWidth * pianoRollScrollWindow.x - sequencerScrollWindow.x;
        const scrollWindowWidth = Math.min(
            sequencerNoteWidth / pianoRollNoteWidth * pianoRollScrollWindow.w,
            // cap to song size as maximum width
            soundData.size * sequencerNoteWidth
        );
        context.fillStyle = lowColor;
        context.fillRect(scrollWindowLeft, 0, scrollWindowWidth, height);

        // vertical lines
        const timeSignatureSegments = getTimeSignatureSegments(soundData);
        // the grid continues after the end of the sound, see drawSongEnd
        const lastColumn = Math.max(soundData.size, Math.ceil((sequencerScrollWindow.x + sequencerScrollWindow.w) / sequencerNoteWidth));
        for (let x = 0; x <= lastColumn; x++) {
            const lineX = x * sequencerNoteWidth;
            if (lineX < sequencerScrollWindow.x) {
                continue;
            }
            if (lineX > sequencerScrollWindow.x + sequencerScrollWindow.w) {
                break;
            }

            const offset = lineX - sequencerScrollWindow.x - 0.5;
            context.beginPath();
            context.moveTo(offset, height);

            // meter numbers
            const gridLine = getGridLine(timeSignatureSegments, x);
            if (gridLine.isBarStart) {
                context.fillStyle = hiColor;
                context.font = '9px monospace';
                // no bar numbers after the end of the sound
                if (x < soundData.size && (!soundData.loop || x !== soundData.loopPoint)) {
                    context.fillText(gridLine.bar.toString(), offset + 3, 10);
                }
                context.strokeStyle = hiColor;
                context.lineTo(offset, 0);
            } else {
                context.strokeStyle = x === soundData.size
                    ? strongColor
                    : gridLine.isBeatStart
                        ? medColor
                        : lowColor;
                context.lineTo(offset, SEQUENCER_GRID_METER_HEIGHT);
            }

            context.stroke();
        }

        // horizontal lines
        for (let y = 0; y <= soundData.tracks.length; y++) {
            const offset = SEQUENCER_GRID_METER_HEIGHT + y * sequencerPatternHeight - 0.5;
            context.beginPath();
            context.moveTo(0, offset);
            context.lineTo(width, offset);
            context.strokeStyle = y % soundData.tracks.length === 0
                ? strongColor
                : hiColor;
            context.stroke();
        }

        // note cursor
        context.strokeStyle = highlightColor;
        context.setLineDash([3, 2]);
        context.beginPath();
        const noteCursorXPos = noteCursor / SUB_NOTE_RESOLUTION * sequencerNoteWidth - sequencerScrollWindow.x - 0.5;
        context.moveTo(noteCursorXPos, 0.5);
        context.lineTo(noteCursorXPos, height - 0.5);
        context.stroke();
        context.setLineDash([]);

        // patterns
        soundData.tracks.forEach((track, trackId) => {
            const ts = trackSettings[trackId];
            const trackMuted = ts?.muted || (soloTrack > -1 && soloTrack !== trackId);
            Object.keys(track.sequence).forEach(si => {
                const sequenceIndex = parseInt(si);
                const patternId = track.sequence[sequenceIndex];
                const pattern = soundData.patterns[patternId];
                if (!pattern) {
                    return;
                }

                const patternSize = getPatternSize(patternId);
                const patternX = sequenceIndex * sequencerNoteWidth;
                const patternWidth = patternSize * sequencerNoteWidth - SEQUENCER_GRID_WIDTH;

                if ((sequencerScrollWindow.x > patternX + patternWidth) || (patternX > sequencerScrollWindow.x + sequencerScrollWindow.w)) {
                    return;
                }

                const patternXOffset = patternX - sequencerScrollWindow.x;
                const patternY = SEQUENCER_GRID_METER_HEIGHT + trackId * sequencerPatternHeight;
                const patternHeight = sequencerPatternHeight - SEQUENCER_GRID_WIDTH;

                // pattern background
                context.fillStyle = trackId === currentTrackId && sequenceIndex === currentSequenceIndex
                    ? trackMuted
                        ? strongHighlightColor
                        : highlightColor
                    : trackMuted
                        ? hiPatternBackgroundColor
                        : patternBackgroundColor;
                context.fillRect(patternXOffset, patternY, patternWidth, patternHeight);

                // other placements of the current pattern get a faint highlight, outlines mark selected patterns
                if (patternId === currentPatternId && !(trackId === currentTrackId && sequenceIndex === currentSequenceIndex)) {
                    context.fillStyle = trackMuted ? faintHighlightColor : otherPlacementHighlightColor;
                    context.fillRect(patternXOffset, patternY, patternWidth, patternHeight);
                }

                // pattern notes
                const trackDefaultInstrument = soundData.instruments[track.instrument];
                const defaultColor = COLOR_PALETTE[trackDefaultInstrument?.color ?? DEFAULT_COLOR_INDEX];
                const scalingFactorY = (sequencerPatternHeight - SEQUENCER_NOTE_HEIGHT) / NOTES_SPECTRUM;
                Object.keys(pattern.events).forEach((eventKey: string) => {
                    const s = parseInt(eventKey);
                    const event = pattern.events[s];
                    const noteLabel = event[SoundEvent.Note];
                    if (noteLabel && s < patternSize * SUB_NOTE_RESOLUTION) {
                        const instrumentId = event[SoundEvent.Instrument];
                        const color = trackMuted
                            ? patternBackgroundColor
                            : instrumentId
                                ? COLOR_PALETTE[soundData.instruments[instrumentId].color ?? DEFAULT_COLOR_INDEX]
                                : defaultColor;
                        const noteId = NOTES_LABELS.indexOf(noteLabel);
                        const duration = event[SoundEvent.Duration]
                            ? Math.floor(event[SoundEvent.Duration] / SUB_NOTE_RESOLUTION)
                            : 1;
                        const noteX = Math.floor(s / SUB_NOTE_RESOLUTION) * sequencerNoteWidth;
                        const noteY = Math.floor((scalingFactorY * noteId)
                            - (SEQUENCER_NOTE_HEIGHT / 2)) + noteHeightOverlap;
                        const noteXOffset = patternXOffset + noteX;
                        const noteYOffset = patternY + noteY;
                        const noteWidth = duration * sequencerNoteWidth;
                        context.fillStyle = color;
                        context.fillRect(
                            noteXOffset,
                            noteYOffset,
                            noteWidth,
                            SEQUENCER_NOTE_HEIGHT
                        );

                        // note slide triangle
                        const noteSlide = event[SoundEvent.NoteSlide];
                        if (noteSlide) {
                            const noteSlideStartY = noteSlide > 0
                                ? noteYOffset
                                : noteYOffset + SEQUENCER_NOTE_HEIGHT;
                            const noteSlideEndY = noteSlideStartY - (noteSlide * scalingFactorY);
                            const path = new Path2D();
                            path.moveTo(noteXOffset, noteSlideStartY);
                            path.lineTo(noteXOffset + noteWidth, noteSlideStartY);
                            path.lineTo(noteXOffset + noteWidth, noteSlideEndY);
                            context.fill(path);
                        }
                    }
                });

                // pattern name
                context.fillStyle = patternForegroundColor;
                const patternName = patternSize >= 4
                    ? getPatternName(soundData, patternId)
                    : '…';
                context.fillText(patternName, patternXOffset + 3, patternY + 10, patternWidth - 6);
            });
        });

        // selected patterns outlines
        soundData.tracks.forEach((track, trackId) => {
            Object.keys(track.sequence).forEach(si => {
                const sequenceIndex = parseInt(si);
                if (selectedPatterns.length && selectedPatterns.includes(`${trackId}-${sequenceIndex}`)) {
                    const patternId = track.sequence[sequenceIndex];
                    const pattern = soundData.patterns[patternId];
                    if (!pattern) {
                        return;
                    }

                    const patternX = sequenceIndex * sequencerNoteWidth;
                    const patternWidth = getPatternSize(patternId) * sequencerNoteWidth - SEQUENCER_GRID_WIDTH + SELECTED_PATTERN_OUTLINE_WIDTH;

                    if ((sequencerScrollWindow.x > patternX + patternWidth) || (patternX > sequencerScrollWindow.x + sequencerScrollWindow.w)) {
                        return;
                    }

                    const patternXOffset = patternX - sequencerScrollWindow.x - (SELECTED_PATTERN_OUTLINE_WIDTH / 2);
                    const patternY = SEQUENCER_GRID_METER_HEIGHT + trackId * sequencerPatternHeight - (SELECTED_PATTERN_OUTLINE_WIDTH / 2);
                    const patternHeight = sequencerPatternHeight - SEQUENCER_GRID_WIDTH + SELECTED_PATTERN_OUTLINE_WIDTH;

                    context.strokeStyle = highlightColor;
                    context.lineWidth = SELECTED_PATTERN_OUTLINE_WIDTH;
                    context.beginPath();
                    context.moveTo(patternXOffset, patternY);
                    context.lineTo(patternXOffset + patternWidth, patternY);
                    context.lineTo(patternXOffset + patternWidth, patternY + patternHeight);
                    context.lineTo(patternXOffset, patternY + patternHeight);
                    context.lineTo(patternXOffset, patternY);
                    context.stroke();
                    context.lineWidth = 1;
                }

            });
        });

        // loop point indicator
        if (soundData.loop) {
            const loopPointX = soundData.loopPoint * sequencerNoteWidth - 0.5 - sequencerScrollWindow.x;
            context.fillStyle = hiColor;
            context.beginPath();
            context.moveTo(loopPointX, 0);
            context.lineTo(loopPointX, height);
            context.strokeStyle = hiColor;
            context.stroke();

            context.fillStyle = hiColor;
            context.font = '11px monospace';
            context.fillText('⏮', loopPointX + 1, SEQUENCER_GRID_METER_HEIGHT - 3);
        }

        // pattern draw
        if (patternDragTrackId > -1 && patternDragStartStep > -1 && patternDragEndStep > -1) {
            const defaultPatternDragEndStep = patternDragStartStep === patternDragEndStep
                ? patternDragStartStep + getBarsLength(getTimeSignatureSegments(soundData), patternDragStartStep, DEFAULT_BARS_PER_PATTERN)
                : patternDragEndStep;
            const patternDrawLeft = Math.min(patternDragStartStep, defaultPatternDragEndStep) * sequencerNoteWidth - sequencerScrollWindow.x;
            const patternDrawTop = SEQUENCER_GRID_METER_HEIGHT + patternDragTrackId * sequencerPatternHeight;
            const patternDrawHeight = sequencerPatternHeight;
            const patternDrawWidth = sequencerNoteWidth * Math.abs(patternDragStartStep - defaultPatternDragEndStep);
            context.strokeStyle = highlightColor;
            context.setLineDash([3, 2]);
            context.beginPath();
            context.moveTo(patternDrawLeft, patternDrawTop);
            context.lineTo(patternDrawLeft + patternDrawWidth, patternDrawTop);
            context.lineTo(patternDrawLeft + patternDrawWidth, patternDrawTop + patternDrawHeight);
            context.lineTo(patternDrawLeft, patternDrawTop + patternDrawHeight);
            context.lineTo(patternDrawLeft, patternDrawTop);
            context.stroke();
            context.setLineDash([]);
        }

        // patterns being moved, at the positions they would get
        if (patternGrab?.mode === 'move' && patternGrab.moved) {
            patternGrab.patterns.forEach(identifier => {
                const { trackId, sequenceIndex } = parsePatternIdentifier(identifier);
                const pattern = soundData.patterns[soundData.tracks[trackId]?.sequence[sequenceIndex]];
                if (!pattern) {
                    return;
                }
                const previewLeft = (sequenceIndex + (patternGrab.sequenceIndexOffset ?? 0)) * sequencerNoteWidth - sequencerScrollWindow.x;
                const previewTop = SEQUENCER_GRID_METER_HEIGHT + (trackId + (patternGrab.trackOffset ?? 0)) * sequencerPatternHeight;
                const previewWidth = pattern.size * sequencerNoteWidth - SEQUENCER_GRID_WIDTH;
                const previewHeight = sequencerPatternHeight - SEQUENCER_GRID_WIDTH;

                context.fillStyle = medHighlightColor;
                context.fillRect(previewLeft, previewTop, previewWidth, previewHeight);
                context.strokeStyle = highlightColor;
                context.setLineDash([3, 2]);
                context.strokeRect(previewLeft + 0.5, previewTop + 0.5, previewWidth - 1, previewHeight - 1);
                context.setLineDash([]);
            });
        }

        // select marquee
        if (marqueeStartStep > -1 && marqueeEndStep > -1 &&
            marqueeStartTrack > - 1 && marqueeEndTrack > - 1
        ) {
            const sortedMarqueeStartStep = Math.min(marqueeStartStep, marqueeEndStep);
            const sortedMarqueeEndStep = Math.max(marqueeStartStep, marqueeEndStep);
            const sortedMarqueeStartTrack = Math.min(marqueeStartTrack, marqueeEndTrack);
            const sortedMarqueeEndTrack = Math.max(marqueeStartTrack, marqueeEndTrack);
            const marqueeLeft = sortedMarqueeStartStep * sequencerNoteWidth - sequencerScrollWindow.x;
            const marqueeTop = SEQUENCER_GRID_METER_HEIGHT + sortedMarqueeStartTrack * sequencerPatternHeight;
            const marqueeHeight = (sortedMarqueeEndTrack - sortedMarqueeStartTrack + 1) * sequencerPatternHeight;
            const marqueeWidth = sequencerNoteWidth * (sortedMarqueeEndStep - sortedMarqueeStartStep + 1);

            context.fillStyle = medHighlightColor;
            context.fillRect(marqueeLeft, marqueeTop, marqueeWidth, marqueeHeight);

            context.strokeStyle = highlightColor;
            context.setLineDash([3, 2]);
            context.beginPath();
            context.moveTo(marqueeLeft, marqueeTop);
            context.lineTo(marqueeLeft + marqueeWidth, marqueeTop);
            context.lineTo(marqueeLeft + marqueeWidth, marqueeTop + marqueeHeight);
            context.lineTo(marqueeLeft, marqueeTop + marqueeHeight);
            context.lineTo(marqueeLeft, marqueeTop);
            context.stroke();
            context.setLineDash([]);
        }

        drawSongEnd(context, currentThemeType, soundData.size * sequencerNoteWidth, sequencerScrollWindow.x, width, height);
    };

    const resetPlayRange = () => {
        setPlayRangeStart(-1);
        setPlayRangeEnd(-1);
    };

    const resetRangeDrag = () => {
        setRangeDragStartStep(-1);
        setRangeDragEndStep(-1);
    };

    const resetPatternDrag = () => {
        setPatternDragTrackId(-1);
        setPatternDragStartStep(-1);
        setPatternDragEndStep(-1);
    };

    const resetMarquee = () => {
        setMarqueeStartStep(-1);
        setMarqueeEndStep(-1);
        setMarqueeStartTrack(-1);
        setMarqueeEndTrack(-1);
    };

    const handleMouseDownPlayRange = (e: MouseEvent<HTMLCanvasElement>, x: number) => {
        if (e.button === 0 && tool === SoundEditorTool.EDIT) {
            const step = getSnappedStep(Math.round(x / sequencerNoteWidth), noteSnapping, soundData);
            setRangeDragStartStep(step);
            setRangeDragEndStep(step);

            resetPlayRange();
        }
    };

    const handleMouseMovePlayRange = (e: MouseEvent<HTMLCanvasElement>) => {
        if (rangeDragStartStep > -1 && rangeDragEndStep > -1) {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left + sequencerScrollWindow.x;
            const step = getSnappedStep(Math.round(x / sequencerNoteWidth), noteSnapping, soundData);

            if (step !== rangeDragEndStep) {
                setRangeDragEndStep(step);
            }
        }
    };

    const handleMouseUpPlayRange = (e: MouseEvent<HTMLCanvasElement>, x: number) => {
        if (tool !== SoundEditorTool.EDIT) {
            return;
        }

        if (e.button === 0) {
            if (rangeDragStartStep !== -1 && rangeDragEndStep !== -1) {
                const startStep = Math.min(rangeDragStartStep, rangeDragEndStep);
                const endStep = rangeDragStartStep === rangeDragEndStep
                    ? startStep + getBarsLength(getTimeSignatureSegments(soundData), startStep, DEFAULT_BARS_PER_PATTERN)
                    : Math.max(rangeDragStartStep, rangeDragEndStep) + 1;

                setPlayRangeStart(startStep);
                setPlayRangeEnd(endStep);
                setCurrentPlayerPosition(-1);

                resetRangeDrag();
            }
        } else if (e.button === 2) {
            if (playRangeStart !== -1 && playRangeEnd !== -1) {
                resetPlayRange();
            } else {
                const step = Math.round(x / sequencerNoteWidth);
                setCurrentPlayerPosition(step);
                setPlayerSeekRequest(prev => prev + 1);
            }
        }
    };

    const handleMouseDownPatternDrag = (e: MouseEvent<HTMLCanvasElement>, trackId: number, x: number) => {
        if (e.button === 0 && tool === SoundEditorTool.EDIT) {
            if (!e.metaKey && !e.ctrlKey && !e.altKey) {
                const step = Math.round(x / sequencerNoteWidth);
                const insidePatternAtSi = getFoundPatternSequenceIndex(soundData, trackId, step);
                if (insidePatternAtSi === -1) {
                    const gridStep = getSnappedStep(Math.round(x / sequencerNoteWidth), noteSnapping, soundData);
                    setPatternDragTrackId(trackId);
                    setPatternDragStartStep(gridStep);
                    setPatternDragEndStep(gridStep);
                }
            }
        }
    };

    const handleMouseMovePatternDrag = (e: MouseEvent<HTMLCanvasElement>) => {
        if (patternDragTrackId !== -1 && patternDragStartStep !== -1 && patternDragEndStep !== -1) {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left + sequencerScrollWindow.x;
            const y = e.clientY - rect.top - SEQUENCER_GRID_METER_HEIGHT;

            const step = getSnappedStep(Math.round(x / sequencerNoteWidth), noteSnapping, soundData);
            const trackId = Math.floor(y / sequencerPatternHeight);

            if (trackId !== patternDragTrackId) {
                setPatternDragTrackId(trackId);
            }

            if (step !== patternDragEndStep) {
                setPatternDragEndStep(step);
            }
        }
    };

    const handleMouseUpPatternDrag = (e: MouseEvent<HTMLCanvasElement>) => {
        if (e.button === 0 && tool === SoundEditorTool.EDIT) {
            if (patternDragTrackId !== -1 && patternDragStartStep !== -1 && patternDragEndStep !== -1) {
                const newPatternStep = Math.min(patternDragStartStep, patternDragEndStep);
                const newPatternSize = Math.abs(patternDragStartStep - patternDragEndStep);
                addPattern(patternDragTrackId, newPatternStep, newPatternSize);
                resetPatternDrag();
            }
        }
    };

    const handleMouseUpPatternErase = (e: MouseEvent<HTMLCanvasElement>, x: number, y: number) => {
        const trackId = Math.floor((y - SEQUENCER_GRID_METER_HEIGHT) / sequencerPatternHeight);
        const sequenceIndex = Math.round(x / sequencerNoteWidth);
        const insidePatternAtSi = getFoundPatternSequenceIndex(soundData, trackId, sequenceIndex);
        const identifier = `${trackId}-${insidePatternAtSi}`;
        if (
            tool === SoundEditorTool.ERASER && e.button === 0 ||
            (e.metaKey || e.ctrlKey || e.altKey) && e.button === 2
        ) {
            removePatternsFromSequence([identifier]);
        }
    };

    // patterns get resized at their right edge, and moved anywhere else
    const getPatternHit = (x: number, y: number): PatternHit | undefined => {
        if (y < SEQUENCER_GRID_METER_HEIGHT) {
            return;
        }
        const trackId = Math.floor((y - SEQUENCER_GRID_METER_HEIGHT) / sequencerPatternHeight);
        const track = soundData.tracks[trackId];
        if (!track) {
            return;
        }
        const sequenceIndex = getFoundPatternSequenceIndex(soundData, trackId, x / sequencerNoteWidth);
        if (sequenceIndex === -1) {
            return;
        }

        const patternWidth = soundData.patterns[track.sequence[sequenceIndex]].size * sequencerNoteWidth - SEQUENCER_GRID_WIDTH;
        const patternRight = sequenceIndex * sequencerNoteWidth + patternWidth;
        if (patternWidth >= 8 && x >= patternRight - Math.min(6, patternWidth / 4)) {
            return { trackId, sequenceIndex, mode: 'size' };
        }

        return { trackId, sequenceIndex, mode: 'move' };
    };

    // with the marquee tool, only selected patterns can be grabbed, as clicking elsewhere starts a marquee
    const isGrabbable = (hit: PatternHit): boolean =>
        tool === SoundEditorTool.EDIT ||
        tool === SoundEditorTool.MARQUEE && marqueeMode === SoundEditorMarqueeMode.REPLACE &&
        selectedPatterns.includes(`${hit.trackId}-${hit.sequenceIndex}`);

    const getPatternGrabChanges = (grab: PatternGrab, x: number, y: number): PatternGrab => {
        const timeSignatureSegments = getTimeSignatureSegments(soundData);
        const deltaColumns = (x - grab.startX) / sequencerNoteWidth;
        const patterns = grab.patterns
            .map(parsePatternIdentifier)
            .map(p => ({ ...p, patternId: soundData.tracks[p.trackId]?.sequence[p.sequenceIndex] }))
            .filter(p => soundData.patterns[p.patternId] !== undefined);

        if (grab.mode === 'move') {
            // with note snapping, the grabbed pattern moves to the closest bar start, according to the time signature there
            const sequenceIndexOffset = clamp(
                noteSnapping
                    ? getNearestBarStartColumn(timeSignatureSegments, Math.round(grab.sequenceIndex + deltaColumns)) - grab.sequenceIndex
                    : Math.round(deltaColumns),
                Math.min(0, -Math.min(...patterns.map(p => p.sequenceIndex))),
                Math.max(0, soundData.size - Math.max(...patterns.map(p => p.sequenceIndex + soundData.patterns[p.patternId].size)))
            );
            const trackOffset = clamp(
                Math.round((y - grab.startY) / sequencerPatternHeight),
                -Math.min(...patterns.map(p => p.trackId)),
                soundData.tracks.length - 1 - Math.max(...patterns.map(p => p.trackId))
            );

            return { ...grab, moved: true, sequenceIndexOffset, trackOffset };
        }

        // all patterns get longer or shorter by the same amount
        const grabbedPatternId = soundData.tracks[grab.trackId].sequence[grab.sequenceIndex];
        const grabbedSize = soundData.patterns[grabbedPatternId].size;
        let newSize = Math.max(1, Math.min(Math.round(grabbedSize + deltaColumns), soundData.size - grab.sequenceIndex));
        // with note snapping, the pattern ends at the closest bar start, but spans at least one bar
        if (noteSnapping) {
            let end = getNearestBarStartColumn(timeSignatureSegments, grab.sequenceIndex + newSize);
            if (end <= grab.sequenceIndex) {
                end = getNextBarStartColumn(timeSignatureSegments, grab.sequenceIndex);
            }
            newSize = end - grab.sequenceIndex;
        }

        const sizeDelta = newSize - grabbedSize;
        const sizes: { [patternId: string]: number } = {};
        if (sizeDelta !== 0) {
            patterns.forEach(p => {
                sizes[p.patternId] = Math.max(1, soundData.patterns[p.patternId].size + sizeDelta);
            });
            sizes[grabbedPatternId] = newSize;
        }

        return { ...grab, moved: true, sizes };
    };

    const movePatterns = (grab: PatternGrab) => {
        const trackOffset = grab.trackOffset ?? 0;
        const sequenceIndexOffset = grab.sequenceIndexOffset ?? 0;
        if (trackOffset === 0 && sequenceIndexOffset === 0) {
            return;
        }

        const patterns = grab.patterns
            .map(parsePatternIdentifier)
            .filter(p => soundData.tracks[p.trackId]?.sequence[p.sequenceIndex] !== undefined);
        const updatedTracks = soundData.tracks.map((t, trackId) => ({
            ...t,
            sequence: Object.fromEntries(Object.entries(t.sequence)
                .filter(([sequenceIndex]) => !grab.patterns.includes(`${trackId}-${sequenceIndex}`))
            ),
        }));
        patterns.forEach(p => {
            updatedTracks[p.trackId + trackOffset].sequence[p.sequenceIndex + sequenceIndexOffset] =
                soundData.tracks[p.trackId].sequence[p.sequenceIndex];
        });

        updateSoundData({
            ...soundData,
            tracks: updatedTracks,
        });

        const newTrackId = grab.trackId + trackOffset;
        const newSequenceIndex = grab.sequenceIndex + sequenceIndexOffset;
        setSelectedPatterns(patterns.map(p => `${p.trackId + trackOffset}-${p.sequenceIndex + sequenceIndexOffset}`).sort());
        setCurrentSequenceIndex(newTrackId, newSequenceIndex);
        setCurrentPatternId(newTrackId, soundData.tracks[grab.trackId].sequence[grab.sequenceIndex]);
    };

    // clicking a pattern selects it and grabs it, together with all other selected patterns
    const handleMouseDownPattern = (e: MouseEvent<HTMLCanvasElement>, x: number, y: number): boolean => {
        if (e.button !== 0 || tool !== SoundEditorTool.EDIT && tool !== SoundEditorTool.MARQUEE) {
            return false;
        }
        const hit = getPatternHit(x, y);
        if (!hit || !isGrabbable(hit)) {
            return false;
        }

        const identifier = `${hit.trackId}-${hit.sequenceIndex}`;
        let patterns = selectedPatterns;
        if (tool === SoundEditorTool.EDIT) {
            if (e.metaKey || e.ctrlKey) {
                if (selectedPatterns.includes(identifier)) {
                    setSelectedPatterns(selectedPatterns.filter(sp => sp !== identifier));
                    return true;
                }
                patterns = [...selectedPatterns, identifier].sort();
            } else {
                if (hit.trackId !== currentTrackId || hit.sequenceIndex !== currentSequenceIndex) {
                    setCurrentSequenceIndex(hit.trackId, hit.sequenceIndex);
                }
                if (!selectedPatterns.includes(identifier)) {
                    patterns = [identifier];
                }
            }
            if (patterns !== selectedPatterns) {
                setSelectedPatterns(patterns);
            }
        }

        setPatternGrab({ ...hit, patterns, startX: x, startY: y });
        return true;
    };

    const handleMouseMovePattern = (e: MouseEvent<HTMLCanvasElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left + sequencerScrollWindow.x;
        const y = e.clientY - rect.top;
        if (patternGrab) {
            if (!patternGrab.moved && Math.abs(x - patternGrab.startX) < PATTERN_GRAB_THRESHOLD && Math.abs(y - patternGrab.startY) < PATTERN_GRAB_THRESHOLD) {
                return;
            }
            const updatedGrab = getPatternGrabChanges(patternGrab, x, y);
            if (!patternGrab.moved ||
                updatedGrab.trackOffset !== patternGrab.trackOffset ||
                updatedGrab.sequenceIndexOffset !== patternGrab.sequenceIndexOffset ||
                JSON.stringify(updatedGrab.sizes) !== JSON.stringify(patternGrab.sizes)
            ) {
                setPatternGrab(updatedGrab);
            }
            return;
        }

        let mode: PatternGrabMode | undefined;
        if (patternDragStartStep === -1 && marqueeStartStep === -1 && rangeDragStartStep === -1) {
            const hit = getPatternHit(x, y);
            if (hit && isGrabbable(hit)) {
                mode = hit.mode;
            }
        }
        if (mode !== hoveredPatternGrabMode) {
            setHoveredPatternGrabMode(mode);
        }
    };

    const handleMouseUpPattern = (): boolean => {
        if (!patternGrab) {
            return false;
        }

        setPatternGrab(undefined);
        if (patternGrab.moved) {
            if (patternGrab.mode === 'move') {
                movePatterns(patternGrab);
            } else if (patternGrab.sizes && Object.keys(patternGrab.sizes).length) {
                setPatternSizes(patternGrab.sizes);
            }
        }

        return true;
    };

    const handleMouseDownDragScrolling = (e: MouseEvent<HTMLCanvasElement>) => {
        if (tool === SoundEditorTool.DRAG || e.button === 1) { // Middle mouse button
            setIsDragScrolling(true);
        }
    };

    const handleMouseMoveDragScrolling = (e: MouseEvent<HTMLCanvasElement>) => {
        if (isDragScrolling) {
            if (e.movementX !== 0 || e.movementY !== 0) {
                sequencerContainerRef.current?.scrollBy({
                    left: -e.movementX,
                    top: -e.movementY,
                });
            }
        }
    };

    const handleMouseUpDragScrolling = (e: MouseEvent<HTMLCanvasElement>) => {
        if (tool === SoundEditorTool.DRAG || e.button === 1) {
            setIsDragScrolling(false);
        }
    };

    const handleMouseDownMarquee = (e: MouseEvent<HTMLCanvasElement>, trackId: number, x: number) => {
        if ((e.button === 0 && tool === SoundEditorTool.MARQUEE) || (e.button === 2 && tool !== SoundEditorTool.DRAG)) {
            const step = getSnappedStep(Math.round(x / sequencerNoteWidth), noteSnapping, soundData);
            setMarqueeStartStep(step);
            setMarqueeEndStep(step);
            setMarqueeStartTrack(trackId);
            setMarqueeEndTrack(trackId);
        }
    };

    const handleMouseMoveMarquee = (e: MouseEvent<HTMLCanvasElement>) => {
        if (marqueeStartStep > -1 && marqueeEndStep > -1 && marqueeStartTrack > - 1 && marqueeEndTrack > - 1) {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left + sequencerScrollWindow.x;
            const y = e.clientY - rect.top - SEQUENCER_GRID_METER_HEIGHT;

            const sequenceIndex = Math.round(x / sequencerNoteWidth);
            const trackId = Math.floor(y / sequencerPatternHeight);

            if (sequenceIndex !== marqueeEndStep) {
                setMarqueeEndStep(sequenceIndex);
                setMarqueeEndTrack(trackId);
            }
        }
    };

    const handleMouseUpMarquee = (e: MouseEvent<HTMLCanvasElement>, x: number, y: number) => {
        if (e.button === 0 && tool === SoundEditorTool.MARQUEE ||
            e.button === 2 && tool !== SoundEditorTool.DRAG
        ) {
            const newSelectedPatterns: string[] = [];

            if (marqueeStartStep > -1 && marqueeEndStep > -1 && marqueeStartTrack > -1 && marqueeEndTrack > -1) {
                const sortedMarqueeStartStep = Math.min(marqueeStartStep, marqueeEndStep);
                setNoteCursor(sortedMarqueeStartStep * SUB_NOTE_RESOLUTION);

                if ((marqueeStartStep !== marqueeEndStep || marqueeStartTrack !== marqueeEndTrack)) {
                    const sortedMarqueeEndStep = Math.max(marqueeStartStep, marqueeEndStep);
                    const sortedMarqueeStartTrack = Math.min(marqueeStartTrack, marqueeEndTrack);
                    const sortedMarqueeEndTrack = Math.max(marqueeStartTrack, marqueeEndTrack);

                    soundData.tracks.forEach((t, tId) => {
                        Object.keys(t.sequence).forEach(si => {
                            const siInt = parseInt(si);
                            const patternId = t.sequence[siInt];
                            const pattern = soundData.patterns[patternId];
                            if (pattern &&
                                (
                                    (siInt >= sortedMarqueeStartStep && siInt <= sortedMarqueeEndStep) ||
                                    (siInt + pattern.size >= sortedMarqueeStartStep && siInt + pattern.size <= sortedMarqueeEndStep) ||
                                    (siInt <= sortedMarqueeStartStep && siInt + pattern.size >= sortedMarqueeEndStep)
                                ) &&
                                tId >= sortedMarqueeStartTrack &&
                                tId <= sortedMarqueeEndTrack) {
                                newSelectedPatterns.push(`${tId}-${siInt}`);
                            }

                        });
                    });

                } else {
                    const trackId = Math.floor((y - SEQUENCER_GRID_METER_HEIGHT) / sequencerPatternHeight);
                    const sequenceIndex = Math.round(x / sequencerNoteWidth);
                    const insidePatternAtSi = getFoundPatternSequenceIndex(soundData, trackId, sequenceIndex);
                    if (insidePatternAtSi > -1) {
                        newSelectedPatterns.push(`${trackId}-${insidePatternAtSi}`);
                    }
                }
            }

            if (marqueeMode === SoundEditorMarqueeMode.ADD) {
                setSelectedPatterns([...selectedPatterns, ...newSelectedPatterns.filter(item => !selectedPatterns.includes(item))].sort());
            } else if (marqueeMode === SoundEditorMarqueeMode.SUBTRACT) {
                setSelectedPatterns(selectedPatterns
                    .filter(item => !newSelectedPatterns.includes(item))
                );
            } else if (marqueeMode === SoundEditorMarqueeMode.REPLACE) {
                setSelectedPatterns(newSelectedPatterns.sort());
            }

            resetMarquee();
        }
    };

    const onMouseDown = (e: MouseEvent<HTMLCanvasElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left + sequencerScrollWindow.x;
        const y = e.clientY - rect.top;
        const trackId = Math.floor((y - SEQUENCER_GRID_METER_HEIGHT) / sequencerPatternHeight);

        handleMouseDownDragScrolling(e);
        // the area after the end of the sound only allows scrolling, clicking it offers to change the sound's length
        if (x >= soundData.size * sequencerNoteWidth) {
            if (e.button === 0 && tool !== SoundEditorTool.DRAG) {
                openSongLengthDialog();
            }
            return;
        }
        if (y < SEQUENCER_GRID_METER_HEIGHT) {
            handleMouseDownPlayRange(e, x);
        } else if (!handleMouseDownPattern(e, x, y)) {
            handleMouseDownPatternDrag(e, trackId, x);
            handleMouseDownMarquee(e, trackId, x);
        }
    };

    const onMouseUp = (e: MouseEvent<HTMLCanvasElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left + sequencerScrollWindow.x;
        const y = e.clientY - rect.top;

        if (handleMouseUpPattern()) {
            handleMouseUpDragScrolling(e);
            return;
        }
        if (y < SEQUENCER_GRID_METER_HEIGHT) {
            handleMouseUpPlayRange(e, x);
        } else {
            handleMouseUpPatternErase(e, x, y);
            handleMouseUpPatternDrag(e);
            handleMouseUpMarquee(e, x, y);
        }
        handleMouseUpDragScrolling(e);
    };

    const onMouseMove = (e: MouseEvent<HTMLCanvasElement>) => {
        handleMouseMoveDragScrolling(e);
        if (e.clientX - e.currentTarget.getBoundingClientRect().left + sequencerScrollWindow.x >= soundData.size * sequencerNoteWidth) {
            return;
        }
        handleMouseMovePattern(e);
        handleMouseMoveMarquee(e);
        handleMouseMovePatternDrag(e);
        handleMouseMovePlayRange(e);
    };

    const onMouseLeave = (e: MouseEvent<HTMLCanvasElement>) => {
        setIsDragScrolling(false);
        setPatternGrab(undefined);
        setHoveredPatternGrabMode(undefined);
        resetPatternDrag();
        resetRangeDrag();
        resetMarquee();
    };

    const onDoubleClick = (e: React.MouseEvent<HTMLElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left + sequencerScrollWindow.x;
        const y = e.clientY - rect.top;

        if (y > SEQUENCER_GRID_METER_HEIGHT) {
            const trackId = Math.floor((y - SEQUENCER_GRID_METER_HEIGHT) / sequencerPatternHeight);
            const step = Math.round(x / sequencerNoteWidth);

            const insidePatternAtSi = getFoundPatternSequenceIndex(soundData, trackId, step);

            if (insidePatternAtSi > -1) {
                editCurrentPattern();
            }
        }
    };

    useEffect(() => {
        draw();
    }, [
        soundData,
        currentThemeType,
        currentTrackId,
        currentSequenceIndex,
        playRangeStart,
        playRangeEnd,
        sequencerPatternHeight,
        sequencerNoteWidth,
        sequencerScrollWindow.x,
        sequencerScrollWindow.w,
        trackSettings,
        soloTrack,
        patternDragTrackId,
        patternDragStartStep,
        patternDragEndStep,
        rangeDragStartStep,
        rangeDragEndStep,
        pianoRollScrollWindow.x,
        pianoRollScrollWindow.w,
        pianoRollNoteWidth,
        marqueeStartStep,
        marqueeEndStep,
        marqueeStartTrack,
        marqueeEndTrack,
        selectedPatterns,
        noteCursor,
        patternGrab,
    ]);

    const onKeyDown = (e: KeyboardEvent): void => {
        if (!e.repeat && e.code === 'Escape' &&
            (rangeDragStartStep !== -1 || patternDragStartStep !== -1 || marqueeStartStep !== -1 || patternGrab)) {
            resetPatternDrag();
            resetRangeDrag();
            resetMarquee();
            setPatternGrab(undefined);
        }
    };

    useEffect(() => {
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [
        rangeDragStartStep,
        patternDragStartStep,
        marqueeStartStep,
        patternGrab,
    ]);

    const patternGrabMode = patternGrab?.mode ?? hoveredPatternGrabMode;

    return (
        <StyledSequencerCanvas
            style={{
                cursor: patternGrabMode && !isDragScrolling
                    ? PATTERN_GRAB_CURSORS[patternGrabMode]
                    : getToolModeCursor(tool, isDragScrolling, marqueeMode),
            }}
            height={height}
            width={width}
            onMouseDown={onMouseDown}
            onMouseUp={onMouseUp}
            onMouseMove={onMouseMove}
            onMouseLeave={onMouseLeave}
            onDoubleClick={onDoubleClick}
            ref={canvasRef}
        />
    );
}
