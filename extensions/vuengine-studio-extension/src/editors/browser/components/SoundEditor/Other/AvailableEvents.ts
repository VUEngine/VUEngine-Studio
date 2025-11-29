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
    /*
    // Pitch
    [SoundEvent.Arpeggio]: {
        id: SoundEvent.Arpeggio,
        shortId: '0',
        label: nls.localize('vuengine/editors/sound/effects/arpeggio', 'Arpeggio'),
        description: nls.localize(
            'vuengine/editors/sound/effects/arpeggioDescription',
            'Simulates a three-note chord by playing the respective notes in super fast progression.'
        ),
        category: nls.localize('vuengine/editors/sound/effects/pitch', 'Pitch'),
        defaultValue: 0x00,
    },
    [SoundEvent.PortamentoUp]: {
        id: SoundEvent.Portamento,
        shortId: '1',
        label: nls.localize('vuengine/editors/sound/effects/Portamento', 'Portamento'),
        description: nls.localize(
            'vuengine/editors/sound/effects/PortamentoDescription',
            'Increases or decreases pitch by the specified amount of units per tick.'
        ),
        category: nls.localize('vuengine/editors/sound/effects/pitch', 'Pitch'),
        defaultValue: 0,
    },
    [SoundEvent.TonePortamento]: {
        id: SoundEvent.TonePortamento,
        shortId: '3',
        label: nls.localize('vuengine/editors/sound/effects/tonePortamento', 'Tone Portamento'),
        description: nls.localize(
            'vuengine/editors/sound/effects/tonePortamentoDescription',
            "Slides pitch from the last played note towards this tick's note by the specified amount of units per tick. "
        ),
        category: nls.localize('vuengine/editors/sound/effects/pitch', 'Pitch'),
        defaultValue: 0x04,
    },
    [SoundEvent.Vibrato]: {
        id: SoundEvent.Vibrato,
        shortId: '4',
        label: nls.localize('vuengine/editors/sound/effects/vibrato', 'Vibrato'),
        description: nls.localize(
            'vuengine/editors/sound/effects/vibratoDescription',
            'Alternate pitch rapidly between the current note and the specified note.'
        ),
        category: nls.localize('vuengine/editors/sound/effects/pitch', 'Pitch'),
        defaultValue: 0x04,
    },

    // Volume
    [SoundEvent.VolumeSlide]: {
        id: SoundEvent.VolumeSlide,
        shortId: 'A',
        label: nls.localize('vuengine/editors/sound/effects/volumeSlide', 'Volume Slide'),
        description: nls.localize(
            'vuengine/editors/sound/effects/volumeSlideDescription',
            'Increases or decreases volume by the specified amount every tick.'
        ),
        category: nls.localize('vuengine/editors/sound/effects/volume', 'Volume'),
        defaultValue: 0x00,
    },
    */
};
