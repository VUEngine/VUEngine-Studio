import { nls } from '@theia/core';
import { MusicEvent } from '../MusicEditorTypes';

export interface EventData {
    id: string
    shortId: string
    label: string
    description: string
    category: string
    defaultValue: any,
}

export interface EventMap {
    [id: string]: EventData
}

export const AVAILABLE_EVENTS: EventMap = {
    // Note
    [MusicEvent.NoteCut]: {
        id: MusicEvent.NoteCut,
        shortId: 'C',
        label: nls.localize('vuengine/musicEditor/effects/noteCut', 'Note Cut'),
        description: nls.localize(
            'vuengine/musicEditor/effects/setVolumeDescription',
            'Stops playing the current note after x ticks (0 means instantly) by setting the volume to 0.',
        ),
        category: nls.localize('vuengine/musicEditor/effects/note', 'Note'),
        defaultValue: 0,
    },

    // Volume
    [MusicEvent.Volume]: {
        id: MusicEvent.Volume,
        shortId: 'V',
        label: nls.localize('vuengine/musicEditor/effects/setVolume', 'Set Volume'),
        description: nls.localize('vuengine/musicEditor/effects/setVolumeDescription', 'Change left and right volume level for the current channel.'),
        category: nls.localize('vuengine/musicEditor/effects/volume', 'Volume'),
        defaultValue: 0xFF,
    },
    [MusicEvent.MasterVolume]: {
        id: MusicEvent.Volume,
        shortId: 'W',
        label: nls.localize('vuengine/musicEditor/effects/setMasterVolume', 'Set Master Volume'),
        description: nls.localize('vuengine/musicEditor/effects/setVolumeDescription', 'Sets volume on the envelope which acts as a master volume control.'),
        category: nls.localize('vuengine/musicEditor/effects/volume', 'Volume'),
        defaultValue: 16,
    },

    // Other
    [MusicEvent.Instrument]: {
        id: MusicEvent.Instrument,
        shortId: 'I',
        label: nls.localize('vuengine/musicEditor/effects/changeInstrument', 'Change Instrument'),
        description: nls.localize('vuengine/musicEditor/effects/changeInstrumentDescription', 'Load a different instrument for the current channel.'),
        category: nls.localize('vuengine/musicEditor/effects/other', 'Other'),
        defaultValue: 0,
    },
};
