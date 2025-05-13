import { EventsMap, NOTE_RESOLUTION, SoundEvent } from '../SoundEditorTypes';

export const getMaxNoteDuration = (events: EventsMap, note: number, patternSize: number) => {
    const patternLength = patternSize * NOTE_RESOLUTION;
    const allEventKeys = Object.keys(events);
    const noteEventKeys: string[] = [];
    allEventKeys.forEach(key => {
        const event = events[parseInt(key)];
        if (event[SoundEvent.Note] !== undefined) {
            noteEventKeys.push(key);
        }
    });
    const noteIndex = noteEventKeys.indexOf(note.toString());

    return noteEventKeys[noteIndex + 1] !== undefined
        ? parseInt(noteEventKeys[noteIndex + 1]) - note
        : patternLength - note;
};
