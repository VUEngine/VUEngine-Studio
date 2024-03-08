import React from 'react';
import { clamp } from '../Common/Utils';
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
        <input
            className="theia-input"
            type="number"
            step="1"
            min="1"
            max="16"
            value={value.repeat ?? 16}
            onClick={selectInput}
            onChange={e => setValue(index, {
                ...value,
                repeat: clamp(parseInt(e.target.value === '' ? '16' : e.target.value), 1, 16),
            })}
        />
        <input
            className="theia-input"
            type="number"
            step="1"
            min="1"
            max="16"
            value={value.time ?? 16}
            onClick={selectInput}
            onChange={e => setValue(index, {
                ...value,
                time: clamp(parseInt(e.target.value === '' ? '16' : e.target.value), 1, 16),
            })}
        />
    </div>;
}
