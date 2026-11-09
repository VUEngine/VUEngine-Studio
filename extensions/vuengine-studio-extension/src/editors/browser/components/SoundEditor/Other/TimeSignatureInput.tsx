import React from 'react';
import BasicSelect from '../../Common/Base/BasicSelect';
import HContainer from '../../Common/Base/HContainer';
import Input from '../../Common/Base/Input';
import { clamp } from '../../Common/Utils';
import {
    parseTimeSignature,
    TIME_SIGNATURE_BEAT_UNITS,
    TIME_SIGNATURE_BEATS_MAX,
    TIME_SIGNATURE_BEATS_MIN
} from './timeSignature';

interface TimeSignatureInputProps {
    value: string
    setValue: (value: string) => void
    width?: number
}

export default function TimeSignatureInput(props: TimeSignatureInputProps): React.JSX.Element {
    const { value, setValue, width } = props;
    const { beats, beatUnit } = parseTimeSignature(value);

    return (
        <HContainer alignItems='center' gap={4} className='timeSignatureInput'>
            <Input
                type='number'
                value={beats}
                setValue={v => setValue(`${clamp(v as number, TIME_SIGNATURE_BEATS_MIN, TIME_SIGNATURE_BEATS_MAX)}/${beatUnit}`)}
                min={TIME_SIGNATURE_BEATS_MIN}
                max={TIME_SIGNATURE_BEATS_MAX}
                width={width}
            />
            /
            <BasicSelect
                options={TIME_SIGNATURE_BEAT_UNITS.map(u => ({
                    value: u,
                    label: u.toString(),
                }))}
                value={beatUnit}
                onChange={e => setValue(`${beats}/${parseInt(e.target.value)}`)}
                style={{ width }}
            />
        </HContainer>
    );
}
