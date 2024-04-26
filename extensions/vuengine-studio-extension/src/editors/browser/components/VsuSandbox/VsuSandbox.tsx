import { nls } from '@theia/core';
import React, { useContext } from 'react';
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
import { NUMBER_OF_CHANNELS, NUMBER_OF_WAVEFORM_BANKS, VsuChannelData, VsuData } from './VsuSandboxTypes';

interface VsuSandboxProps {
    data: VsuData
    updateData: (data: VsuData) => void
}

export default function VsuSandbox(props: VsuSandboxProps): React.JSX.Element {
    const { services } = useContext(EditorsContext) as EditorsContextType;
    const { data, updateData } = props;
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
                    <VContainer gap={15} grow={1}>
                        <HContainer overflow='scroll'>
                            {(Object.values(waveForms).map((w, y) =>
                                <NumberArrayPreview
                                    key={y}
                                    maximum={64}
                                    data={w.values}
                                    onClick={() => setWaveform(x, w.values)}
                                    title={w._fileUri.path.name}
                                />
                            ))}
                        </HContainer>
                        <WaveForm
                            value={data.waveforms[x] ?? []}
                            setValue={(waveform: number[]) => setWaveform(x, waveform)}
                        />
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
