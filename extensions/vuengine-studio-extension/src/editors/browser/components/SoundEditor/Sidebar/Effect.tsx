import { nls } from '@theia/core';
import React from 'react';
import AdvancedSelect from '../../Common/Base/AdvancedSelect';
import HContainer from '../../Common/Base/HContainer';
import Range from '../../Common/Base/Range';
import VContainer from '../../Common/Base/VContainer';
import InfoLabel from '../../Common/InfoLabel';
import { clamp } from '../../Common/Utils';
import { INPUT_BLOCKING_COMMANDS } from '../SoundEditor';
import { SoundEvent, SoundData } from '../SoundEditorTypes';
import { AVAILABLE_EVENTS } from './AvailableEvents';

const getNthByte = (num: number, byte: number): number =>
    parseInt('0x' + (clamp((num ?? 0), 0, 255).toString(16).padStart(2, '0'))[byte]);
const setNthByte = (num: number, byte: number, newValue: number): number => {
    const numString = clamp((num ?? 0), 0, 255).toString(16).padStart(2, '0');
    const numNewValue = clamp((newValue ?? 0), 0, 15).toString(16);
    const replacedNumString = numString.substring(0, byte)
        + numNewValue
        + numString.substring(byte + 1);
    return parseInt('0x' + replacedNumString);
};

interface EffectProps {
    songData: SoundData
    currentChannelId: number
    event: SoundEvent
    value: any
    setValue: (value: any) => void
    removeEvent: (event: SoundEvent) => void
}

export default function Effect(props: EffectProps): React.JSX.Element {
    const { songData, currentChannelId, event, value, setValue, removeEvent } = props;

    const eventDetails = AVAILABLE_EVENTS[event];
    const channel = songData.channels[currentChannelId];

    return (
        <VContainer className="item">
            <button
                className="remove-button"
                onClick={() => removeEvent(event)}
                title={nls.localizeByDefault('Remove')}
            >
                <i className='codicon codicon-x' />
            </button>
            <InfoLabel
                label={eventDetails.label}
                tooltip={eventDetails.description}
            />

            {event === SoundEvent.Volume &&
                <VContainer>
                    <HContainer alignItems="center">
                        <div style={{ minWidth: 10, width: 10 }}>
                            L
                        </div>
                        <Range
                            value={getNthByte(value, 0)}
                            max={15}
                            min={0}
                            setValue={(v: number) => setValue(setNthByte(value, 0, v))}
                            width="100%"
                            commandsToDisable={INPUT_BLOCKING_COMMANDS}
                        />
                    </HContainer>
                    <HContainer alignItems="center">
                        <div style={{ minWidth: 10, width: 10 }}>
                            R
                        </div>
                        <Range
                            value={getNthByte(value, 1)}
                            max={15}
                            min={0}
                            setValue={(v: number) => setValue(setNthByte(value, 1, v))}
                            width="100%"
                            commandsToDisable={INPUT_BLOCKING_COMMANDS}
                        />
                    </HContainer>
                </VContainer>
            }

            {event === SoundEvent.MasterVolume &&
                <Range
                    value={value}
                    max={15}
                    min={0}
                    setValue={setValue}
                    width="100%"
                    commandsToDisable={INPUT_BLOCKING_COMMANDS}
                />
            }

            {(
                event === SoundEvent.NoteCut ||
                event === SoundEvent.PortamentoDown ||
                event === SoundEvent.PortamentoUp
            ) &&
                <Range
                    value={value}
                    max={255}
                    min={0}
                    setValue={setValue}
                    width="100%"
                    commandsToDisable={INPUT_BLOCKING_COMMANDS}
                />
            }

            {event === SoundEvent.Instrument &&
                <VContainer>
                    <AdvancedSelect
                        options={Object.keys(songData.instruments).map((instrumentId, i) => {
                            const instrument = songData.instruments[instrumentId];
                            return {
                                value: `${instrumentId}`,
                                label: `${i + 1}: ${instrument.name}`,
                                disabled: instrument.type !== channel.type,
                            };
                        })}
                        defaultValue={value}
                        onChange={options => setValue(parseInt(options[0]))}
                        commands={INPUT_BLOCKING_COMMANDS}
                    />
                </VContainer>
            }

        </VContainer>
    );
}
