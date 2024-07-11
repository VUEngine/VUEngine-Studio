import React, { useContext, useEffect, useState } from 'react';
import { EditorsContext, EditorsContextType } from '../../ves-editors-types';
import { VSU_SAMPLE_RATE, VsuData } from './VsuEmulatorTypes';
import { VesEditorsPreferenceIds } from '../../ves-editors-preferences';

interface VsuEmulatorProps {
    data: VsuData
}

export default function VsuEmulator(props: VsuEmulatorProps): React.JSX.Element {
    const { services } = useContext(EditorsContext) as EditorsContextType;
    const { data } = props;
    const [audioContext, setAudioContext] = useState<AudioContext>();
    const [vsuEmulator, setVsuEmulator] = useState<AudioWorkletNode>();
    const autoPlay = services.preferenceService.get(VesEditorsPreferenceIds.EDITORS_VSU_SANDBOX_AUTO_START) as boolean;
    const [enabled, setEnabled] = useState<boolean>(autoPlay);
    const [initialized, setInitialized] = useState<boolean>(false);

    const toggleEnabled = () => {
        setEnabled(!enabled);
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
            sampleRate: VSU_SAMPLE_RATE,
        });
        await audioCtx.audioWorklet.addModule(workerPath);
        const vsuNode = new AudioWorkletNode(audioCtx, 'vsu-emulator', {
            outputChannelCount: [2],
        });
        vsuNode.connect(audioCtx.destination);
        vsuNode.port.postMessage(data);

        setAudioContext(audioCtx);
        setVsuEmulator(vsuNode);

        if (enabled) {
            audioCtx?.resume();
        } else {
            audioCtx?.suspend();
        }

        setInitialized(true);
    };

    const closeAudioContext = (): void => {
        audioContext?.close();
    };

    if (enabled) {
        audioContext?.resume();
    } else {
        audioContext?.suspend();
    }

    useEffect(() => {
        createAudioContext();
        return () => closeAudioContext();
    }, []);

    useEffect(() => {
        vsuEmulator?.port.postMessage(data);
    }, [data]);

    return <button
        className={initialized && enabled
            ? 'theia-button'
            : 'theia-button secondary'
        }
        style={{
            width: 75,
        }}
        disabled={initialized === undefined}
        onClick={toggleEnabled}
    >
        <i className={initialized && enabled
            ? 'codicon codicon-debug-pause'
            : 'codicon codicon-play'}
        />
    </button>;
}
