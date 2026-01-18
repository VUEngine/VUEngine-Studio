import { nls } from '@theia/core';
import React from 'react';
import { ColumnTableEntry } from './ColumnTableTypes';
import EditorColumn from './EditorColumn';
import styled from 'styled-components';

const StyledEditor = styled.div`
    display: flex;
    flex-direction: column;
    gap: 10px;
    user-select: none;

    > div {
        display: flex;
        gap: 2px;
        overflow-x: auto;
        padding-bottom: var(--theia-ui-padding);
    }

    > div > div {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    gap: 2px;
    min-width: 20px;
    }

    .theia-input {
        font-size: 12px;
        padding: 0;
        text-align: center;
    }

    input[type=number]::-webkit-inner-spin-button,
    input[type=number]::-webkit-outer-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }

    .index {
        align-items: center;
        color: var(--theia-input-background);
        display: flex;
        font-size: 8px;
        justify-content: center;
        line-height: 14px;
    }
`;

const EditorRomHeader = styled.div`
    padding: 16px 4px 0 0;

    div {
        color: var(--theia-input-background);
        font-size: 8px;
        line-height: var(--theia-content-line-height);
        text-align: right;
    }
`;

interface EditorProps {
    mirror: boolean
    values: ColumnTableEntry[]
    setValue: (index: number, value: ColumnTableEntry) => void
}

export default function Editor(props: EditorProps): React.JSX.Element {
    const { mirror, values, setValue } = props;

    return <StyledEditor>
        {[...Array(8)].map((i, j) => (!mirror || j < 4) &&
            <div
                key={j}
            >
                <EditorRomHeader>
                    <div>
                        {nls.localize('vuengine/editors/columnTable/repeat', 'Repeat')}
                    </div>
                    <div>
                        {nls.localize('vuengine/editors/columnTable/duration', 'Duration')}
                    </div>
                </EditorRomHeader>
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
    </StyledEditor>;
}
