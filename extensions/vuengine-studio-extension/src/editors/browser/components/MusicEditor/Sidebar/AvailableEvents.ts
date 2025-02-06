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
        label: nls.localize('vuengine/editors/music/effects/noteCut', 'Note Cut'),
        description: nls.localize(
            'vuengine/editors/music/effects/setVolumeDescription',
            'Stops playing the current note after x ticks (0 means instantly) by setting the volume to 0.',
        ),
        category: nls.localize('vuengine/editors/music/effects/note', 'Note'),
        defaultValue: 0x00,
    },

    // Pitch
    [MusicEvent.Arpeggio]: {
        id: MusicEvent.Arpeggio,
        shortId: '0',
        label: nls.localize('vuengine/editors/music/effects/arpeggio', 'Arpeggio'),
        description: nls.localize(
            'vuengine/editors/music/effects/arpeggioDescription',
            'Simulates a three-note chord by playing the respective notes in super fast progression.'
        ),
        category: nls.localize('vuengine/editors/music/effects/pitch', 'Pitch'),
        defaultValue: 0x00,
    },
    [MusicEvent.PortamentoUp]: {
        id: MusicEvent.PortamentoUp,
        shortId: '1',
        label: nls.localize('vuengine/editors/music/effects/PortamentoUp', 'Portamento Up'),
        description: nls.localize(
            'vuengine/editors/music/effects/PortamentoUpDescription',
            'Increases pitch by the specified amount of units per tick.'
        ),
        category: nls.localize('vuengine/editors/music/effects/pitch', 'Pitch'),
        defaultValue: 0x04,
    },
    [MusicEvent.PortamentoDown]: {
        id: MusicEvent.PortamentoDown,
        shortId: '2',
        label: nls.localize('vuengine/editors/music/effects/PortamentoDown', 'Portamento Down'),
        description: nls.localize(
            'vuengine/editors/music/effects/PortamentoDownDescription',
            'Decreases pitch by the specified amount of units per tick.'
        ),
        category: nls.localize('vuengine/editors/music/effects/pitch', 'Pitch'),
        defaultValue: 0x04,
    },
    [MusicEvent.TonePortamento]: {
        id: MusicEvent.TonePortamento,
        shortId: '3',
        label: nls.localize('vuengine/editors/music/effects/tonePortamento', 'Tone Portamento'),
        description: nls.localize(
            'vuengine/editors/music/effects/tonePortamentoDescription',
            "Slides pitch from the last played note towards this tick's note by the specified amount of units per tick. "
        ),
        category: nls.localize('vuengine/editors/music/effects/pitch', 'Pitch'),
        defaultValue: 0x04,
    },
    [MusicEvent.Vibrato]: {
        id: MusicEvent.Vibrato,
        shortId: '4',
        label: nls.localize('vuengine/editors/music/effects/vibrato', 'Vibrato'),
        description: nls.localize(
            'vuengine/editors/music/effects/vibratoDescription',
            'Alternate pitch rapidly between the current note and the specified note.'
        ),
        category: nls.localize('vuengine/editors/music/effects/pitch', 'Pitch'),
        defaultValue: 0x04,
    },

    // Volume
    [MusicEvent.Volume]: {
        id: MusicEvent.Volume,
        shortId: 'V',
        label: nls.localize('vuengine/editors/music/effects/setVolume', 'Set Volume'),
        description: nls.localize(
            'vuengine/editors/music/effects/setVolumeDescription',
            'Change left and right volume levels for the current channel.'
        ),
        category: nls.localize('vuengine/editors/music/effects/volume', 'Volume'),
        defaultValue: 0xFF,
    },
    [MusicEvent.MasterVolume]: {
        id: MusicEvent.MasterVolume,
        shortId: 'W',
        label: nls.localize('vuengine/editors/music/effects/setMasterVolume', 'Set Master Volume'),
        description: nls.localize(
            'vuengine/editors/music/effects/setVolumeDescription',
            'Sets volume on the envelope which acts as a master volume control.'
        ),
        category: nls.localize('vuengine/editors/music/effects/volume', 'Volume'),
        defaultValue: 0x0F,
    },
    [MusicEvent.VolumeSlide]: {
        id: MusicEvent.VolumeSlide,
        shortId: 'A',
        label: nls.localize('vuengine/editors/music/effects/volumeSlide', 'Volume Slide'),
        description: nls.localize(
            'vuengine/editors/music/effects/volumeSlideDescription',
            'Increases or decreases volume by the specified amount every tick.'
        ),
        category: nls.localize('vuengine/editors/music/effects/volume', 'Volume'),
        defaultValue: 0x00,
    },

    // Other
    [MusicEvent.Instrument]: {
        id: MusicEvent.Instrument,
        shortId: 'I',
        label: nls.localize('vuengine/editors/music/effects/changeInstrument', 'Change Instrument'),
        description: nls.localize(
            'vuengine/editors/music/effects/changeInstrumentDescription',
            'Load a different instrument for the current channel.'
        ),
        category: nls.localize('vuengine/editors/music/effects/other', 'Other'),
        defaultValue: 0x00,
    },
};
