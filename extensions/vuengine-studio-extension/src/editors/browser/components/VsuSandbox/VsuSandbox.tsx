import { nls } from '@theia/core';
import React, { useContext, useState } from 'react';
import { Tab, TabList, TabPanel, Tabs } from 'react-tabs';
import { VesEditorsPreferenceIds } from '../../ves-editors-preferences';
import { EditorsContext, EditorsContextType } from '../../ves-editors-types';
import HContainer from '../Common/Base/HContainer';
import VContainer from '../Common/Base/VContainer';
import { clamp } from '../Common/Utils';
import { VSU_FREQUENCY_MAX, VSU_FREQUENCY_MIN, VSU_NUMBER_OF_CHANNELS, VSU_NUMBER_OF_WAVEFORM_BANKS, VsuChannelData, VsuData } from '../SoundEditor/Emulator/VsuTypes';
import Channel from './Channel';
import ModulationData from './ModulationData';
import Piano from './Piano';
import WaveformWithPresets from './WaveformWithPresets';

interface VsuSandboxProps {
    data: VsuData
    updateData: (data: VsuData) => void
}

export default function VsuSandbox(props: VsuSandboxProps): React.JSX.Element {
    const { services } = useContext(EditorsContext) as EditorsContextType;
    const { data, updateData } = props;
    const [pianoChannel, setPianoChannel] = useState<number>(0);
    const autoPlay = services.preferenceService.get(VesEditorsPreferenceIds.EDITORS_VSU_SANDBOX_AUTO_START) as boolean;
    const [enabled, setEnabled] = useState<boolean>(autoPlay);

    const toggleEnabled = () => {
        const updatedEnabled = !enabled;
        setEnabled(updatedEnabled);
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
        <button
            className={enabled
                ? 'theia-button'
                : 'theia-button secondary'
            }
            style={{
                width: 70,
            }}
            onClick={toggleEnabled}
        >
            <i className={`fa fa-${enabled ? 'stop' : 'play'}`}
            />
        </button>
        <Tabs>
            <TabList>
                <Tab key="tab-channels">
                    {nls.localize('vuengine/editors/vsuSandbox/channels', 'Channels')}
                </Tab>
                {([...Array(VSU_NUMBER_OF_WAVEFORM_BANKS)].map((v, x) =>
                    <Tab key={`tab-waveform-${x}`}>
                        {nls.localize('vuengine/editors/vsuSandbox/waveForm', 'WaveForm')} {x + 1}
                    </Tab>
                ))}
                <Tab key="tab-mod-data">
                    {nls.localize('vuengine/editors/vsuSandbox/modulationData', 'Modulation Data')}
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
                    <WaveformWithPresets
                        value={data.waveforms[x]}
                        setValue={value => setWaveform(x, value)}
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
    </VContainer >;
}
