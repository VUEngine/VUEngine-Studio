import { nls } from '@theia/core';
import React from 'react';
import VContainer from '../Common/Base/VContainer';
import { ColumnTableData, ColumnTableEntry } from './ColumnTableTypes';
import Editor from './Editor';
import ReactTextareaAutosize from 'react-textarea-autosize';

interface ColumnTableEditorProps {
    data: ColumnTableData
    updateData: (data: ColumnTableData) => void
}

interface ColumnTableState {
}

export default class ColumnTableEditor extends React.Component<ColumnTableEditorProps, ColumnTableState> {
    constructor(props: ColumnTableEditorProps) {
        super(props);
        this.state = {
        };
    }

    protected onChangeDescription(e: React.ChangeEvent<HTMLInputElement>): void {
        this.props.updateData({
            ...this.props.data,
            description: e.target.value
        });
    }

    protected onChangeMirror(e: React.ChangeEvent<HTMLInputElement>): void {
        this.props.updateData({
            ...this.props.data,
            mirror: !this.props.data.mirror
        });
    }

    protected setValue(index: number, value: ColumnTableEntry): void {
        const updatedValues = [...this.props.data.values];
        updatedValues[index] = value;
        this.props.updateData({
            ...this.props.data,
            values: updatedValues
        });
    }

    render(): React.JSX.Element {
        const { data } = this.props;

        return <div
            tabIndex={0}
            className='columnTableEditor'
        >
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
                        onChange={this.onChangeDescription.bind(this)}
                        style={{ resize: 'none' }}
                    />
                </VContainer>
                <label>
                    <input
                        type="checkbox"
                        checked={data.mirror}
                        onChange={this.onChangeMirror.bind(this)}
                    />
                    {nls.localize('vuengine/editors/columnTable/mirror', 'Mirror')}
                </label>
            </VContainer>

            <Editor
                mirror={data.mirror}
                values={data.values}
                setValue={this.setValue.bind(this)}
            />
        </div>;
    }
}
