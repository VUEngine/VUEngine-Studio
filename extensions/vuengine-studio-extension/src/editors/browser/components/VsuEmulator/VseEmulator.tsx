import React, { useContext, useEffect, useRef, useState } from 'react';
import { VesEditorsPreferenceIds } from '../../ves-editors-preferences';
import { EditorsContext, EditorsContextType } from '../../ves-editors-types';
import { VSU_SAMPLE_RATE, VsuData } from './VsuEmulatorTypes';

interface VsuEmulatorProps {
    data: VsuData
}

export default function VsuEmulator(props: VsuEmulatorProps): React.JSX.Element {
    const { services } = useContext(EditorsContext) as EditorsContextType;
    const { data } = props;
    const audioContextRef = useRef<AudioContext>();
    const [vsuEmulator, setVsuEmulator] = useState<AudioWorkletNode>();
    const autoPlay = services.preferenceService.get(VesEditorsPreferenceIds.EDITORS_VSU_SANDBOX_AUTO_START) as boolean;
    const [enabled, setEnabled] = useState<boolean>(autoPlay);
    const [initialized, setInitialized] = useState<boolean>(false);

    const toggleEnabled = () => {
        const updatedEnabled = !enabled;

        if (updatedEnabled) {
            audioContextRef.current?.resume();
        } else {
            audioContextRef.current?.suspend();
        }

        setEnabled(updatedEnabled);
    };

    const createAudioContext = async (): Promise<void> => {
        const resourcesUri = await services.vesCommonService.getResourcesUri();
        const workerPath = resourcesUri
            .withScheme('file')
            .resolve('binaries')
            .resolve('vuengine-studio-tools')
            .resolve('web')
            .resolve('vsu-emulator')
            .resolve('vsu.worklet.js')
            .toString();

        const audioCtx = new AudioContext({
            latencyHint: 'interactive',
            sampleRate: VSU_SAMPLE_RATE,
        });
        await audioCtx.audioWorklet.addModule(workerPath);
        const vsuNode = new AudioWorkletNode(audioCtx, 'vsu-emulator', {
            outputChannelCount: [2],
        });
        vsuNode.connect(audioCtx.destination);

        audioContextRef.current = audioCtx;
        setVsuEmulator(vsuNode);

        if (!enabled) {
            audioCtx?.suspend();
        }

        setInitialized(true);
    };

    const closeAudioContext = (): void => {
        audioContextRef.current?.close();
    };

    useEffect(() => {
        createAudioContext();
        return () => closeAudioContext();
    }, []);

    useEffect(() => vsuEmulator?.port.postMessage({ field: 'ch1EnvDirection', data: data.channels[0].envelope.direction }), [vsuEmulator, data.channels[0].envelope.direction]);
    useEffect(() => vsuEmulator?.port.postMessage({ field: 'ch2EnvDirection', data: data.channels[1].envelope.direction }), [vsuEmulator, data.channels[1].envelope.direction]);
    useEffect(() => vsuEmulator?.port.postMessage({ field: 'ch3EnvDirection', data: data.channels[2].envelope.direction }), [vsuEmulator, data.channels[2].envelope.direction]);
    useEffect(() => vsuEmulator?.port.postMessage({ field: 'ch4EnvDirection', data: data.channels[3].envelope.direction }), [vsuEmulator, data.channels[3].envelope.direction]);
    useEffect(() => vsuEmulator?.port.postMessage({ field: 'ch5EnvDirection', data: data.channels[4].envelope.direction }), [vsuEmulator, data.channels[4].envelope.direction]);
    useEffect(() => vsuEmulator?.port.postMessage({ field: 'ch6EnvDirection', data: data.channels[5].envelope.direction }), [vsuEmulator, data.channels[5].envelope.direction]);
    useEffect(() => vsuEmulator?.port.postMessage({ field: 'ch1EnvEnabled', data: data.channels[0].envelope.enabled }), [vsuEmulator, data.channels[0].envelope.enabled]);
    useEffect(() => vsuEmulator?.port.postMessage({ field: 'ch2EnvEnabled', data: data.channels[1].envelope.enabled }), [vsuEmulator, data.channels[1].envelope.enabled]);
    useEffect(() => vsuEmulator?.port.postMessage({ field: 'ch3EnvEnabled', data: data.channels[2].envelope.enabled }), [vsuEmulator, data.channels[2].envelope.enabled]);
    useEffect(() => vsuEmulator?.port.postMessage({ field: 'ch4EnvEnabled', data: data.channels[3].envelope.enabled }), [vsuEmulator, data.channels[3].envelope.enabled]);
    useEffect(() => vsuEmulator?.port.postMessage({ field: 'ch5EnvEnabled', data: data.channels[4].envelope.enabled }), [vsuEmulator, data.channels[4].envelope.enabled]);
    useEffect(() => vsuEmulator?.port.postMessage({ field: 'ch6EnvEnabled', data: data.channels[5].envelope.enabled }), [vsuEmulator, data.channels[5].envelope.enabled]);
    useEffect(() => vsuEmulator?.port.postMessage({ field: 'ch1EnvLevel', data: data.channels[0].envelope.initialValue }), [vsuEmulator, data.channels[0].envelope.initialValue]);
    useEffect(() => vsuEmulator?.port.postMessage({ field: 'ch2EnvLevel', data: data.channels[1].envelope.initialValue }), [vsuEmulator, data.channels[1].envelope.initialValue]);
    useEffect(() => vsuEmulator?.port.postMessage({ field: 'ch3EnvLevel', data: data.channels[2].envelope.initialValue }), [vsuEmulator, data.channels[2].envelope.initialValue]);
    useEffect(() => vsuEmulator?.port.postMessage({ field: 'ch4EnvLevel', data: data.channels[3].envelope.initialValue }), [vsuEmulator, data.channels[3].envelope.initialValue]);
    useEffect(() => vsuEmulator?.port.postMessage({ field: 'ch5EnvLevel', data: data.channels[4].envelope.initialValue }), [vsuEmulator, data.channels[4].envelope.initialValue]);
    useEffect(() => vsuEmulator?.port.postMessage({ field: 'ch6EnvLevel', data: data.channels[5].envelope.initialValue }), [vsuEmulator, data.channels[5].envelope.initialValue]);
    useEffect(() => vsuEmulator?.port.postMessage({ field: 'ch1EnvRepeat', data: data.channels[0].envelope.repeat }), [vsuEmulator, data.channels[0].envelope.repeat]);
    useEffect(() => vsuEmulator?.port.postMessage({ field: 'ch2EnvRepeat', data: data.channels[1].envelope.repeat }), [vsuEmulator, data.channels[1].envelope.repeat]);
    useEffect(() => vsuEmulator?.port.postMessage({ field: 'ch3EnvRepeat', data: data.channels[2].envelope.repeat }), [vsuEmulator, data.channels[2].envelope.repeat]);
    useEffect(() => vsuEmulator?.port.postMessage({ field: 'ch4EnvRepeat', data: data.channels[3].envelope.repeat }), [vsuEmulator, data.channels[3].envelope.repeat]);
    useEffect(() => vsuEmulator?.port.postMessage({ field: 'ch5EnvRepeat', data: data.channels[4].envelope.repeat }), [vsuEmulator, data.channels[4].envelope.repeat]);
    useEffect(() => vsuEmulator?.port.postMessage({ field: 'ch6EnvRepeat', data: data.channels[5].envelope.repeat }), [vsuEmulator, data.channels[5].envelope.repeat]);
    useEffect(() => vsuEmulator?.port.postMessage({ field: 'ch1EnvStep', data: data.channels[0].envelope.stepTime }), [vsuEmulator, data.channels[0].envelope.stepTime]);
    useEffect(() => vsuEmulator?.port.postMessage({ field: 'ch2EnvStep', data: data.channels[1].envelope.stepTime }), [vsuEmulator, data.channels[1].envelope.stepTime]);
    useEffect(() => vsuEmulator?.port.postMessage({ field: 'ch3EnvStep', data: data.channels[2].envelope.stepTime }), [vsuEmulator, data.channels[2].envelope.stepTime]);
    useEffect(() => vsuEmulator?.port.postMessage({ field: 'ch4EnvStep', data: data.channels[3].envelope.stepTime }), [vsuEmulator, data.channels[3].envelope.stepTime]);
    useEffect(() => vsuEmulator?.port.postMessage({ field: 'ch5EnvStep', data: data.channels[4].envelope.stepTime }), [vsuEmulator, data.channels[4].envelope.stepTime]);
    useEffect(() => vsuEmulator?.port.postMessage({ field: 'ch6EnvStep', data: data.channels[5].envelope.stepTime }), [vsuEmulator, data.channels[5].envelope.stepTime]);
    useEffect(() => vsuEmulator?.port.postMessage({ field: 'ch1Frequency', data: data.channels[0].frequency }), [vsuEmulator, data.channels[0].frequency]);
    useEffect(() => vsuEmulator?.port.postMessage({ field: 'ch2Frequency', data: data.channels[1].frequency }), [vsuEmulator, data.channels[1].frequency]);
    useEffect(() => vsuEmulator?.port.postMessage({ field: 'ch3Frequency', data: data.channels[2].frequency }), [vsuEmulator, data.channels[2].frequency]);
    useEffect(() => vsuEmulator?.port.postMessage({ field: 'ch4Frequency', data: data.channels[3].frequency }), [vsuEmulator, data.channels[3].frequency]);
    useEffect(() => vsuEmulator?.port.postMessage({ field: 'ch5Frequency', data: data.channels[4].frequency }), [vsuEmulator, data.channels[4].frequency]);
    useEffect(() => vsuEmulator?.port.postMessage({ field: 'ch6Frequency', data: data.channels[5].frequency }), [vsuEmulator, data.channels[5].frequency]);
    useEffect(() => vsuEmulator?.port.postMessage({ field: 'ch1IntervalEnabled', data: data.channels[0].interval.enabled }), [vsuEmulator, data.channels[0].interval.enabled]);
    useEffect(() => vsuEmulator?.port.postMessage({ field: 'ch2IntervalEnabled', data: data.channels[1].interval.enabled }), [vsuEmulator, data.channels[1].interval.enabled]);
    useEffect(() => vsuEmulator?.port.postMessage({ field: 'ch3IntervalEnabled', data: data.channels[2].interval.enabled }), [vsuEmulator, data.channels[2].interval.enabled]);
    useEffect(() => vsuEmulator?.port.postMessage({ field: 'ch4IntervalEnabled', data: data.channels[3].interval.enabled }), [vsuEmulator, data.channels[3].interval.enabled]);
    useEffect(() => vsuEmulator?.port.postMessage({ field: 'ch5IntervalEnabled', data: data.channels[4].interval.enabled }), [vsuEmulator, data.channels[4].interval.enabled]);
    useEffect(() => vsuEmulator?.port.postMessage({ field: 'ch6IntervalEnabled', data: data.channels[5].interval.enabled }), [vsuEmulator, data.channels[5].interval.enabled]);
    useEffect(() => vsuEmulator?.port.postMessage({ field: 'ch1IntervalValue', data: data.channels[0].interval.value }), [vsuEmulator, data.channels[0].interval.value]);
    useEffect(() => vsuEmulator?.port.postMessage({ field: 'ch2IntervalValue', data: data.channels[1].interval.value }), [vsuEmulator, data.channels[1].interval.value]);
    useEffect(() => vsuEmulator?.port.postMessage({ field: 'ch3IntervalValue', data: data.channels[2].interval.value }), [vsuEmulator, data.channels[2].interval.value]);
    useEffect(() => vsuEmulator?.port.postMessage({ field: 'ch4IntervalValue', data: data.channels[3].interval.value }), [vsuEmulator, data.channels[3].interval.value]);
    useEffect(() => vsuEmulator?.port.postMessage({ field: 'ch5IntervalValue', data: data.channels[4].interval.value }), [vsuEmulator, data.channels[4].interval.value]);
    useEffect(() => vsuEmulator?.port.postMessage({ field: 'ch6IntervalValue', data: data.channels[5].interval.value }), [vsuEmulator, data.channels[5].interval.value]);
    useEffect(() => vsuEmulator?.port.postMessage({ field: 'ch1StereoLevels', data: data.channels[0].stereoLevels }), [vsuEmulator, data.channels[0].stereoLevels]);
    useEffect(() => vsuEmulator?.port.postMessage({ field: 'ch2StereoLevels', data: data.channels[1].stereoLevels }), [vsuEmulator, data.channels[1].stereoLevels]);
    useEffect(() => vsuEmulator?.port.postMessage({ field: 'ch3StereoLevels', data: data.channels[2].stereoLevels }), [vsuEmulator, data.channels[2].stereoLevels]);
    useEffect(() => vsuEmulator?.port.postMessage({ field: 'ch4StereoLevels', data: data.channels[3].stereoLevels }), [vsuEmulator, data.channels[3].stereoLevels]);
    useEffect(() => vsuEmulator?.port.postMessage({ field: 'ch5StereoLevels', data: data.channels[4].stereoLevels }), [vsuEmulator, data.channels[4].stereoLevels]);
    useEffect(() => vsuEmulator?.port.postMessage({ field: 'ch6StereoLevels', data: data.channels[5].stereoLevels }), [vsuEmulator, data.channels[5].stereoLevels]);
    useEffect(() => vsuEmulator?.port.postMessage({ field: 'ch1Waveform', data: data.channels[0].waveform }), [vsuEmulator, data.channels[0].waveform]);
    useEffect(() => vsuEmulator?.port.postMessage({ field: 'ch2Waveform', data: data.channels[1].waveform }), [vsuEmulator, data.channels[1].waveform]);
    useEffect(() => vsuEmulator?.port.postMessage({ field: 'ch3Waveform', data: data.channels[2].waveform }), [vsuEmulator, data.channels[2].waveform]);
    useEffect(() => vsuEmulator?.port.postMessage({ field: 'ch4Waveform', data: data.channels[3].waveform }), [vsuEmulator, data.channels[3].waveform]);
    useEffect(() => vsuEmulator?.port.postMessage({ field: 'ch5Waveform', data: data.channels[4].waveform }), [vsuEmulator, data.channels[4].waveform]);
    useEffect(() => vsuEmulator?.port.postMessage({ field: 'ch6Waveform', data: data.channels[5].waveform }), [vsuEmulator, data.channels[5].waveform]);
    useEffect(() => vsuEmulator?.port.postMessage({ field: 'ch5SweepDirection', data: data.channels[4].sweepMod.direction }), [vsuEmulator, data.channels[4].sweepMod.direction]);
    useEffect(() => vsuEmulator?.port.postMessage({ field: 'ch5SweepModEnabled', data: data.channels[4].sweepMod.enabled }), [vsuEmulator, data.channels[4].sweepMod.enabled]);
    useEffect(() => vsuEmulator?.port.postMessage({ field: 'ch5SweepModFunction', data: data.channels[4].sweepMod.function }), [vsuEmulator, data.channels[4].sweepMod.function]);
    useEffect(() => vsuEmulator?.port.postMessage({ field: 'regSweepModInterval', data: data.channels[4].sweepMod.interval }), [vsuEmulator, data.channels[4].sweepMod.interval]);
    useEffect(() => vsuEmulator?.port.postMessage({ field: 'ch5ModFrequency', data: data.channels[4].sweepMod.frequency }), [vsuEmulator, data.channels[4].sweepMod.frequency]);
    useEffect(() => vsuEmulator?.port.postMessage({ field: 'ch5ModRepeat', data: data.channels[4].sweepMod.repeat }), [vsuEmulator, data.channels[4].sweepMod.repeat]);
    useEffect(() => vsuEmulator?.port.postMessage({ field: 'ch5SweepShift', data: data.channels[4].sweepMod.shift }), [vsuEmulator, data.channels[4].sweepMod.shift]);
    useEffect(() => vsuEmulator?.port.postMessage({ field: 'ch6TapLocation', data: data.channels[5].tapLocation }), [vsuEmulator, data.channels[5].tapLocation]);
    useEffect(() => vsuEmulator?.port.postMessage({ field: 'waveform1', data: data.waveforms[0] }), [vsuEmulator, data.waveforms[0]]);
    useEffect(() => vsuEmulator?.port.postMessage({ field: 'waveform2', data: data.waveforms[1] }), [vsuEmulator, data.waveforms[1]]);
    useEffect(() => vsuEmulator?.port.postMessage({ field: 'waveform3', data: data.waveforms[2] }), [vsuEmulator, data.waveforms[2]]);
    useEffect(() => vsuEmulator?.port.postMessage({ field: 'waveform4', data: data.waveforms[3] }), [vsuEmulator, data.waveforms[3]]);
    useEffect(() => vsuEmulator?.port.postMessage({ field: 'waveform5', data: data.waveforms[4] }), [vsuEmulator, data.waveforms[4]]);
    useEffect(() => vsuEmulator?.port.postMessage({ field: 'modulation', data: data.modulation }), [vsuEmulator, data.modulation]);
    useEffect(() => vsuEmulator?.port.postMessage({ field: 'ch1Enabled', data: data.channels[0].enabled }), [vsuEmulator, data.channels[0].enabled]);
    useEffect(() => vsuEmulator?.port.postMessage({ field: 'ch2Enabled', data: data.channels[1].enabled }), [vsuEmulator, data.channels[1].enabled]);
    useEffect(() => vsuEmulator?.port.postMessage({ field: 'ch3Enabled', data: data.channels[2].enabled }), [vsuEmulator, data.channels[2].enabled]);
    useEffect(() => vsuEmulator?.port.postMessage({ field: 'ch4Enabled', data: data.channels[3].enabled }), [vsuEmulator, data.channels[3].enabled]);
    useEffect(() => vsuEmulator?.port.postMessage({ field: 'ch5Enabled', data: data.channels[4].enabled }), [vsuEmulator, data.channels[4].enabled]);
    useEffect(() => vsuEmulator?.port.postMessage({ field: 'ch6Enabled', data: data.channels[5].enabled }), [vsuEmulator, data.channels[5].enabled]);

    return <button
        className={initialized && enabled
            ? 'theia-button'
            : 'theia-button secondary'
        }
        style={{
            width: 70,
        }}
        disabled={initialized === undefined}
        onClick={toggleEnabled}
    >
        <i className={`fa fa-${initialized && enabled ? 'stop' : 'play'}`}
        />
    </button>;
}
