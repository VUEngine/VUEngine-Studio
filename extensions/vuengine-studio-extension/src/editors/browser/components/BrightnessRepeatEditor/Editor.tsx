import React from 'react';
import EditorColumn from './EditorColumn';

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
                const brightness = values[index] ?? 15;
                return <EditorColumn
                    key={`editor-col-${index}`}
                    brightness={brightness}
                    index={index}
                    setValue={setValue}
                />;
            })}
        </div>
        {
            !mirror &&
            <div>
                {[...Array(48)].map((h, y) => {
                    const index = y + 48;
                    const brightness = values[index] ?? 15;
                    return <EditorColumn
                        key={`editor-col-${index}`}
                        brightness={brightness}
                        index={index}
                        setValue={setValue}
                    />;
                })}
            </div>
        }
    </div>;
}
