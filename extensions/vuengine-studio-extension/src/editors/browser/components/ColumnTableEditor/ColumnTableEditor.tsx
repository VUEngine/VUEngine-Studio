import { nls } from '@theia/core';
import React from 'react';
import ReactTextareaAutosize from 'react-textarea-autosize';
import Checkbox from '../Common/Base/Checkbox';
import VContainer from '../Common/Base/VContainer';
import { ColumnTableData, ColumnTableEntry } from './ColumnTableTypes';
import Editor from './Editor';

interface ColumnTableEditorProps {
    data: ColumnTableData
    updateData: (data: ColumnTableData) => void
}

export default function ColumnTableEditor(props: ColumnTableEditorProps): React.JSX.Element {
    const { data, updateData } = props;

    const onChangeDescription = (e: React.ChangeEvent<HTMLTextAreaElement>): void => {
        updateData({
            ...data,
            description: e.target.value
        });
    };

    const onChangeMirror = (): void => {
        updateData({
            ...data,
            mirror: !data.mirror
        });
    };

    const setValue = (index: number, value: ColumnTableEntry): void => {
        const updatedValues = [...data.values];
        updatedValues[index] = value;
        updateData({
            ...data,
            values: updatedValues
        });
    };

    return (
        <VContainer gap={20}>
            <VContainer gap={15} style={{ maxWidth: 500 }}>
                <VContainer>
                    <label>
                        {nls.localizeByDefault('Description')}
                    </label>
                    <ReactTextareaAutosize
                        className="theia-input"
                        value={data.description}
                        minRows={2}
                        maxRows={4}
                        onChange={onChangeDescription}
                        style={{ resize: 'none' }}
                    />
                </VContainer>
                <Checkbox
                    sideLabel={nls.localize('vuengine/editors/columnTable/mirror', 'Mirror')}
                    checked={data.mirror}
                    setChecked={onChangeMirror}
                />
            </VContainer>
            <Editor
                mirror={data.mirror}
                values={data.values}
                setValue={setValue}
            />
        </VContainer>
    );
}
