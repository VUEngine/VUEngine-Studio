import { nls } from '@theia/core';
import React, { Dispatch, SetStateAction, useContext } from 'react';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import AdvancedSelect from '../../Common/Base/AdvancedSelect';
import HContainer from '../../Common/Base/HContainer';
import VContainer from '../../Common/Base/VContainer';
import InfoLabel from '../../Common/InfoLabel';
import { COLOR_PALETTE, DEFAULT_COLOR_INDEX } from '../../Common/PaletteColorSelect';
import { ChannelConfig, INPUT_BLOCKING_COMMANDS, SoundData } from '../SoundEditorTypes';
import { InputWithAction, InputWithActionButton } from './Instruments';

interface CurrentChannelProps {
    soundData: SoundData
    currentChannelId: number
    setCurrentChannelId: Dispatch<SetStateAction<number>>
    setCurrentPatternId: Dispatch<SetStateAction<number>>
    setChannel: (channelId: number, channel: Partial<ChannelConfig>) => void
    editInstrument: (instrument: string) => void
}

export default function CurrentChannel(props: CurrentChannelProps): React.JSX.Element {
    const { disableCommands, enableCommands } = useContext(EditorsContext) as EditorsContextType;
    const {
        soundData,
        currentChannelId, setCurrentChannelId,
        // setCurrentPatternId,
        setChannel,
        editInstrument,
    } = props;

    const channel = soundData.channels[currentChannelId];

    const onSelectChannel = (channelId: number): void => {
        setCurrentChannelId(channelId);
        // setCurrentPatternId(soundData.channels[channelId].sequence[0] ?? 0);
    };

    const setChannelInstrument = (instrumentId: string): void => {
        setChannel(currentChannelId, {
            instrument: instrumentId,
        });
    };

    const toggleChannelAllowSkip = (): void => {
        setChannel(currentChannelId, {
            allowSkip: !soundData.channels[currentChannelId].allowSkip,
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
                        label: `${nls.localize('vuengine/editors/sound/wave', 'Wave')} 1`,
                        value: '0',
                    }, {
                        label: `${nls.localize('vuengine/editors/sound/wave', 'Wave')} 2`,
                        value: '1',
                    }, {
                        label: `${nls.localize('vuengine/editors/sound/wave', 'Wave')} 3`,
                        value: '2',
                    }, {
                        label: `${nls.localize('vuengine/editors/sound/wave', 'Wave')} 4`,
                        value: '3',
                    }, {
                        label: nls.localize('vuengine/editors/sound/sweepModulation', 'Sweep / Modulation'),
                        value: '4',
                    }, {
                        label: nls.localize('vuengine/editors/sound/noise', 'Noise'),
                        value: '5',
                    }]}
                    defaultValue={`${channel.id}`}
                    onChange={options => onSelectChannel(parseInt(options[0]))}
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
                            options={Object.keys(soundData.instruments)
                                .sort((a, b) => soundData.instruments[a].name.localeCompare(soundData.instruments[b].name))
                                .map((instrumentId, i) => {
                                    const instrument = soundData.instruments[instrumentId];
                                    return {
                                        value: `${instrumentId}`,
                                        label: instrument.name.length ? instrument.name : (i + 1).toString(),
                                        disabled: instrument.type !== channel.type,
                                        backgroundColor: COLOR_PALETTE[instrument.color ?? DEFAULT_COLOR_INDEX],
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
