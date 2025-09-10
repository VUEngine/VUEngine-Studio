import React from 'react';
import Input from '../Common/Base/Input';
import { ColumnTableEntry } from './ColumnTableTypes';

interface EditorColumnProps {
    index: number
    value: ColumnTableEntry
    setValue: (index: number, value: ColumnTableEntry) => void
}

export default function EditorColumn(props: EditorColumnProps): React.JSX.Element {
    const { index, value, setValue } = props;

    const selectInput = (event: React.MouseEvent) => // @ts-ignore
        event.target.select();

    return <div
        className={`editor-col-${index}`}
    >
        <div className='index'>
            {index + 1}
        </div>
        <Input
            type="number"
            min={1}
            max={16}
            defaultValue={16}
            value={value.repeat ?? 16}
            setValue={v => setValue(index, {
                ...value,
                repeat: v as number,
            })}
            onClick={selectInput}
        />
        <Input
            type="number"
            min={1}
            max={16}
            defaultValue={16}
            value={value.time ?? 16}
            setValue={v => setValue(index, {
                ...value,
                time: v as number,
            })}
            onClick={selectInput}
        />
    </div>;
}
