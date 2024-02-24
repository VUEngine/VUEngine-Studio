import { nls } from '@theia/core';
import React from 'react';
import VContainer from '../Common/VContainer';
import Editor from './Editor';
import { WaveFormData } from './WaveFormEditorTypes';

interface WaveFormEditorProps {
    data: WaveFormData
    updateData: (data: WaveFormData) => void
}

interface WaveFormState {
}

export default class WaveFormEditor extends React.Component<WaveFormEditorProps, WaveFormState> {
    constructor(props: WaveFormEditorProps) {
        super(props);
        this.state = {
        };
    }

    protected onChangeName(e: React.ChangeEvent<HTMLInputElement>): void {
        this.props.updateData({
            ...this.props.data,
            name: e.target.value
        });
    }

    protected setValue(index: number, value: number): void {
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
            className='waveFormEditor'
        >
            <VContainer style={{ maxWidth: 500 }}>
                <label>
                    {nls.localize('vuengine/waveFormEditor/name', 'Name')}
                </label>
                <input
                    className="theia-input"
                    value={data.name}
                    onChange={this.onChangeName.bind(this)}
                />
            </VContainer>
            <Editor
                values={data.values}
                setValue={this.setValue.bind(this)}
            />
        </div>;
    }
}
