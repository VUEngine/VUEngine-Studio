import React from 'react';
import WaveForm from './WaveForm';
import { WaveFormData } from './WaveFormEditorTypes';

interface WaveFormEditorProps {
    data: WaveFormData
    updateData: (data: WaveFormData) => void
}

export default class WaveFormEditor extends React.Component<WaveFormEditorProps> {
    constructor(props: WaveFormEditorProps) {
        super(props);
    }

    protected setValues(values: number[]): void {
        this.props.updateData({
            ...this.props.data,
            values,
        });
    }

    render(): React.JSX.Element {
        const { data } = this.props;

        return <div
            tabIndex={0}
            className='waveFormEditor'
        >
            <WaveForm
                value={data.values}
                setValue={this.setValues.bind(this)}
            />
        </div>;
    }
}
