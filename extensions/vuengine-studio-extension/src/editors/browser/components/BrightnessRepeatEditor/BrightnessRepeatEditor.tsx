import { nls } from '@theia/core';
import React from 'react';
import ReactTextareaAutosize from 'react-textarea-autosize';
import HContainer from '../Common/Base/HContainer';
import VContainer from '../Common/Base/VContainer';
import { BrightnessRepeatData } from './BrightnessRepeatTypes';
import Editor from './Editor';
import Preview from './Preview';

interface BrightnessRepeatEditorProps {
    data: BrightnessRepeatData
    updateData: (data: BrightnessRepeatData) => void
}

interface BrightnessRepeatState {
}

export default class BrightnessRepeatEditor extends React.Component<BrightnessRepeatEditorProps, BrightnessRepeatState> {
    constructor(props: BrightnessRepeatEditorProps) {
        super(props);
        this.state = {};
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
            className='brightnessRepeatEditor'
        >
            <HContainer gap={15} alignItems='start'>
                <VContainer grow={1} gap={15} style={{ maxWidth: 500 }}>
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
                        {nls.localize('vuengine/editors/brightnessRepeat/mirror', 'Mirror')}
                    </label>
                </VContainer>
                <VContainer>
                    <label>Preview</label>
                    <Preview
                        mirror={data.mirror}
                        values={data.values}
                    />
                </VContainer>
            </HContainer>
            <Editor
                mirror={data.mirror}
                values={data.values}
                setValue={this.setValue.bind(this)}
            />
        </div>;
    }
}
