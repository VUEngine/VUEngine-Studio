import { deepClone } from '@theia/core';
import { sortObjectByKeys } from '../../Common/Utils';
import { EventsMap, NOTES_LABELS, NOTES_SPECTRUM, PatternConfig, SoundData, SoundEvent, SUB_NOTE_RESOLUTION } from '../SoundEditorTypes';

// a pattern placed in a track, with its steps counted from the start of the sound. It ends where the next one starts.
export interface PatternPlacement {
    sequenceIndex: number
    patternId: string
    pattern: PatternConfig
    startStep: number
    endStep: number
}

export const getPatternPlacements = (soundData: SoundData, trackId: number): PatternPlacement[] => {
    const track = soundData.tracks[trackId];
    if (!track) {
        return [];
    }

    const sequenceIndexes = Object.keys(track.sequence).map(si => parseInt(si)).sort((a, b) => a - b);
    const result: PatternPlacement[] = [];
    sequenceIndexes.forEach((sequenceIndex, i) => {
        const patternId = track.sequence[sequenceIndex];
        const pattern = soundData.patterns[patternId];
        if (!pattern) {
            return;
        }
        result.push({
            sequenceIndex,
            patternId,
            pattern,
            startStep: sequenceIndex * SUB_NOTE_RESOLUTION,
            endStep: Math.min(sequenceIndex + pattern.size, sequenceIndexes[i + 1] ?? Infinity) * SUB_NOTE_RESOLUTION,
        });
    });

    return result;
};

export const getPatternPlacementAt = (placements: PatternPlacement[], step: number): PatternPlacement | undefined =>
    placements.find(p => step >= p.startStep && step < p.endStep);

// the events of all of a track's patterns, by step from the start of the sound
export const getTrackStepEvents = (placements: PatternPlacement[]): EventsMap => {
    const result: EventsMap = {};
    placements.forEach(p => {
        Object.keys(p.pattern.events).forEach(s => {
            const step = p.startStep + parseInt(s);
            if (step < p.endStep) {
                result[step] = p.pattern.events[parseInt(s)];
            }
        });
    });

    return result;
};

// distributes changes, by step from the start of the sound, to the patterns they fall into, by pattern id and relative step.
// Changes outside of all patterns get dropped.
export const getPatternChanges = (placements: PatternPlacement[], changes: EventsMap): Record<string, EventsMap> => {
    const result: Record<string, EventsMap> = {};
    Object.keys(changes).map(s => parseInt(s)).sort((a, b) => a - b).forEach(step => {
        const placement = getPatternPlacementAt(placements, step);
        if (!placement) {
            return;
        }
        result[placement.patternId] = {
            ...result[placement.patternId],
            [step - placement.startStep]: changes[step],
        };
    });

    return result;
};

// notes, by step from the start of the sound, that start in a pattern, with their durations capped at its end
export const fitNotesToPatterns = (placements: PatternPlacement[], notes: EventsMap): EventsMap => {
    const result: EventsMap = {};
    Object.keys(notes).map(s => parseInt(s)).forEach(step => {
        const placement = getPatternPlacementAt(placements, step);
        if (!placement) {
            return;
        }
        const duration = notes[step][SoundEvent.Duration];
        result[step] = duration !== undefined && step + duration > placement.endStep
            ? { ...notes[step], [SoundEvent.Duration]: placement.endStep - step }
            : notes[step];
    });

    return result;
};

const NOTE_DEPENDENT_EVENTS = [
    SoundEvent.Duration,
    SoundEvent.Instrument,
    SoundEvent.NoteSlide,
    SoundEvent.NoteSlideSteps,
];

// a pattern's events with the given changes applied. Empty changes remove the step's note, but keep its other events,
// changes with undefined values remove these events.
export const getUpdatedPatternEvents = (pattern: PatternConfig, notes: EventsMap, trackInstrumentId: string | undefined): EventsMap => {
    let updatedEvents: EventsMap = sortObjectByKeys(deepClone(pattern.events));

    const removeStep = (stepToRemove: number) => {
        updatedEvents = Object.fromEntries(
            Object.entries({ ...updatedEvents })
                .filter(([s, e]) => parseInt(s) !== stepToRemove)
        );
    };

    const removeNoteFromEvents = (stepToRemove: number) => {
        if (updatedEvents[stepToRemove] === undefined) {
            return;
        }

        // remove all note-related events
        updatedEvents[stepToRemove] = Object.fromEntries(
            Object.entries({ ...updatedEvents[stepToRemove] })
                .filter(([e, v]) => e !== SoundEvent.Note && !NOTE_DEPENDENT_EVENTS.includes(e as SoundEvent))
        );

        // if no events remain, remove entirely
        if (Object.keys(updatedEvents[stepToRemove]).length === 0) {
            removeStep(stepToRemove);
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
                ...pattern.events[stepInt] ?? {},
                ...notes[stepInt],
            };

            // remove explicit default instrument
            if (updatedEvents[stepInt][SoundEvent.Instrument] !== undefined && updatedEvents[stepInt][SoundEvent.Instrument] === trackInstrumentId) {
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
                        .filter(([e, v]) => !NOTE_DEPENDENT_EVENTS.includes(e as SoundEvent))
                );
            } else if (updatedEvents[stepInt][SoundEvent.NoteSlide] === undefined) {
                delete updatedEvents[stepInt][SoundEvent.NoteSlideSteps];
            }

            if (Object.keys(updatedEvents[stepInt]).length === 0) {
                // if no events remain, remove entirely
                removeStep(stepInt);
            } else {
                // ...otherwise ensure clean key order
                updatedEvents[stepInt] = sortObjectByKeys(updatedEvents[stepInt]);
            }
        }
    });

    // cap all note durations at the next note, other events like volume changes do not end notes
    let prevStep = -1;
    [
        ...Object.keys(updatedEvents).filter(step => updatedEvents[parseInt(step)][SoundEvent.Note] !== undefined),
        (pattern.size * SUB_NOTE_RESOLUTION).toString(), // pattern size is last note's limit
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
    Object.keys(updatedEvents).forEach(step => {
        const stepEvents = updatedEvents[parseInt(step)];
        if (stepEvents[SoundEvent.NoteSlide] !== undefined && stepEvents[SoundEvent.Note] !== undefined) {
            const noteId = NOTES_LABELS.indexOf(stepEvents[SoundEvent.Note]);
            const noteSlide = stepEvents[SoundEvent.NoteSlide];
            if (noteId - noteSlide >= NOTES_SPECTRUM) {
                stepEvents[SoundEvent.NoteSlide] = noteId - NOTES_SPECTRUM + 1;
            } else if (noteId - noteSlide <= 0) {
                stepEvents[SoundEvent.NoteSlide] = noteId;
            }
        }
    });

    return updatedEvents;
};
