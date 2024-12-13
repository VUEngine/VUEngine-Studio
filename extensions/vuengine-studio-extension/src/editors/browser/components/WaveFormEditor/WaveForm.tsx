import React from 'react';
import VerticalRangeInput from '../Common/Base/VerticalRangeInput';

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
                const v = value[y] ?? 64;
                return <VerticalRangeInput
                    key={y}
                    index={y}
                    min={1}
                    max={64}
                    value={v}
                    setValue={(x: number) => setIndividualValue(y, x)}
                />;
            })}
        </div>
    </div>;
}
