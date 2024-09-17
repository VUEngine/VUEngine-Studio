import { nls } from '@theia/core';
import React, { useContext, useState } from 'react';
import { Tab, TabList, TabPanel, Tabs } from 'react-tabs';
import { WithContributor, WithFileUri } from '../../../../project/browser/ves-project-types';
import { EditorsContext, EditorsContextType } from '../../ves-editors-types';
import HContainer from '../Common/HContainer';
import NumberArrayPreview from '../Common/NumberArrayPreview';
import { clamp } from '../Common/Utils';
import VContainer from '../Common/VContainer';
import VsuEmulator from '../VsuEmulator/VseEmulator';
import { VSU_FREQUENCY_MAX, VSU_FREQUENCY_MIN, VSU_NUMBER_OF_CHANNELS, VSU_NUMBER_OF_WAVEFORM_BANKS, VsuChannelData, VsuData } from '../VsuEmulator/VsuEmulatorTypes';
import WaveForm from '../WaveFormEditor/WaveForm';
import { WaveFormData } from '../WaveFormEditor/WaveFormEditorTypes';
import Channel from './Channel';
import ModulationData from './ModulationData';
import Piano from './Piano';

interface VsuSandboxProps {
    data: VsuData
    updateData: (data: VsuData) => void
}

export default function VsuSandbox(props: VsuSandboxProps): React.JSX.Element {
    const { services } = useContext(EditorsContext) as EditorsContextType;
    const { data, updateData } = props;
    const [pianoChannel, setPianoChannel] = useState<number>(0);
    const waveForms = Object.values(services.vesProjectService.getProjectDataItemsForType('WaveForm') || {}) as (WaveFormData & WithContributor & WithFileUri)[];

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

    const setFrequency = (channel: number, frequency: number): void => {
        if (channel < 0 || channel > VSU_NUMBER_OF_CHANNELS) {
            return;
        }

        setChannelData(channel, {
            ...data.channels[channel],
            frequency: clamp(frequency, VSU_FREQUENCY_MIN, VSU_FREQUENCY_MAX),
        });
    };

    return <VContainer>
        <VsuEmulator
            data={data}
        />
        <Tabs>
            <TabList>
                <Tab key="tab-channels">
                    {nls.localize('vuengine/vsuSandbox/channels', 'Channels')}
                </Tab>
                {([...Array(VSU_NUMBER_OF_WAVEFORM_BANKS)].map((v, x) =>
                    <Tab key={`tab-waveform-${x}`}>
                        {nls.localize('vuengine/vsuSandbox/waveForm', 'WaveForm')} {x + 1}
                    </Tab>
                ))}
                <Tab key="tab-mod-data">
                    {nls.localize('vuengine/vsuSandbox/modulationData', 'Modulation Data')}
                </Tab>
            </TabList>
            <TabPanel key="tabpanel-channels">
                <HContainer gap={10} overflow='hidden'>
                    <Piano channel={pianoChannel} setFrequency={setFrequency} />
                    <VContainer gap={15} grow={1} overflow='auto'>
                        {([...Array(VSU_NUMBER_OF_CHANNELS)].map((v, x) =>
                            <React.Fragment key={x}>
                                <Channel
                                    index={x + 1}
                                    supportSweepAndModulation={x === 4}
                                    isNoiseChannel={x === 5}
                                    channel={data.channels[x]}
                                    setChannel={(channelData: VsuChannelData) => setChannelData(x, channelData)}
                                    waveForms={data.waveforms}
                                    setPianoChannel={setPianoChannel}
                                />
                                {x < 5 &&
                                    <hr />
                                }
                            </React.Fragment>
                        ))}
                    </VContainer>
                </HContainer>
            </TabPanel>
            {([...Array(VSU_NUMBER_OF_WAVEFORM_BANKS)].map((v, x) =>
                <TabPanel key={`tabpanel-waveform-${x}`}>
                    <VContainer gap={15} grow={1}>
                        <VContainer>
                            <label>
                                {nls.localize('vuengine/vsuSandbox/presetsClickToApply', 'Presets (Click to apply)')}
                            </label>
                            <HContainer overflow='scroll'>
                                {(Object.values(waveForms).map((w, y) =>
                                    <NumberArrayPreview
                                        key={`tabpanel-waveform-${x}-${y}`}
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
