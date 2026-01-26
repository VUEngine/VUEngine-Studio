import { EventsMap, SoundEvent, SUB_NOTE_RESOLUTION } from '../SoundEditorTypes';

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
