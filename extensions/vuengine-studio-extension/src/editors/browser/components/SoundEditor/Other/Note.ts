import { EventsMap, NOTES_LABELS, NOTES_SPECTRUM, SoundEvent, SoundEventMap, SUB_NOTE_RESOLUTION } from '../SoundEditorTypes';

export const getMaxNoteDuration = (events: EventsMap, step: number, patternSize: number) => {
    const allEventKeys = Object.keys(events);
    const noteEventKeys: string[] = [];
    allEventKeys.forEach(key => {
        const event = events[parseInt(key)];
        if (event[SoundEvent.Note] !== undefined) {
            noteEventKeys.push(key);
        }
    });
    const noteIndex = noteEventKeys.indexOf(step.toString());

    return noteIndex > -1 && noteEventKeys[noteIndex + 1] !== undefined
        ? parseInt(noteEventKeys[noteIndex + 1]) - step
        : patternSize * SUB_NOTE_RESOLUTION - step;
};

// the events which belong to a note, and move and get copied with it, unlike effects on the same step
export const NOTE_EVENTS = [
    SoundEvent.Note,
    SoundEvent.Duration,
    SoundEvent.Instrument,
    SoundEvent.NoteSlide,
    SoundEvent.NoteSlideSteps,
];

const getCompleteNoteEvents = (events: SoundEventMap, note: string): SoundEventMap => ({
    ...Object.fromEntries(NOTE_EVENTS.map(eventType => [eventType, events[eventType]])),
    [SoundEvent.Note]: note,
});

export const getNoteEvents = (events: SoundEventMap): SoundEventMap =>
    Object.fromEntries(NOTE_EVENTS.filter(eventType => events[eventType] !== undefined).map(eventType => [eventType, events[eventType]]));

export const getMovedNotes = (events: EventsMap, steps: number[], patternSize: number, stepOffset: number, noteOffset: number): EventsMap => {
    const result: EventsMap = {};
    steps.forEach(step => {
        const noteLabel = events[step]?.[SoundEvent.Note];
        if (noteLabel === undefined) {
            return;
        }
        const newStep = step + stepOffset;
        const newNoteId = NOTES_LABELS.indexOf(noteLabel) + noteOffset;
        if (newStep >= 0 && newStep < patternSize * SUB_NOTE_RESOLUTION && newNoteId >= 0 && newNoteId < NOTES_SPECTRUM) {
            result[newStep] = getCompleteNoteEvents(events[step], NOTES_LABELS[newNoteId]);
        }
    });

    return result;
};

export const getNoteMoveChanges = (events: EventsMap, steps: number[], patternSize: number, stepOffset: number, noteOffset: number): EventsMap => ({
    ...Object.fromEntries(steps.filter(step => events[step]?.[SoundEvent.Note] !== undefined).map(step => [step, {}])),
    ...getMovedNotes(events, steps, patternSize, stepOffset, noteOffset),
});

export const getPastedNotes = (clipboard: EventsMap, patternSize: number, step: number, noteId: number): EventsMap => {
    const noteIds = Object.values(clipboard).map(events => NOTES_LABELS.indexOf(events[SoundEvent.Note]));
    const anchorNoteId = NOTES_LABELS.indexOf(clipboard[0]?.[SoundEvent.Note]);
    if (anchorNoteId === -1) {
        return {};
    }
    const noteOffset = Math.min(
        Math.max(noteId - anchorNoteId, -Math.min(...noteIds)),
        NOTES_SPECTRUM - 1 - Math.max(...noteIds)
    );
    const stepOffset = Math.max(0, step);

    return getMovedNotes(clipboard, Object.keys(clipboard).map(s => parseInt(s)), patternSize, stepOffset, noteOffset);
};

export const getCopiedNotes = (events: EventsMap, steps: number[]): EventsMap => {
    const noteSteps = steps.filter(step => events[step]?.[SoundEvent.Note] !== undefined).sort((a, b) => a - b);

    return Object.fromEntries(noteSteps.map(step => [step - noteSteps[0], getNoteEvents(events[step])]));
};
