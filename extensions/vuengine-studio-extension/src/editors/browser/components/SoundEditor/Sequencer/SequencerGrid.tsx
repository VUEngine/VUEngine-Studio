import { deepClone } from '@theia/core';
import chroma from 'chroma-js';
import React, { Dispatch, MouseEvent, RefObject, SetStateAction, useContext, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import { COLOR_PALETTE, DEFAULT_COLOR_INDEX } from '../../Common/PaletteColorSelect';
import { scaleCanvasAccountForDpi } from '../../Common/Utils';
import { getFoundPatternSequenceIndex, getPatternName, getSnappedStep, getToolModeCursor } from '../SoundEditor';
import { SoundEditorCommands } from '../SoundEditorCommands';
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

const StyledSequencerCanvas = styled.canvas`
    left: 0;
    position: sticky;
    z-index: 20;
`;

interface SequencerGridProps {
    soundData: SoundData
    tool: SoundEditorTool
    marqueeMode: SoundEditorMarqueeMode
    currentTrackId: number
    currentPatternId: string
    currentSequenceIndex: number
    setCurrentSequenceIndex: (trackId: number, sequenceIndex: number) => void
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
    setForcePlayerRomRebuild: Dispatch<SetStateAction<number>>
    trackSettings: TrackSettings[]
    soloTrack: number
    editCurrentPattern: () => void
    sequencerContainerRef: RefObject<HTMLDivElement>
    pianoRollScrollWindow: ScrollWindow
    pianoRollNoteWidth: number
    removePatternsFromSequence: (patterns: string[]) => void
    noteSnapping: boolean
    noteCursor: number
    stepsPerNote: number
    stepsPerBar: number
}

export default function SequencerGrid(props: SequencerGridProps): React.JSX.Element {
    const {
        soundData,
        tool, marqueeMode,
        currentTrackId,
        currentPatternId,
        currentSequenceIndex, setCurrentSequenceIndex,
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
        setForcePlayerRomRebuild,
        trackSettings,
        soloTrack,
        editCurrentPattern,
        sequencerContainerRef,
        pianoRollScrollWindow,
        pianoRollNoteWidth,
        removePatternsFromSequence,
        noteSnapping,
        noteCursor,
        stepsPerNote, stepsPerBar,
    } = props;
    const { currentThemeType, services, onCommandExecute } = useContext(EditorsContext) as EditorsContextType;
    const [isDragScrolling, setIsDragScrolling] = useState<boolean>(false);
    const [marqueeStartStep, setMarqueeStartStep] = useState<number>(-1);
    const [marqueeEndStep, setMarqueeEndStep] = useState<number>(-1);
    const [marqueeStartTrack, setMarqueeStartTrack] = useState<number>(-1);
    const [marqueeEndTrack, setMarqueeEndTrack] = useState<number>(-1);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const classNames = [];
    if (marqueeStartStep !== -1) {
        classNames.push('hasMarquee');
    }

    const height = soundData.tracks.length * sequencerPatternHeight + SEQUENCER_GRID_METER_HEIGHT;
    const width = Math.min(
        sequencerScrollWindow.w - SCROLL_BAR_WIDTH,
        soundData.size * sequencerNoteWidth
    );

    const noteHeightOverlap = (SEQUENCER_NOTE_HEIGHT - 1) / 2;

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
                ? stepsPerBar * DEFAULT_BARS_PER_PATTERN
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
        for (let x = 0; x <= soundData.size; x++) {
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
            if (x % stepsPerBar === 0) {
                context.fillStyle = hiColor;
                context.font = '9px monospace';
                if (!soundData.loop || x !== soundData.loopPoint) {
                    context.fillText((x / stepsPerBar).toString(), offset + 3, 10);
                }
                context.strokeStyle = hiColor;
                context.lineTo(offset, 0);
            } else {
                context.strokeStyle = x === soundData.size
                    ? strongColor
                    : x % stepsPerNote === 0
                        ? medColor
                        : lowColor;
                context.lineTo(offset, x % stepsPerBar ? SEQUENCER_GRID_METER_HEIGHT : 0);
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
        const noteCursorXPos = noteCursor / SUB_NOTE_RESOLUTION * sequencerNoteWidth;
        context.moveTo(noteCursorXPos, 0.5);
        context.lineTo(noteCursorXPos, height - 0.5);
        context.stroke();
        context.setLineDash([]);

        // patterns
        soundData.tracks.forEach((track, trackId) => {
            const trackMuted = trackSettings[trackId].muted || (soloTrack > -1 && soloTrack !== trackId);
            Object.keys(track.sequence).forEach(si => {
                const sequenceIndex = parseInt(si);
                const patternId = track.sequence[sequenceIndex];
                const pattern = soundData.patterns[patternId];
                if (!pattern) {
                    return;
                }

                const patternX = sequenceIndex * sequencerNoteWidth;
                const patternWidth = pattern.size * sequencerNoteWidth - SEQUENCER_GRID_WIDTH;

                if (sequencerScrollWindow.x > patternX + patternWidth || patternX > sequencerScrollWindow.x + sequencerScrollWindow.w) {
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

                // pattern border
                if (patternId === currentPatternId) {
                    context.strokeStyle = highlightColor;
                    context.beginPath();
                    context.moveTo(patternXOffset, patternY);
                    context.lineTo(patternXOffset + patternWidth, patternY);
                    context.lineTo(patternXOffset + patternWidth, patternY + patternHeight);
                    context.lineTo(patternXOffset, patternY + patternHeight);
                    context.lineTo(patternXOffset, patternY);
                    context.stroke();
                }

                // pattern notes
                const trackDefaultInstrument = soundData.instruments[track.instrument];
                const defaultColor = COLOR_PALETTE[trackDefaultInstrument?.color ?? DEFAULT_COLOR_INDEX];
                const scalingFactorY = (sequencerPatternHeight - SEQUENCER_NOTE_HEIGHT) / NOTES_SPECTRUM;
                Object.keys(pattern.events).forEach((eventKey: string) => {
                    const s = parseInt(eventKey);
                    const event = pattern.events[s];
                    const noteLabel = event[SoundEvent.Note];
                    if (noteLabel) {
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
                const patternName = pattern.size >= 4
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
                    const patternWidth = pattern.size * sequencerNoteWidth - SEQUENCER_GRID_WIDTH + SELECTED_PATTERN_OUTLINE_WIDTH;

                    if (sequencerScrollWindow.x > patternX + patternWidth || patternX > sequencerScrollWindow.x + sequencerScrollWindow.w) {
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
                ? patternDragStartStep + stepsPerBar * DEFAULT_BARS_PER_PATTERN
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
            const step = getSnappedStep(Math.round(x / sequencerNoteWidth), noteSnapping, stepsPerBar);
            setRangeDragStartStep(step);
            setRangeDragEndStep(step);

            resetPlayRange();
        }
    };

    const handleMouseMovePlayRange = (e: MouseEvent<HTMLCanvasElement>) => {
        if (rangeDragStartStep > -1 && rangeDragEndStep > -1) {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left + sequencerScrollWindow.x;
            const step = getSnappedStep(Math.round(x / sequencerNoteWidth), noteSnapping, stepsPerBar);

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
                    ? startStep + stepsPerBar * DEFAULT_BARS_PER_PATTERN
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
                setForcePlayerRomRebuild(prev => prev + 1);
            }
        }
    };

    const handleMouseDownPatternDrag = (e: MouseEvent<HTMLCanvasElement>, trackId: number, x: number) => {
        if (e.button === 0 && tool === SoundEditorTool.EDIT) {
            if (!e.metaKey && !e.ctrlKey && !e.altKey) {
                const step = Math.round(x / sequencerNoteWidth);
                const insidePatternAtSi = getFoundPatternSequenceIndex(soundData, trackId, step);
                if (insidePatternAtSi === -1) {
                    const gridStep = getSnappedStep(Math.round(x / sequencerNoteWidth), noteSnapping, stepsPerBar);
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

            const step = getSnappedStep(Math.round(x / sequencerNoteWidth), noteSnapping, stepsPerBar);
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

    const handleMouseUpPatternSelect = (e: MouseEvent<HTMLCanvasElement>, x: number, y: number) => {
        const trackId = Math.floor((y - SEQUENCER_GRID_METER_HEIGHT) / sequencerPatternHeight);
        const sequenceIndex = Math.round(x / sequencerNoteWidth);
        const insidePatternAtSi = getFoundPatternSequenceIndex(soundData, trackId, sequenceIndex);
        const identifier = `${trackId}-${insidePatternAtSi}`;
        if (
            tool === SoundEditorTool.ERASER && e.button === 0 ||
            (e.metaKey || e.ctrlKey || e.altKey) && e.button === 2
        ) {
            removePatternsFromSequence([identifier]);
        } else if (tool === SoundEditorTool.EDIT && e.button === 0) {
            if (insidePatternAtSi > -1) {
                if (e.metaKey || e.ctrlKey) {
                    if (selectedPatterns.includes(identifier)) {
                        setSelectedPatterns(selectedPatterns.filter(sp => sp !== identifier).sort());
                    } else {
                        setSelectedPatterns([...deepClone(selectedPatterns), identifier].sort());
                    }
                } else {
                    setCurrentSequenceIndex(trackId, insidePatternAtSi);
                    if (selectedPatterns.length <= 1) {
                        setSelectedPatterns([identifier]);
                    }
                }
            }
        }
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
        if (e.button === 0 && tool === SoundEditorTool.MARQUEE || e.button === 2 && tool !== SoundEditorTool.DRAG) {
            const step = getSnappedStep(Math.round(x / sequencerNoteWidth), noteSnapping, stepsPerBar);
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
                if ((marqueeStartStep !== marqueeEndStep || marqueeStartTrack !== marqueeEndTrack)) {
                    const sortedMarqueeStartStep = Math.min(marqueeStartStep, marqueeEndStep);
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
                setSelectedPatterns([...deepClone(selectedPatterns), ...newSelectedPatterns]);
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

        if (y < SEQUENCER_GRID_METER_HEIGHT) {
            handleMouseDownPlayRange(e, x);
        } else {
            handleMouseDownPatternDrag(e, trackId, x);
            handleMouseDownMarquee(e, trackId, x);
        }
        handleMouseDownDragScrolling(e);
    };

    const onMouseUp = (e: MouseEvent<HTMLCanvasElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left + sequencerScrollWindow.x;
        const y = e.clientY - rect.top;

        if (y < SEQUENCER_GRID_METER_HEIGHT) {
            handleMouseUpPlayRange(e, x);
        } else {
            handleMouseUpPatternSelect(e, x, y);
            handleMouseUpPatternDrag(e);
            handleMouseUpMarquee(e, x, y);
        }
        handleMouseUpDragScrolling(e);
    };

    const onMouseMove = (e: MouseEvent<HTMLCanvasElement>) => {
        handleMouseMoveDragScrolling(e);
        handleMouseMoveMarquee(e);
        handleMouseMovePatternDrag(e);
        handleMouseMovePlayRange(e);
    };

    const onMouseLeave = (e: MouseEvent<HTMLCanvasElement>) => {
        setIsDragScrolling(false);
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
        pianoRollScrollWindow,
        pianoRollNoteWidth,
        marqueeStartStep,
        marqueeEndStep,
        marqueeStartTrack,
        marqueeEndTrack,
        selectedPatterns,
        noteCursor,
    ]);

    const commandListener = (commandId: string): void => {
        switch (commandId) {
            case SoundEditorCommands.CANCEL_CURRENT_ACTION.id:
                resetPatternDrag();
                resetRangeDrag();
                resetMarquee();
                break;
        }
    };

    useEffect(() => {
        const disp = onCommandExecute(commandListener);
        return () => disp.dispose();
    }, []);

    return (
        <StyledSequencerCanvas
            className={classNames.join(' ')}
            style={{
                cursor: getToolModeCursor(tool, isDragScrolling),
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
