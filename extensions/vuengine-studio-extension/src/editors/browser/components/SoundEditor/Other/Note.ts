import { BAR_NOTE_RESOLUTION, EventsMap, SEQUENCER_RESOLUTION, SoundEvent } from '../SoundEditorTypes';

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

    return noteEventKeys[noteIndex + 1] !== undefined
        ? parseInt(noteEventKeys[noteIndex + 1]) - step
        : patternSize * BAR_NOTE_RESOLUTION / SEQUENCER_RESOLUTION - step;
};
