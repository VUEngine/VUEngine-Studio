import React from 'react';
import VerticalRangeInput from '../Common/Base/VerticalRangeInput';
import { WAVEFORM_MAX, WAVEFORM_MIN } from './WaveFormEditorTypes';

interface WaveFormProps {
    value: number[]
    setValue: (value: number[]) => void
}

export default function WaveForm(props: WaveFormProps): React.JSX.Element {
    const { value, setValue } = props;

    const setIndividualValue = (index: number, v: number): void => {
        const updatedValue = [...value];
        updatedValue[index] = v;
        setValue(updatedValue);
    };

    return <div className='waveform'>
        <div>
            {[...Array(32)].map((h, y) => {
                const v = value[y] ?? WAVEFORM_MAX;
                return <VerticalRangeInput
                    key={y}
                    index={y}
                    min={WAVEFORM_MIN}
                    max={WAVEFORM_MAX}
                    value={v}
                    setValue={(x: number) => setIndividualValue(y, x)}
                />;
            })}
        </div>
    </div>;
}
