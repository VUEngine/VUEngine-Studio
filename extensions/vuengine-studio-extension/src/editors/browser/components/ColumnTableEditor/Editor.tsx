import { nls } from '@theia/core';
import React from 'react';
import { ColumnTableEntry } from './ColumnTableTypes';
import EditorColumn from './EditorColumn';

interface EditorProps {
    mirror: boolean
    values: ColumnTableEntry[]
    setValue: (index: number, value: ColumnTableEntry) => void
}

export default function Editor(props: EditorProps): React.JSX.Element {
    const { mirror, values, setValue } = props;

    return <div className='editor'>
        {[...Array(8)].map((i, j) => (!mirror || j < 4) &&
            <div
                key={j}
            >
                <div className='editorRowHeader'>
                    <div>
                        {nls.localize('vuengine/columnTableEditor/repeat', 'Repeat')}
                    </div>
                    <div>
                        {nls.localize('vuengine/columnTableEditor/duration', 'Duration')}
                    </div>
                </div>
                {[...Array(32)].map((h, y) => {
                    const index = y + (j * 32);
                    const value = values[index] ?? {};
                    return <EditorColumn
                        key={index}
                        index={index}
                        value={value}
                        setValue={setValue}
                    />;
                })}
            </div>
        )}
    </div>;
}
