import React from 'react';
import VerticalRangeInput from '../Common/VerticalRangeInput';

interface EditorProps {
    values: number[]
    setValue: (index: number, value: number) => void
}

export default function Editor(props: EditorProps): React.JSX.Element {
    const { values, setValue } = props;

    return <div className='editor'>
        <div>
            {[...Array(32)].map((h, y) => {
                const index = y;
                const value = values[index] ?? 64;
                return <VerticalRangeInput
                    key={index}
                    index={index}
                    min={1}
                    max={64}
                    value={value}
                    setValue={(v: number) => setValue(index, v)}
                />;
            })}
        </div>
    </div>;
}
