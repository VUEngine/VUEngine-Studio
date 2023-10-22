import { nls } from '@theia/core';
import React from 'react';
import VContainer from '../Common/VContainer';
import { ColumnTableData, ColumnTableEntry } from './ColumnTableTypes';
import Editor from './Editor';

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

    protected onChangeName(e: React.ChangeEvent<HTMLInputElement>): void {
        this.props.updateData({
            ...this.props.data,
            name: e.target.value.trim()
        });
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
        const updatedValues = this.props.data.values;
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
            <div className='options'>
                <div>
                    <VContainer>
                        <label>
                            {nls.localize('vuengine/columnTableEditor/name', 'Name')}
                        </label>
                        <input
                            className="theia-input"
                            value={data.name}
                            onChange={this.onChangeName.bind(this)}
                        />
                    </VContainer>
                    <VContainer>
                        <label>
                            {nls.localize('vuengine/columnTableEditor/description', 'Description')}
                        </label>
                        <input
                            className="theia-input"
                            value={data.description}
                            onChange={this.onChangeDescription.bind(this)}
                        />
                    </VContainer>
                    <label>
                        <input
                            type="checkbox"
                            checked={data.mirror}
                            onChange={this.onChangeMirror.bind(this)}
                        />
                        {nls.localize('vuengine/columnTableEditor/mirror', 'Mirror')}
                    </label>
                </div>
            </div>

            <Editor
                mirror={data.mirror}
                values={data.values}
                setValue={this.setValue.bind(this)}
            />
        </div>;
    }
}
