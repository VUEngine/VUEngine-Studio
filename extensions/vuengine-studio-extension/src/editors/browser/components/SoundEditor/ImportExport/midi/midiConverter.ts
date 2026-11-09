import { MidiData } from 'midi-file';
import { VsuEnvelopeDirection } from '../../Emulator/VsuTypes';
import { EventsMap, SoundData, SoundEditorTrackType, SoundEvent, SUB_NOTE_RESOLUTION } from '../../SoundEditorTypes';
import { DEFAULT_WAVEFORM, WAVEFORM_PRESETS } from '../../Waveforms/WaveFormPresets';
import {
    addTrack,
    createInstrument,
    createSoundData,
    DEFAULT_IMPORT_ENVELOPE,
    getNoteLabel,
    getNoteSlide,
    getTempo,
    getUniformPatternSlots,
    getVolume,
    newInstrumentId,
    setTempoAtColumn,
    setTimeSignatureAtColumn
} from '../importHelpers';

// MIDI files have no notion of channels that play one note at a time. Each channel of each track gets split into voices, which
// play one note at a time, and each voice becomes a track. Drums, on MIDI channel 10, become noise tracks.

const DRUM_CHANNEL = 9;
const DEFAULT_TICKS_PER_BEAT = 480;
const DEFAULT_MICROSECONDS_PER_BEAT = 500000;
const MIDI_VELOCITY_MAX = 127;
const MIDI_CONTROLLER_MAX = 127;
const SIXTEENTHS_PER_BEAT = 4;
const CONTROLLER_DATA_ENTRY = 6;
const CONTROLLER_VOLUME = 7;
const CONTROLLER_EXPRESSION = 11;
const CONTROLLER_RPN_LSB = 100;
const CONTROLLER_RPN_MSB = 101;
const PITCH_BEND_MAX = 8192;
const PITCH_BEND_RANGE_DEFAULT = 2;
const CHANNEL_VOLUME_DEFAULT = 100;
// bends get smooth slides
const BEND_SLIDE_STEPS = 25;

type ControlType = 'volume' | 'expression' | 'bend';

interface MidiNote {
    start: number
    end: number
    note: number
    velocity: number
    program: number
}

const getPreset = (name: string): number[] => WAVEFORM_PRESETS.find(p => p.name === name)?.values ?? DEFAULT_WAVEFORM;

// a waveform for each family of eight General MIDI programs
const PROGRAM_FAMILY_WAVEFORMS = [
    'Piano', // piano
    'Glocken', // chromatic percussion
    'Organ', // organ
    'Saw Square', // guitar
    'Square', // bass
    'Saw', // strings
    'Saw', // ensemble
    'Saw', // brass
    'Pulse (25%)', // reed
    'Sine', // pipe
    'Pulse (50%)', // synth lead
    'Sine Plus', // synth pad
    'Square Plus', // synth effects
    'Roland', // ethnic
    'Glocken', // percussive
    'Pulse (12.5%)', // sound effects
];
const PROGRAM_FAMILY_NAMES = [
    'Piano', 'Chromatic Percussion', 'Organ', 'Guitar', 'Bass', 'Strings', 'Ensemble', 'Brass',
    'Reed', 'Pipe', 'Synth Lead', 'Synth Pad', 'Synth Effects', 'Ethnic', 'Percussive', 'Sound Effects',
];

// the noise frequencies, as notes, that drums of the General MIDI percussion key map get
const getDrumNote = (key: number): string => {
    if (key === 35 || key === 36) {
        return 'C3'; // bass drums
    } else if (key >= 37 && key <= 40) {
        return 'A5'; // snares and claps
    } else if ([41, 43, 45, 47, 48, 50].includes(key)) {
        return getNoteLabel(key + 12); // toms, by their pitch
    } else if ([42, 44, 46].includes(key)) {
        return 'C8'; // hi-hats
    } else if ([49, 51, 52, 53, 55, 57, 59].includes(key)) {
        return 'F7'; // cymbals
    }

    return 'C6';
};

// which drums take precedence when several play at once, as the VSU has a single noise channel
const getDrumPriority = (key: number): number => {
    if (key === 35 || key === 36) {
        return 0;
    } else if (key >= 37 && key <= 40) {
        return 1;
    } else if ([41, 43, 45, 47, 48, 50].includes(key)) {
        return 2;
    } else if ([49, 51, 52, 53, 55, 57, 59].includes(key)) {
        return 3;
    } else if ([42, 44, 46].includes(key)) {
        return 4;
    }

    return 5;
};

const DRUM_ENVELOPE = {
    ...DEFAULT_IMPORT_ENVELOPE,
    enabled: true,
    direction: VsuEnvelopeDirection.Decay,
    stepTime: 1,
};

export const convertMidiSong = (midi: MidiData): SoundData => {
    const ticksPerBeat = midi.header.ticksPerBeat ?? DEFAULT_TICKS_PER_BEAT;
    const toStep = (tick: number) => Math.round(tick * SIXTEENTHS_PER_BEAT * SUB_NOTE_RESOLUTION / ticksPerBeat);

    const tempos: { tick: number, microsecondsPerBeat: number }[] = [];
    const timeSignatures: { tick: number, timeSignature: string }[] = [];
    const programChanges: { tick: number, channel: number, program: number }[] = [];
    const trackNames: string[] = [];
    // channel volume, expression and pitch bends in semitones, as they change
    const controls: { tick: number, channel: number, type: ControlType, value: number }[] = [];
    // notes by track and channel
    const notes: Record<string, { track: number, channel: number, notes: MidiNote[] }> = {};

    midi.tracks.forEach((events, track) => {
        let tick = 0;
        // the pitch bend range gets set through registered parameter 0
        const rpn: Record<number, number> = {};
        const bendRange: Record<number, number> = {};
        // notes that have started, by channel and note number
        const open: Record<string, { start: number, velocity: number }[]> = {};
        const endNote = (channel: number, note: number, end: number) => {
            const started = open[`${channel}:${note}`]?.shift();
            if (!started) {
                return;
            }
            const key = `${track}:${channel}`;
            notes[key] = notes[key] ?? { track, channel, notes: [] };
            notes[key].notes.push({ start: started.start, end, note, velocity: started.velocity, program: 0 });
        };

        events.forEach(event => {
            tick += event.deltaTime;
            switch (event.type) {
                case 'setTempo':
                    tempos.push({ tick, microsecondsPerBeat: event.microsecondsPerBeat });
                    break;
                case 'timeSignature':
                    timeSignatures.push({ tick, timeSignature: `${event.numerator}/${event.denominator}` });
                    break;
                case 'trackName':
                    trackNames[track] = trackNames[track] ?? event.text.trim();
                    break;
                case 'programChange':
                    programChanges.push({ tick, channel: event.channel, program: event.programNumber });
                    break;
                case 'noteOn':
                    if (event.velocity > 0) {
                        const key = `${event.channel}:${event.noteNumber}`;
                        open[key] = [...(open[key] ?? []), { start: tick, velocity: event.velocity }];
                    } else {
                        endNote(event.channel, event.noteNumber, tick);
                    }
                    break;
                case 'noteOff':
                    endNote(event.channel, event.noteNumber, tick);
                    break;
                case 'controller':
                    if (event.controllerType === CONTROLLER_VOLUME) {
                        controls.push({ tick, channel: event.channel, type: 'volume', value: event.value });
                    } else if (event.controllerType === CONTROLLER_EXPRESSION) {
                        controls.push({ tick, channel: event.channel, type: 'expression', value: event.value });
                    } else if (event.controllerType === CONTROLLER_RPN_MSB) {
                        rpn[event.channel] = (event.value << 7) | ((rpn[event.channel] ?? 0) & 0x7F);
                    } else if (event.controllerType === CONTROLLER_RPN_LSB) {
                        rpn[event.channel] = ((rpn[event.channel] ?? 0) & ~0x7F) | event.value;
                    } else if (event.controllerType === CONTROLLER_DATA_ENTRY && rpn[event.channel] === 0) {
                        bendRange[event.channel] = event.value;
                    }
                    break;
                case 'pitchBend':
                    controls.push({
                        tick,
                        channel: event.channel,
                        type: 'bend',
                        value: event.value / PITCH_BEND_MAX * (bendRange[event.channel] ?? PITCH_BEND_RANGE_DEFAULT),
                    });
                    break;
            }
        });

        // notes still on at the end of the track end there
        Object.keys(open).forEach(key => {
            const [channel, note] = key.split(':').map(n => parseInt(n));
            while (open[key].length) {
                endNote(channel, note, tick);
            }
        });
    });

    // each note plays with the program its channel has at its start
    programChanges.sort((a, b) => a.tick - b.tick);
    Object.values(notes).forEach(group => group.notes.forEach(note => {
        note.program = programChanges.filter(p => p.channel === group.channel && p.tick <= note.start).pop()?.program ?? 0;
    }));

    // a channel's controls by type, in the order they change
    controls.sort((a, b) => a.tick - b.tick);
    const controlsByChannel: Record<string, { tick: number, value: number }[]> = {};
    controls.forEach(c => {
        const key = `${c.channel}:${c.type}`;
        controlsByChannel[key] = [...(controlsByChannel[key] ?? []), { tick: c.tick, value: c.value }];
    });
    const getControl = (channel: number, type: ControlType, tick: number, defaultValue: number): number =>
        controlsByChannel[`${channel}:${type}`]?.filter(c => c.tick <= tick).pop()?.value ?? defaultValue;
    const getLoudness = (channel: number, velocity: number, tick: number): number =>
        velocity / MIDI_VELOCITY_MAX *
        getControl(channel, 'volume', tick, CHANNEL_VOLUME_DEFAULT) / MIDI_CONTROLLER_MAX *
        getControl(channel, 'expression', tick, MIDI_CONTROLLER_MAX) / MIDI_CONTROLLER_MAX;

    const soundData = createSoundData(trackNames[0] ?? '');

    // tempo and time signature, at whole columns
    let previousTempo: number | undefined;
    if (!tempos.some(t => t.tick === 0)) {
        tempos.unshift({ tick: 0, microsecondsPerBeat: DEFAULT_MICROSECONDS_PER_BEAT });
    }
    tempos.sort((a, b) => a.tick - b.tick).forEach(t => {
        const tempo = getTempo(t.microsecondsPerBeat / 1000 / SIXTEENTHS_PER_BEAT, soundData);
        setTempoAtColumn(soundData, Math.round(toStep(t.tick) / SUB_NOTE_RESOLUTION), tempo, previousTempo);
        previousTempo = tempo;
    });
    timeSignatures.sort((a, b) => a.tick - b.tick).forEach(t => {
        setTimeSignatureAtColumn(soundData, Math.round(toStep(t.tick) / SUB_NOTE_RESOLUTION), t.timeSignature);
    });

    const lastStep = Math.max(0, ...Object.values(notes).flatMap(group => group.notes.map(n => toStep(n.end))));
    // whole bars of four quarter notes
    soundData.size = Math.max(16, Math.ceil(lastStep / SUB_NOTE_RESOLUTION / 16) * 16);
    const slots = getUniformPatternSlots(soundData.size);

    // an instrument per program, and one for drums
    const instrumentIds: Record<string, string> = {};
    const getInstrumentId = (channel: number, program: number): string => {
        const key = channel === DRUM_CHANNEL ? 'drums' : `${program}`;
        if (instrumentIds[key] === undefined) {
            const id = newInstrumentId();
            const family = Math.floor(program / 8) % PROGRAM_FAMILY_WAVEFORMS.length;
            soundData.instruments[id] = channel === DRUM_CHANNEL
                ? createInstrument('Drums', SoundEditorTrackType.NOISE, DEFAULT_WAVEFORM, 11, DRUM_ENVELOPE)
                : createInstrument(
                    `${PROGRAM_FAMILY_NAMES[family]} (${program + 1})`,
                    SoundEditorTrackType.WAVE,
                    getPreset(PROGRAM_FAMILY_WAVEFORMS[family]),
                    (Object.keys(instrumentIds).length * 8 + 1) % 64
                );
            instrumentIds[key] = id;
        }
        return instrumentIds[key];
    };

    Object.values(notes)
        .sort((a, b) => a.track - b.track || a.channel - b.channel)
        .forEach(group => {
            const isDrums = group.channel === DRUM_CHANNEL;
            // the highest notes first, so that melodies end up in the first voice, and the most important drums
            const sorted = [...group.notes].sort((a, b) => a.start - b.start || (isDrums
                ? getDrumPriority(a.note) - getDrumPriority(b.note)
                : b.note - a.note));
            const voices: { end: number, notes: MidiNote[] }[] = [];
            // the same note started twice at the same time plays once
            const started = new Set<string>();
            sorted.forEach(note => {
                const start = toStep(note.start);
                if (started.has(`${start}:${note.note}`)) {
                    return;
                }
                started.add(`${start}:${note.note}`);
                const voice = voices.find(v => v.end <= start);
                if (voice) {
                    voice.notes.push(note);
                    voice.end = Math.max(start + 1, toStep(note.end));
                } else {
                    voices.push({ end: Math.max(start + 1, toStep(note.end)), notes: [note] });
                }
            });

            voices.forEach((voice, voiceIndex) => {
                const defaultInstrumentId = getInstrumentId(group.channel, voice.notes[0].program);
                const events: EventsMap = {};
                let previousVolume: number | undefined;
                let previousInstrumentId = defaultInstrumentId;
                voice.notes.forEach((note, i) => {
                    const start = toStep(note.start);
                    const next = voice.notes[i + 1];
                    const end = Math.min(toStep(note.end), next ? toStep(next.start) : Infinity);
                    const instrumentId = getInstrumentId(group.channel, note.program);
                    const volume = getVolume(getLoudness(group.channel, note.velocity, note.start));
                    // a bend at the note's start shifts it, one that changes until its end becomes a slide
                    const bendAtStart = Math.round(getControl(group.channel, 'bend', note.start, 0));
                    const bendAtEnd = Math.round(getControl(group.channel, 'bend', Math.max(note.start, note.end - 1), 0));
                    events[start] = {
                        ...events[start],
                        [SoundEvent.Note]: isDrums ? getDrumNote(note.note) : getNoteLabel(note.note + bendAtStart),
                        [SoundEvent.Duration]: Math.max(1, end - start),
                    };
                    const slide = getNoteSlide(note.note + bendAtStart, note.note + bendAtEnd);
                    if (!isDrums && slide !== 0) {
                        events[start][SoundEvent.NoteSlide] = slide;
                        events[start][SoundEvent.NoteSlideSteps] = BEND_SLIDE_STEPS;
                    }
                    if (instrumentId !== defaultInstrumentId) {
                        events[start][SoundEvent.Instrument] = instrumentId;
                    }
                    // a volume lasts until the instrument changes
                    if (volume !== previousVolume || instrumentId !== previousInstrumentId) {
                        events[start][SoundEvent.Volume] = volume;
                    }
                    previousVolume = volume;
                    previousInstrumentId = instrumentId;

                    // channel volume and expression changing while the note plays
                    [
                        ...controlsByChannel[`${group.channel}:volume`] ?? [],
                        ...controlsByChannel[`${group.channel}:expression`] ?? [],
                    ]
                        .filter(c => c.tick > note.start && toStep(c.tick) > start && toStep(c.tick) < end)
                        .sort((a, b) => a.tick - b.tick)
                        .forEach(c => {
                            const changedVolume = getVolume(getLoudness(group.channel, note.velocity, c.tick));
                            if (changedVolume !== previousVolume) {
                                events[toStep(c.tick)] = { ...events[toStep(c.tick)], [SoundEvent.Volume]: changedVolume };
                                previousVolume = changedVolume;
                            }
                        });
                });

                const groupName = trackNames[group.track] || `Channel ${group.channel + 1}`;
                addTrack(
                    soundData,
                    events,
                    isDrums ? SoundEditorTrackType.NOISE : SoundEditorTrackType.WAVE,
                    defaultInstrumentId,
                    slots,
                    voices.length > 1 ? `${groupName} ${voiceIndex + 1}` : groupName
                );
            });
        });

    return soundData;
};
