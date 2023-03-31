import { nls } from '@theia/core';
import React from 'react';
import VContainer from '../../../../core/browser/components/VContainer';
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

    protected setValue(index: number, value: number): void {
        const updatedValues = this.props.data.values;
        updatedValues[index] = value;
        this.props.updateData({
            ...this.props.data,
            values: updatedValues
        });
    }

    render(): JSX.Element {
        const { data } = this.props;

        return <div
            tabIndex={0}
            className='brightnessRepeatEditor'
        >
            <div className='options'>
                <div>
                    <VContainer>
                        <label>
                            {nls.localize('vuengine/brightnessRepeatEditor/name', 'Name')}
                        </label>
                        <input
                            className="theia-input"
                            value={data.name}
                            onChange={this.onChangeName.bind(this)}
                        />
                    </VContainer>
                    <VContainer>
                        <label>
                            {nls.localize('vuengine/brightnessRepeatEditor/description', 'Description')}
                        </label>
                        <input
                            className="theia-input"
                            value={data.description}
                            onChange={this.onChangeDescription.bind(this)}
                        />
                    </VContainer>
                    <label>
                        <input
                            type='checkbox'
                            checked={data.mirror}
                            onChange={this.onChangeMirror.bind(this)}
                        />
                        {nls.localize('vuengine/brightnessRepeatEditor/mirror', 'Mirror')}
                    </label>
                </div>
                <VContainer>
                    <label>Preview</label>
                    <Preview
                        mirror={data.mirror}
                        values={data.values}
                    />
                </VContainer>
            </div>

            <Editor
                mirror={data.mirror}
                values={data.values}
                setValue={this.setValue.bind(this)}
            />
        </div>;
    }
}
