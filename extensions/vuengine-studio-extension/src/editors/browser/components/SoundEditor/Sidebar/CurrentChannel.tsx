import { nls } from '@theia/core';
import React, { useContext } from 'react';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import AdvancedSelect from '../../Common/Base/AdvancedSelect';
import HContainer from '../../Common/Base/HContainer';
import VContainer from '../../Common/Base/VContainer';
import InfoLabel from '../../Common/InfoLabel';
import { COLOR_PALETTE } from '../../Common/PaletteColorSelect';
import { INPUT_BLOCKING_COMMANDS } from '../SoundEditor';
import { ChannelConfig, SoundData } from '../SoundEditorTypes';
import { InputWithAction, InputWithActionButton } from './Instruments';

interface CurrentChannelProps {
    songData: SoundData
    currentChannelId: number
    setCurrentChannelId: (channelId: number) => void
    setChannel: (channelId: number, channel: Partial<ChannelConfig>) => void
    editInstrument: (instrument: string) => void
}

export default function CurrentChannel(props: CurrentChannelProps): React.JSX.Element {
    const { disableCommands, enableCommands } = useContext(EditorsContext) as EditorsContextType;
    const {
        songData,
        currentChannelId, setCurrentChannelId,
        setChannel,
        editInstrument,
    } = props;

    const channel = songData.channels[currentChannelId];

    const setChannelInstrument = (instrumentId: string): void => {
        setChannel(currentChannelId, {
            instrument: instrumentId,
        });
    };

    const toggleChannelAllowSkip = (): void => {
        setChannel(currentChannelId, {
            allowSkip: !songData.channels[currentChannelId].allowSkip,
        });
    };

    return (
        <VContainer gap={15}>
            <VContainer>
                <label>
                    {nls.localize('vuengine/editors/sound/currentChannel', 'Current Channel')}
                </label>
                <AdvancedSelect
                    options={[{
                        label: `1: ${nls.localize('vuengine/editors/sound/wave', 'Wave')} 1`,
                        value: '0',
                    }, {
                        label: `2: ${nls.localize('vuengine/editors/sound/wave', 'Wave')} 2`,
                        value: '1',
                    }, {
                        label: `3: ${nls.localize('vuengine/editors/sound/wave', 'Wave')} 3`,
                        value: '2',
                    }, {
                        label: `4: ${nls.localize('vuengine/editors/sound/wave', 'Wave')} 4`,
                        value: '3',
                    }, {
                        label: `5: ${nls.localize('vuengine/editors/sound/sweepModulation', 'Sweep / Modulation')}`,
                        value: '4',
                    }, {
                        label: `6: ${nls.localize('vuengine/editors/sound/noise', 'Noise')}`,
                        value: '5',
                    }]}
                    defaultValue={`${channel.id}`}
                    onChange={options => setCurrentChannelId(parseInt(options[0]))}
                    commands={INPUT_BLOCKING_COMMANDS}
                />
            </VContainer>

            <HContainer gap={15}>
                <VContainer grow={1}>
                    <label>
                        {nls.localize('vuengine/editors/sound/defaultInstrument', 'Default Instrument')}
                    </label>
                    <InputWithAction>
                        <AdvancedSelect
                            options={Object.keys(songData.instruments)
                                .sort((a, b) => songData.instruments[a].name.localeCompare(songData.instruments[b].name))
                                .map((instrumentId, i) => {
                                    const instrument = songData.instruments[instrumentId];
                                    return {
                                        value: `${instrumentId}`,
                                        label: `${i + 1}: ${instrument.name}`,
                                        disabled: instrument.type !== channel.type,
                                        backgroundColor: COLOR_PALETTE[instrument.color ?? 4],
                                    };
                                })}
                            defaultValue={`${channel.instrument}`}
                            onChange={options => setChannelInstrument(options[0])}
                            commands={INPUT_BLOCKING_COMMANDS}
                        />
                        <InputWithActionButton
                            className='theia-button secondary'
                            title={nls.localize('vuengine/editors/sound/editInstrument', 'Edit Instrument')}
                            onClick={() => editInstrument(channel.instrument)}
                            onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                            onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                        >
                            <i className='codicon codicon-settings-gear' />
                        </InputWithActionButton>
                    </InputWithAction>
                </VContainer>
                <VContainer>
                    <InfoLabel
                        label={nls.localize('vuengine/editors/sound/skip', 'Skip')}
                        tooltip={nls.localize(
                            'vuengine/editors/sound/allowSkipDescription',
                            'Allow to skip notes during play back if no sound source is available when requested.'
                        )}
                    />
                    <input
                        type="checkbox"
                        checked={channel.allowSkip}
                        onChange={() => toggleChannelAllowSkip()}
                        onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                        onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                    />
                </VContainer>
            </HContainer>
        </VContainer>
    );
}
