import React from 'react';
import { ColumnTableEntry } from './ColumnTableTypes';

interface EditorColumnProps {
    index: number
    value: ColumnTableEntry
    setValue: (index: number, value: ColumnTableEntry) => void
}

export default function EditorColumn(props: EditorColumnProps): React.JSX.Element {
    const { index, value, setValue } = props;

    const handleSelectInput = (event: React.MouseEvent) => // @ts-ignore
        event.target.select();

    return <div
        key={`editor-col-${index}`}
        className={`editor-col-${index}`}
    >
        <div className='index'>
            {index}
        </div>
        <input
            className="theia-input"
            type="number"
            step="1"
            min={0}
            max={15}
            value={value.repeat ?? 15}
            onClick={handleSelectInput}
            onChange={e => setValue(index, {
                ...value,
                repeat: parseInt(e.target.value)
            })}
        />
        <input
            className="theia-input"
            type="number"
            step="1"
            min={0}
            max={15}
            value={value.time ?? 15}
            onClick={handleSelectInput}
            onChange={e => setValue(index, {
                ...value,
                time: parseInt(e.target.value)
            })}
        />
    </div>;
}
