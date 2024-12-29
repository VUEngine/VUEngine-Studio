import React, { useContext, useEffect, useRef, useState } from 'react';
import { EditorsContext, EditorsContextType } from '../../ves-editors-types';
import VsuEmulator from '../VsuEmulator/VsuEmulator';
import { DEFAULT_VSU_DATA, VsuChannelData, VsuData } from '../VsuEmulator/VsuEmulatorTypes';
import { WaveFormData } from '../WaveFormEditor/WaveFormEditorTypes';
import { BAR_PATTERN_LENGTH_MULT_MAP, EventsMap, MusicEditorChannelType, MusicEvent, NOTES, SongData } from './MusicEditorTypes';

interface MusicPlayerStateRef {
    playing: boolean
    currentStep: number
    songData: SongData
    flatEventsMap: Record<number, EventsMap>
    vsuData: VsuData
    playRangeStart: number
    playRangeEnd: number
    currentPatternNoteOffset: number
    totalLength: number
    startTime: number
}

interface MusicPlayerProps {
    songData: SongData
    currentStep: number
    setCurrentStep: React.Dispatch<React.SetStateAction<number>>
    playing: boolean
    setPlaying: React.Dispatch<React.SetStateAction<boolean>>
    testing: boolean
    setTesting: React.Dispatch<React.SetStateAction<boolean>>
    testingInstrument: number
    testingNote: number
    testingDuration: number
    testingChannel: number
    playRangeStart: number
    playRangeEnd: number
    currentPatternNoteOffset: number
    playbackElapsedTime: number
    setPlaybackElapsedTime: React.Dispatch<React.SetStateAction<number>>
    totalLength: number
    setTotalLength: React.Dispatch<React.SetStateAction<number>>
}

export default function MusicPlayer(props: MusicPlayerProps): React.JSX.Element {
    const { services } = useContext(EditorsContext) as EditorsContextType;
    const {
        songData,
        currentStep, setCurrentStep,
        playing, setPlaying,
        testing, setTesting, testingDuration, testingNote, testingInstrument, testingChannel,
        playRangeStart, playRangeEnd, currentPatternNoteOffset,
        playbackElapsedTime, setPlaybackElapsedTime,
        totalLength, setTotalLength
    } = props;
    const [flatEventsMap, setFlatEventsMap] = useState<Record<number, EventsMap>>({});
    const [startTime, setStartTime] = useState<number>(0);
    const [vsuData, setVsuData] = useState<VsuData>(DEFAULT_VSU_DATA);
    const [timer, setTimer] = useState<NodeJS.Timeout>();
    const stateRef = useRef<MusicPlayerStateRef>();

    // This always has the current state, even from the timeouts
    stateRef.current = {
        playing, currentStep, songData, flatEventsMap, vsuData, playRangeStart, playRangeEnd, currentPatternNoteOffset, totalLength, startTime
    };

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

                /*
                                updatedChannels = [
                                    ...updatedChannels.slice(0, index),
                                    {
                                        ...updatedChannels[index],
                                        envelope: instrument.envelope,
                                        frequency: testing ? testingNote : 0,
                                        interval: instrument.interval,
                                        stereoLevels: instrument.volume,
                                        sweepMod: instrument.sweepMod,
                                        tap: instrument.tap,
                                        waveform: channel.type !== MusicEditorChannelType.NOISE ? index : 0,
                                        // "enabled" must be last key to override implicit enablement e.g. through "interval" setting
                                        enabled: testing ? index === testingChannel : false,
                                    },
                                    ...updatedChannels.slice(index),
                                ];
                */

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

        setVsuData(previousData => ({
            ...previousData,
            channels: updatedChannels,
            waveforms: updatedWaveforms,
            modulation: modulationData,
        }));
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

    const getNextStep = (elapsedSteps: number) => {
        const currentPlayRangeStart = stateRef.current!.playRangeStart;
        const currentPlayRangeEnd = stateRef.current!.playRangeEnd;
        const currentCurrentPatternNoteOffset = stateRef.current!.currentPatternNoteOffset;
        const currentSongData = stateRef.current!.songData;
        const startNoteIndex = currentPlayRangeStart > -1
            ? currentCurrentPatternNoteOffset + currentPlayRangeStart
            : 0;
        const endNoteIndex = currentPlayRangeEnd > -1
            ? currentCurrentPatternNoteOffset + currentPlayRangeEnd
            : stateRef.current!.totalLength;
        if (elapsedSteps > endNoteIndex && currentSongData?.loop) {
            return startNoteIndex;
        } else if (elapsedSteps > (endNoteIndex + 1)) {
            return -1;
        }

        return elapsedSteps;
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

    const onTick = () => {
        if (!stateRef.current!.playing) {
            return;
        }

        const elapsedTime = performance.now() - stateRef.current!.startTime;
        setPlaybackElapsedTime(elapsedTime);

        const elapsedSteps = Math.round(elapsedTime / stateRef.current!.songData.speed);
        const nextStep = getNextStep(elapsedSteps);
        if (nextStep === -1) {
            setPlaying(false);
        }

        setCurrentStep(nextStep);

        if (nextStep > stateRef.current!.currentStep) {
            processStep(nextStep);
        } else if (nextStep < stateRef.current!.currentStep) {
            setStartTime(performance.now());
        }
    };

    useEffect(() => {
        clearTimeout(timer);
        if (playing) {
            if (currentStep > -1) {
                setStartTime(performance.now() - playbackElapsedTime);
                processStep(currentStep);
            } else {
                setStartTime(performance.now());
            }
            setInitialVsuConfiguration();
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
        <>
            {(playing || testing) &&
                <VsuEmulator
                    data={vsuData}
                    onTick={() => onTick()}
                />
            }
        </>
    );
}
