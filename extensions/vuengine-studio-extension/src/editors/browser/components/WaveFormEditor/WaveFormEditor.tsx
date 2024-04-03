import React from 'react';
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
            <Editor
                values={data.values}
                setValue={this.setValue.bind(this)}
            />
        </div>;
    }
}
