import React from 'react';
import VerticalRangeInput from '../Common/VerticalRangeInput';

interface EditorProps {
    mirror: boolean
    values: number[]
    setValue: (index: number, value: number) => void
}

export default function Editor(props: EditorProps): React.JSX.Element {
    const { mirror, values, setValue } = props;

    return <div className='editor'>
        <div>
            {[...Array(48)].map((h, y) => {
                const index = y;
                const brightness = values[index] ?? 0;
                return <VerticalRangeInput
                    key={index}
                    index={index}
                    min={1}
                    max={16}
                    maxWidth={24}
                    barHeight={320}
                    value={brightness + 1}
                    setValue={(value: number) => setValue(index, value - 1)}
                />;
            })}
        </div>
        {
            !mirror &&
            <div>
                {[...Array(48)].map((h, y) => {
                    const index = y + 48;
                    const brightness = values[index] ?? 0;
                    return <VerticalRangeInput
                        key={index}
                        index={index}
                        min={1}
                        max={16}
                        maxWidth={24}
                        barHeight={320}
                        value={brightness + 1}
                        setValue={(value: number) => setValue(index, value - 1)}
                    />;
                })}
            </div>
        }
    </div>;
}
