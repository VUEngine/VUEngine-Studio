import React, { useContext, useEffect, useRef, useState } from 'react';
import VsuEmulator from '../VsuEmulator/VsuEmulator';
import { DEFAULT_VSU_DATA, VsuChannelData, VsuData } from '../VsuEmulator/VsuEmulatorTypes';
import { BAR_PATTERN_LENGTH_MULT_MAP, EventsMap, MusicEditorChannelType, MusicEvent, NOTES, SongData } from './MusicEditorTypes';
import { EditorsContext, EditorsContextType } from '../../ves-editors-types';
import { WaveFormData } from '../WaveFormEditor/WaveFormEditorTypes';

interface MusicPlayerStateRef {
    songData: SongData
    flatEventsMap: Record<number, EventsMap>
    vsuData: VsuData
    playRangeStart: number
    playRangeEnd: number
    currentPatternNoteOffset: number
}

interface MusicPlayerProps {
    songData: SongData
    currentStep: number
    setCurrentStep: (currentStep: number) => void
    playing: boolean
    setPlaying: (playing: boolean) => void
    testing: boolean
    setTesting: (playing: boolean) => void
    testingInstrument: number
    testingNote: number
    testingDuration: number
    testingChannel: number
    playRangeStart: number
    playRangeEnd: number
    currentPatternNoteOffset: number
}

export default function MusicPlayer(props: MusicPlayerProps): React.JSX.Element {
    const { services } = useContext(EditorsContext) as EditorsContextType;
    const {
        songData,
        currentStep, setCurrentStep,
        playing, setPlaying,
        testing, setTesting, testingDuration, testingNote, testingInstrument, testingChannel,
        playRangeStart, playRangeEnd, currentPatternNoteOffset
    } = props;
    const [flatEventsMap, setFlatEventsMap] = useState<Record<number, EventsMap>>({});
    const [totalLength, setTotalLength] = useState<number>(0);
    const [vsuData, setVsuData] = useState<VsuData>(DEFAULT_VSU_DATA);
    const [timer, setTimer] = useState<NodeJS.Timeout>();
    const [initialized, setInitialized] = useState<boolean>(false);
    const stateRef = useRef<MusicPlayerStateRef>();

    // This always has the current state, even from the timeouts
    stateRef.current = { songData, flatEventsMap, vsuData, playRangeStart, playRangeEnd, currentPatternNoteOffset };

    const updateChannel = (channel: number, partialChannel: Partial<VsuChannelData>): void =>
        setVsuData(d => {
            const updatedVsuData = { ...d };
            updatedVsuData.channels[channel] = {
                ...d.channels[channel],
                ...partialChannel,
            };
            return updatedVsuData;
        });

    const setInitialVsuConfiguration = () => {
        const updatedChannels = [...vsuData.channels];
        let updatedWaveforms = [...vsuData.waveforms];
        let modulationData: number[] = [];
        songData.channels.forEach((channel, index) => {
            const instrument = songData.instruments[
                testing ? testingInstrument : channel.instrument
            ];
            const waveform = services.vesProjectService.getProjectDataItemById(instrument.waveform, 'WaveForm') as WaveFormData;
            if (channel.sequence.length > 0 && instrument && waveform) {
                updatedChannels[index] = {
                    envelope: instrument.envelope,
                    frequency: testing ? testingNote : 0,
                    interval: instrument.interval,
                    stereoLevels: instrument.volume,
                    sweepMod: instrument.sweepMod,
                    tap: instrument.tap,
                    waveform: channel.type !== MusicEditorChannelType.NOISE ? index : 0,
                    // "enabled" must be last key to override implicit enablement e.g. through "interval" setting
                    enabled: testing ? index === testingChannel : false,
                };
                updatedWaveforms = [
                    ...updatedWaveforms.slice(0, index),
                    {
                        ...updatedWaveforms[index],
                        ...waveform.values,
                    },
                    ...updatedWaveforms.slice(index),
                ];
                if (channel.type === MusicEditorChannelType.SWEEPMOD) {
                    modulationData = instrument.modulationData;
                }
            }
        });

        setVsuData({
            ...vsuData,
            channels: updatedChannels,
            waveforms: updatedWaveforms,
            modulation: modulationData,
        });
    };

    const computeSong = (): void => {
        const soloChannel = songData.channels.filter(c => c.solo).map(c => c.id).pop() ?? -1;

        let newTotalLength = 0;
        const newEventsMap: EventsMap[] = [{}, {}, {}, {}, {}, {}];
        songData.channels.forEach((channel, index) => {
            if (channel.muted || (soloChannel !== -1 && soloChannel !== channel.id)) {
                return;
            }

            let channelLength = 0;
            channel.sequence.forEach(patternId => {
                const pattern = songData.channels[channel.id].patterns[patternId];
                const patternSize = BAR_PATTERN_LENGTH_MULT_MAP[pattern.bar] * songData.noteResolution;
                Object.keys(pattern.events).map(tick => {
                    const intTick = parseInt(tick);
                    newEventsMap[index][intTick + channelLength] = pattern.events[intTick];
                });
                channelLength += patternSize;
            });

            if (channelLength > newTotalLength) {
                newTotalLength = channelLength;
            }
        });

        setFlatEventsMap(newEventsMap);
        setTotalLength(newTotalLength);
    };

    const getNextStep = (current: number) => {
        const currentPlayRangeStart = (stateRef.current?.playRangeStart ?? 0);
        const currentPlayRangeEnd = (stateRef.current?.playRangeEnd ?? 0);
        const currentCurrentPatternNoteOffset = (stateRef.current?.currentPatternNoteOffset ?? 0);
        const currentSongData = stateRef.current?.songData;
        let nextStep = current + 1;
        const startNoteIndex = currentPlayRangeStart > -1
            ? currentCurrentPatternNoteOffset + currentPlayRangeStart
            : 0;
        const endNoteIndex = currentPlayRangeEnd > -1
            ? currentCurrentPatternNoteOffset + currentPlayRangeEnd
            : totalLength;
        if (nextStep > endNoteIndex && currentSongData?.loop) {
            nextStep = startNoteIndex;
        } else if (nextStep > (endNoteIndex + 1)) {
            nextStep = -1;
            setPlaying(false);
            setCurrentStep(-1);
        }

        return nextStep;
    };

    const processStep = (current: number) => {
        const currentFlatEventsMap = stateRef.current?.flatEventsMap ?? {};
        songData.channels.forEach((channel, index) => {
            if (Object.keys(currentFlatEventsMap[index]).length) {
                Object.entries(currentFlatEventsMap[index][current] ?? {}).map(([key, value]) => {
                    switch (key) {
                        case MusicEvent.Instrument:
                            // TODO
                            break;
                        case MusicEvent.Note:
                            updateChannel(index, {
                                enabled: true,
                                frequency: Object.values(NOTES)[value],
                            });
                            break;
                        case MusicEvent.NoteCut:
                            // TODO
                            break;
                        case MusicEvent.Volume:
                            // TODO
                            break;
                    }
                });
            } else if (stateRef.current?.vsuData.channels[index].enabled) {
                // disable previously enabled channel if it is now muted
                updateChannel(index, {
                    enabled: false,
                });
            }
        });
    };

    const step = (current: number) => {
        if (playing) {
            const currentSongData = stateRef.current?.songData;
            setCurrentStep(current);
            processStep(current);
            const nextStep = getNextStep(current);
            if (nextStep > -1) {
                // TODO: Use correct speed. It is defined in microseconds, but applied here as milliseconds.
                setTimer(setTimeout(() => step(nextStep), currentSongData?.speed));
            }
        }
    };

    useEffect(() => {
        clearTimeout(timer);
        if (playing) {
            setInitialVsuConfiguration();
            step(currentStep);
        }
    }, [playing]);

    useEffect(() => {
        if (testing) {
            setInitialVsuConfiguration();
            if (testingDuration > 0) {
                setTimer(setTimeout(() => setTesting(false), testingDuration));
            }
        }
    }, [testing]);

    useEffect(() => {
        computeSong();
    }, [
        songData,
    ]);

    useEffect(() => {
        setInitialVsuConfiguration();
    }, [
        songData,
        testingChannel,
        testingInstrument,
        testingNote,
    ]);

    // on unmount
    useEffect(() => clearTimeout(timer), []);

    return (
        <VsuEmulator
            data={vsuData}
            enabled={initialized && (playing || testing)}
            setInitialized={setInitialized}
        />
    );
}
