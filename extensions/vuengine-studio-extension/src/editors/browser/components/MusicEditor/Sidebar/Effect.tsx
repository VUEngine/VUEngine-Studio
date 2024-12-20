import { nls } from '@theia/core';
import React from 'react';
import HContainer from '../../Common/Base/HContainer';
import VContainer from '../../Common/Base/VContainer';
import InfoLabel from '../../Common/InfoLabel';
import { clamp } from '../../Common/Utils';
import { MusicEvent, SongData } from '../MusicEditorTypes';
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
    songData: SongData
    event: MusicEvent
    value: any
    setValue: (value: any) => void
    removeEvent: (event: MusicEvent) => void
}

export default function Effect(props: EffectProps): React.JSX.Element {
    const { songData, event, value, setValue, removeEvent } = props;

    const eventDetails = AVAILABLE_EVENTS[event];

    return (
        <VContainer className="item">
            <button
                className="remove-button"
                onClick={() => removeEvent(event)}
                title={nls.localize('vuengine/entityEditor/removeEffect', 'Remove Effect')}
            >
                <i className='codicon codicon-x' />
            </button>
            <InfoLabel
                label={eventDetails.label}
                tooltip={eventDetails.description}
            />

            {event === MusicEvent.Volume &&
                <VContainer>
                    <HContainer alignItems="center">
                        <div style={{ minWidth: 10, width: 10 }}>
                            L
                        </div>
                        <input
                            type="range"
                            value={getNthByte(value, 1)}
                            max={15}
                            min={0}
                            step={1}
                            onChange={e => setValue(setNthByte(value, 1, parseInt(e.target.value)))}
                        />
                        <div style={{ minWidth: 24, overflow: 'hidden', textAlign: 'right', width: 24 }}>
                            {getNthByte(value, 1)}
                        </div>
                    </HContainer>
                    <HContainer alignItems="center">
                        <div style={{ minWidth: 10, width: 10 }}>
                            R
                        </div>
                        <input
                            type="range"
                            value={getNthByte(value, 0)}
                            max={15}
                            min={0}
                            step={1}
                            onChange={e => setValue(setNthByte(value, 0, parseInt(e.target.value)))}
                        />
                        <div style={{ minWidth: 24, overflow: 'hidden', textAlign: 'right', width: 24 }}>
                            {getNthByte(value, 0)}
                        </div>
                    </HContainer>
                </VContainer>
            }

            {event === MusicEvent.Instrument &&
                <VContainer>
                    <select
                        className='theia-select'
                        onChange={e => setValue(parseInt(e.target.value))}
                        value={value}
                    >
                        {songData.instruments.map((n, i) =>
                            <option key={i} value={i}>{n.name}</option>
                        )}
                    </select>
                </VContainer>
            }

        </VContainer>
    );
}
