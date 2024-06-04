import { nls } from '@theia/core';
import React, { useContext, useEffect, useState } from 'react';
import { Tab, TabList, TabPanel, Tabs } from 'react-tabs';
import { WithContributor, WithFileUri } from '../../../../project/browser/ves-project-types';
import { EditorsContext, EditorsContextType } from '../../ves-editors-types';
import HContainer from '../Common/HContainer';
import NumberArrayPreview from '../Common/NumberArrayPreview';
import VContainer from '../Common/VContainer';
import WaveForm from '../WaveFormEditor/WaveForm';
import { WaveFormData } from '../WaveFormEditor/WaveFormEditorTypes';
import Channel from './Channel';
import ModulationData from './ModulationData';
import { VSU_NUMBER_OF_CHANNELS, VSU_NUMBER_OF_WAVEFORM_BANKS, VSU_SAMPLE_RATE, VsuChannelData, VsuData } from './VsuSandboxTypes';
import { VesEditorsPreferenceIds } from '../../ves-editors-preferences';

interface VsuSandboxProps {
    data: VsuData
    updateData: (data: VsuData) => void
}

export default function VsuSandbox(props: VsuSandboxProps): React.JSX.Element {
    const { services } = useContext(EditorsContext) as EditorsContextType;
    const { data, updateData } = props;
    const [audioContext, setAudioContext] = useState<AudioContext>();
    const [vsuEmulator, setVsuEmulator] = useState<AudioWorkletNode>();
    const [enabled, setEnabled] = useState<boolean>(false);
    const waveForms = Object.values(services.vesProjectService.getProjectDataItemsForType('WaveForm') || {}) as (WaveFormData & WithContributor & WithFileUri)[];

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

        if (services.preferenceService.get(VesEditorsPreferenceIds.EDITORS_VSU_SANDBOX_AUTO_START)) {
            toggleEnabled();
        }
    };

    const closeAudioContext = (): void => {
        audioContext?.close();
    };

    const toggleEnabled = () => {
        const e = !enabled;
        if (e) {
            audioContext?.resume();
        } else {
            audioContext?.suspend();
        }
        setEnabled(e);
    };

    const setWaveform = (channel: number, waveform: number[]): void => {
        const waveforms = [
            ...data.waveforms
        ];

        waveforms[channel] = waveform;

        updateData({
            ...data,
            waveforms,
        });
    };

    const setModulationData = (modulation: number[]): void => {
        updateData({
            ...data,
            modulation,
        });
    };

    const setChannelData = (index: number, channelData: VsuChannelData): void => {
        const channels = [...data.channels];
        channels[index] = channelData;

        updateData({
            ...data,
            channels,
        });
    };

    useEffect(() => {
        createAudioContext();
        return () => closeAudioContext();
    }, []);

    useEffect(() => {
        vsuEmulator?.port.postMessage(data);
    }, [
        data
    ]);

    return <VContainer>
        <button
            className={audioContext && enabled
                ? 'theia-button'
                : 'theia-button secondary'
            }
            style={{
                width: 80,
            }}
            disabled={audioContext === undefined}
            onClick={toggleEnabled}
        >
            <i className={audioContext && enabled
                ? 'codicon codicon-debug-pause'
                : 'codicon codicon-play'}
            />
        </button>
        <Tabs>
            <TabList>
                <Tab>
                    {nls.localize('vuengine/vsuSandbox/channels', 'Channels')}
                </Tab>
                {([...Array(VSU_NUMBER_OF_WAVEFORM_BANKS)].map((v, x) =>
                    <Tab key={x}>
                        {nls.localize('vuengine/vsuSandbox/waveForm', 'WaveForm')} {x + 1}
                    </Tab>
                ))}
                <Tab>
                    {nls.localize('vuengine/vsuSandbox/modulationData', 'Modulation Data')}
                </Tab>
            </TabList>
            <TabPanel>
                <VContainer gap={15}>
                    {([...Array(VSU_NUMBER_OF_CHANNELS)].map((v, x) =>
                        <>
                            <Channel
                                key={x}
                                index={x + 1}
                                supportSweepAndModulation={x === 4}
                                isNoiseChannel={x === 5}
                                channel={data.channels[x]}
                                setChannel={(channelData: VsuChannelData) => setChannelData(x, channelData)}
                                waveForms={data.waveforms}
                            />
                            {x < 5 &&
                                <hr />
                            }
                        </>
                    ))}
                </VContainer>
            </TabPanel>
            {([...Array(VSU_NUMBER_OF_WAVEFORM_BANKS)].map((v, x) =>
                <TabPanel key={x}>
                    <VContainer gap={15} grow={1}>
                        <VContainer>
                            <label>
                                {nls.localize('vuengine/vsuSandbox/presetsClickToApply', 'Presets (Click to apply)')}
                            </label>
                            <HContainer overflow='scroll'>
                                {(Object.values(waveForms).map((w, y) =>
                                    <NumberArrayPreview
                                        key={`${x}-${y}`}
                                        maximum={64}
                                        data={w.values}
                                        onClick={() => setWaveform(x, w.values)}
                                        onMouseEnter={event => {
                                            services.hoverService.requestHover({
                                                content: w._fileUri.path.name,
                                                target: event.currentTarget,
                                                position: 'bottom',
                                            });
                                        }}
                                        onMouseLeave={event => {
                                            services.hoverService.cancelHover();
                                        }}

                                    />
                                ))}
                            </HContainer>
                        </VContainer>
                        <VContainer grow={1}>
                            <label>
                                {nls.localize('vuengine/vsuSandbox/values', 'Values')}
                            </label>
                            <WaveForm
                                value={data.waveforms[x] ?? []}
                                setValue={(waveform: number[]) => setWaveform(x, waveform)}
                            />
                        </VContainer>
                    </VContainer>
                </TabPanel>
            ))}
            <TabPanel>
                <ModulationData
                    value={data.modulation ?? []}
                    setValue={setModulationData}
                />
            </TabPanel>
        </Tabs>
    </VContainer>;
}
