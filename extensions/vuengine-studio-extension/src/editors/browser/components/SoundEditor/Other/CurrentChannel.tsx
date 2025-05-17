import { Trash } from '@phosphor-icons/react';
import { nls } from '@theia/core';
import { ConfirmDialog } from '@theia/core/lib/browser';
import React, { Dispatch, SetStateAction, useContext } from 'react';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import AdvancedSelect from '../../Common/Base/AdvancedSelect';
import VContainer from '../../Common/Base/VContainer';
import InfoLabel from '../../Common/InfoLabel';
import { COLOR_PALETTE, DEFAULT_COLOR_INDEX } from '../../Common/PaletteColorSelect';
import { VSU_NUMBER_OF_CHANNELS } from '../Emulator/VsuTypes';
import { SoundEditorCommands } from '../SoundEditorCommands';
import { ChannelConfig, INPUT_BLOCKING_COMMANDS, SoundData, SoundEditorChannelType } from '../SoundEditorTypes';
import { InputWithAction, InputWithActionButton } from './Instruments';

interface CurrentChannelProps {
    soundData: SoundData
    currentChannelId: number
    setCurrentChannelId: Dispatch<SetStateAction<number>>
    setCurrentPatternId: Dispatch<SetStateAction<string>>
    setChannel: (channelId: number, channel: Partial<ChannelConfig>) => void
    editInstrument: (instrument: string) => void
}

export default function CurrentChannel(props: CurrentChannelProps): React.JSX.Element {
    const { services } = useContext(EditorsContext) as EditorsContextType;
    const {
        soundData,
        currentChannelId, setCurrentChannelId,
        setCurrentPatternId,
        setChannel,
        editInstrument,
    } = props;

    const channel = soundData.channels[currentChannelId];

    const onSelectChannel = (channelId: number): void => {
        setCurrentChannelId(channelId);
        setCurrentPatternId(Object.values(soundData.channels[channelId].sequence)[0] ?? '');
    };

    const setChannelInstrument = (instrumentId: string): void => {
        setChannel(currentChannelId, {
            instrument: instrumentId,
        });
    };

    const removeChannel = async () => {
        const dialog = new ConfirmDialog({
            title: nls.localize('vuengine/editors/sound/deleteChannelQuestion', 'Delete Channel?'),
            msg: nls.localize('vuengine/editors/sound/areYouSureYouWantToDeleteChannel', 'Are you sure you want to completely delete this channel?'),
        });
        const remove = await dialog.open();
        if (remove) {
            // TODO
            alert('not yet implemented');
        }
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
                <InputWithAction>
                    <AdvancedSelect
                        options={[...soundData.channels.map((c, i) => {
                            switch (c.type) {
                                default:
                                case SoundEditorChannelType.WAVE:
                                    return {
                                        label: `${nls.localize('vuengine/editors/sound/wave', 'Wave')} ${i + 1}`,
                                        value: i.toString(),
                                    };
                                case SoundEditorChannelType.SWEEPMOD:
                                    return {
                                        label: nls.localize('vuengine/editors/sound/waveSm', 'Wave (Sweep / Modulation)'),
                                        value: i.toString(),
                                    };
                                case SoundEditorChannelType.NOISE:
                                    return {
                                        label: nls.localize('vuengine/editors/sound/noise', 'Noise'),
                                        value: i.toString(),
                                    };
                            }
                        })]}
                        defaultValue={`${currentChannelId}`}
                        onChange={options => onSelectChannel(parseInt(options[0]))}
                        commands={INPUT_BLOCKING_COMMANDS}
                    />
                    <InputWithActionButton
                        className='theia-button secondary'
                        title={nls.localizeByDefault('Remove')}
                        onClick={removeChannel}
                    >
                        <Trash size={16} />
                    </InputWithActionButton>
                    <InputWithActionButton
                        className='theia-button secondary'
                        title={nls.localizeByDefault('Add')}
                        onClick={() => services.commandService.executeCommand(SoundEditorCommands.ADD_CHANNEL.id)}
                        disabled={soundData.channels.length === VSU_NUMBER_OF_CHANNELS}
                    >
                        <i className='codicon codicon-plus' />
                    </InputWithActionButton>
                </InputWithAction>
            </VContainer>

            <VContainer>
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
                    >
                        <i className='codicon codicon-settings-gear' />
                    </InputWithActionButton>
                </InputWithAction>
            </VContainer>

            <VContainer>
                <InfoLabel
                    label={nls.localize('vuengine/editors/sound/allowSkip', 'Allow Skip')}
                    tooltip={nls.localize(
                        'vuengine/editors/sound/allowSkipDescription',
                        'Allow to skip notes during play back if no sound source is available when requested.'
                    )}
                />
                <input
                    type="checkbox"
                    checked={channel.allowSkip}
                    onChange={() => toggleChannelAllowSkip()}
                />
            </VContainer>
        </VContainer>
    );
}
