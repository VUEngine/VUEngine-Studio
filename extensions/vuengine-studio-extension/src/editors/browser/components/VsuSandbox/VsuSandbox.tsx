import { nls } from '@theia/core';
import React from 'react';
import { Tab, TabList, TabPanel, Tabs } from 'react-tabs';
import VContainer from '../Common/VContainer';
import WaveForm from '../WaveFormEditor/WaveForm';
import ModulationData from './ModulationData';
import { NUMBER_OF_CHANNELS, NUMBER_OF_WAVEFORM_BANKS, VsuChannelData, VsuData } from './VsuSandboxTypes';
import Channel from './Channel';

interface VsuSandboxProps {
    data: VsuData
    updateData: (data: VsuData) => void
}

export default function VsuSandbox(props: VsuSandboxProps): React.JSX.Element {
    const { data, updateData } = props;

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

    return <VContainer>
        <Tabs>
            <TabList>
                <Tab>
                    {nls.localize('vuengine/vsuSandbox/channels', 'Channels')}
                </Tab>
                {([...Array(NUMBER_OF_WAVEFORM_BANKS)].map((v, x) =>
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
                    {([...Array(NUMBER_OF_CHANNELS)].map((v, x) =>
                        <>
                            <Channel
                                key={x}
                                index={x + 1}
                                supportSweepAndModulation={x === 4}
                                isNoiseChannel={x === 5}
                                channel={data.channels[x]}
                                setChannel={(channelData: VsuChannelData) => setChannelData(x, channelData)}
                                waveForms={data.waveforms}
                                modulationData={data.modulation}
                            />
                            {x < 5 &&
                                <hr />
                            }
                        </>
                    ))}
                </VContainer>
            </TabPanel>
            {([...Array(NUMBER_OF_WAVEFORM_BANKS)].map((v, x) =>
                <TabPanel key={x}>
                    <WaveForm
                        value={data.waveforms[x] ?? []}
                        setValue={(waveform: number[]) => setWaveform(x, waveform)}
                    />
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
