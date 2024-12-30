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
        defaultValue: 0x00,
    },

    // Pitch
    [MusicEvent.Arpeggio]: {
        id: MusicEvent.Arpeggio,
        shortId: '0',
        label: nls.localize('vuengine/musicEditor/effects/arpeggio', 'Arpeggio'),
        description: nls.localize(
            'vuengine/musicEditor/effects/arpeggioDescription',
            'Simulates a three-note chord by playing the respective notes in super fast progression.'
        ),
        category: nls.localize('vuengine/musicEditor/effects/pitch', 'Pitch'),
        defaultValue: 0x00,
    },
    [MusicEvent.PortamentoUp]: {
        id: MusicEvent.PortamentoUp,
        shortId: '1',
        label: nls.localize('vuengine/musicEditor/effects/PortamentoUp', 'Portamento Up'),
        description: nls.localize(
            'vuengine/musicEditor/effects/PortamentoUpDescription',
            'Increases pitch by the specified amount of units per tick.'
        ),
        category: nls.localize('vuengine/musicEditor/effects/pitch', 'Pitch'),
        defaultValue: 0x04,
    },
    [MusicEvent.PortamentoDown]: {
        id: MusicEvent.PortamentoDown,
        shortId: '2',
        label: nls.localize('vuengine/musicEditor/effects/PortamentoDown', 'Portamento Down'),
        description: nls.localize(
            'vuengine/musicEditor/effects/PortamentoDownDescription',
            'Decreases pitch by the specified amount of units per tick.'
        ),
        category: nls.localize('vuengine/musicEditor/effects/pitch', 'Pitch'),
        defaultValue: 0x04,
    },
    [MusicEvent.TonePortamento]: {
        id: MusicEvent.TonePortamento,
        shortId: '3',
        label: nls.localize('vuengine/musicEditor/effects/tonePortamento', 'Tone Portamento'),
        description: nls.localize(
            'vuengine/musicEditor/effects/tonePortamentoDescription',
            "Slides pitch from the last played note towards this tick's note by the specified amount of units per tick. "
        ),
        category: nls.localize('vuengine/musicEditor/effects/pitch', 'Pitch'),
        defaultValue: 0x04,
    },
    [MusicEvent.Vibrato]: {
        id: MusicEvent.Vibrato,
        shortId: '4',
        label: nls.localize('vuengine/musicEditor/effects/vibrato', 'Vibrato'),
        description: nls.localize(
            'vuengine/musicEditor/effects/vibratoDescription',
            'Alternate pitch rapidly between the current note and the specified note.'
        ),
        category: nls.localize('vuengine/musicEditor/effects/pitch', 'Pitch'),
        defaultValue: 0x04,
    },

    // Volume
    [MusicEvent.Volume]: {
        id: MusicEvent.Volume,
        shortId: 'V',
        label: nls.localize('vuengine/musicEditor/effects/setVolume', 'Set Volume'),
        description: nls.localize(
            'vuengine/musicEditor/effects/setVolumeDescription',
            'Change left and right volume levels for the current channel.'
        ),
        category: nls.localize('vuengine/musicEditor/effects/volume', 'Volume'),
        defaultValue: 0xFF,
    },
    [MusicEvent.MasterVolume]: {
        id: MusicEvent.MasterVolume,
        shortId: 'W',
        label: nls.localize('vuengine/musicEditor/effects/setMasterVolume', 'Set Master Volume'),
        description: nls.localize(
            'vuengine/musicEditor/effects/setVolumeDescription',
            'Sets volume on the envelope which acts as a master volume control.'
        ),
        category: nls.localize('vuengine/musicEditor/effects/volume', 'Volume'),
        defaultValue: 0x0F,
    },
    [MusicEvent.VolumeSlide]: {
        id: MusicEvent.VolumeSlide,
        shortId: 'A',
        label: nls.localize('vuengine/musicEditor/effects/volumeSlide', 'Volume Slide'),
        description: nls.localize(
            'vuengine/musicEditor/effects/volumeSlideDescription',
            'Increases or decreases volume by the specified amount every tick.'
        ),
        category: nls.localize('vuengine/musicEditor/effects/volume', 'Volume'),
        defaultValue: 0x00,
    },

    // Other
    [MusicEvent.Instrument]: {
        id: MusicEvent.Instrument,
        shortId: 'I',
        label: nls.localize('vuengine/musicEditor/effects/changeInstrument', 'Change Instrument'),
        description: nls.localize(
            'vuengine/musicEditor/effects/changeInstrumentDescription',
            'Load a different instrument for the current channel.'
        ),
        category: nls.localize('vuengine/musicEditor/effects/other', 'Other'),
        defaultValue: 0x00,
    },
};
