import { NOTE_RESOLUTION, SoundData, SoundEvent, SUB_NOTE_RESOLUTION } from '../SoundEditorTypes';

export const TIME_SIGNATURE_DEFAULT = '4/4';
export const TIME_SIGNATURE_BEATS_MIN = 1;
export const TIME_SIGNATURE_BEATS_MAX = NOTE_RESOLUTION;
export const TIME_SIGNATURE_BEAT_UNITS = [1, 2, 4, 8, 16];

// a part of the sound with the same time signature, in columns (i.e. 1/16 notes)
export interface TimeSignatureSegment {
    startColumn: number
    stepsPerBeat: number
    stepsPerBar: number
    firstBar: number
}

export interface GridLine {
    isBarStart: boolean
    isBeatStart: boolean
    bar: number
}

export const parseTimeSignature = (timeSignature: string): { beats: number, beatUnit: number } => {
    const [beats, beatUnit] = (timeSignature ?? TIME_SIGNATURE_DEFAULT).split('/').map(v => parseInt(v));

    return {
        beats: beats > 0 ? beats : 4,
        beatUnit: beatUnit > 0 ? beatUnit : 4,
    };
};

// the sound's base time signature, which time signature events change from their column on
export const getTimeSignatureSegments = (soundData: SoundData): TimeSignatureSegment[] => {
    const changes: Record<number, string> = {
        0: soundData.timeSignature?.[0] ?? TIME_SIGNATURE_DEFAULT,
    };
    Object.entries(soundData.events ?? {}).forEach(([step, events]) => {
        if (events[SoundEvent.TimeSignature] !== undefined) {
            changes[Math.floor(parseInt(step) / SUB_NOTE_RESOLUTION)] = events[SoundEvent.TimeSignature];
        }
    });

    const result: TimeSignatureSegment[] = [];
    Object.keys(changes).map(c => parseInt(c)).sort((a, b) => a - b).forEach(startColumn => {
        const { beats, beatUnit } = parseTimeSignature(changes[startColumn]);
        const stepsPerBeatUnit = Math.max(1, NOTE_RESOLUTION / beatUnit);
        // compound time signatures like 6/8, 9/8 or 12/8 are counted in beats of three beat units each
        const isCompound = beatUnit >= 8 && beats > 3 && beats % 3 === 0;
        const stepsPerBeat = isCompound ? 3 * stepsPerBeatUnit : stepsPerBeatUnit;
        // a change starts a new bar, even if it cuts the previous one short
        const previous = result[result.length - 1];
        const firstBar = previous
            ? previous.firstBar + Math.ceil((startColumn - previous.startColumn) / previous.stepsPerBar)
            : 0;
        result.push({
            startColumn,
            stepsPerBeat,
            stepsPerBar: beats * stepsPerBeatUnit,
            firstBar,
        });
    });

    return result;
};

const getSegmentAt = (segments: TimeSignatureSegment[], column: number): TimeSignatureSegment => {
    let segment = segments[0];
    for (const s of segments) {
        if (s.startColumn > column) {
            break;
        }
        segment = s;
    }

    return segment;
};

// whether a bar and/or a beat starts at the given column
export const getGridLine = (segments: TimeSignatureSegment[], column: number): GridLine => {
    const segment = getSegmentAt(segments, column);
    const relativeColumn = column - segment.startColumn;

    return {
        isBarStart: relativeColumn % segment.stepsPerBar === 0,
        isBeatStart: relativeColumn % segment.stepsPerBeat === 0,
        bar: segment.firstBar + Math.floor(relativeColumn / segment.stepsPerBar),
    };
};

// the lengths of a beat and a bar at the given column
export const getTimeSignatureAt = (segments: TimeSignatureSegment[], column: number): { stepsPerBeat: number, stepsPerBar: number } => {
    const { stepsPerBeat, stepsPerBar } = getSegmentAt(segments, column);

    return { stepsPerBeat, stepsPerBar };
};

// the start of the bar the given column lies in
export const getBarStartColumn = (segments: TimeSignatureSegment[], column: number): number => {
    const segment = getSegmentAt(segments, column);

    return segment.startColumn + Math.floor((column - segment.startColumn) / segment.stepsPerBar) * segment.stepsPerBar;
};

// the start of the bar after the one the given column lies in, which a time signature change might bring forward
export const getNextBarStartColumn = (segments: TimeSignatureSegment[], column: number): number => {
    const nextBarStart = getBarStartColumn(segments, column) + getSegmentAt(segments, column).stepsPerBar;
    const nextSegment = segments.find(s => s.startColumn > column);

    return nextSegment && nextSegment.startColumn < nextBarStart
        ? nextSegment.startColumn
        : nextBarStart;
};

// the start of the bar closest to the given column
export const getNearestBarStartColumn = (segments: TimeSignatureSegment[], column: number): number => {
    const barStart = getBarStartColumn(segments, column);
    const nextBarStart = getNextBarStartColumn(segments, column);

    return column - barStart <= nextBarStart - column ? barStart : nextBarStart;
};

// the number of columns the given number of bars take, starting at the given column
export const getBarsLength = (segments: TimeSignatureSegment[], column: number, bars: number): number => {
    let end = column;
    for (let i = 0; i < bars; i++) {
        end = getNextBarStartColumn(segments, end);
    }

    return end - column;
};
