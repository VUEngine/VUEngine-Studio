import { deepClone, nls } from '@theia/core';
import React from 'react';
import ReactTextareaAutosize from 'react-textarea-autosize';
import Checkbox from '../Common/Base/Checkbox';
import HContainer from '../Common/Base/HContainer';
import VContainer from '../Common/Base/VContainer';
import { BrightnessRepeatData } from './BrightnessRepeatTypes';
import Editor from './Editor';
import Preview from './Preview';

interface BrightnessRepeatEditorProps {
    data: BrightnessRepeatData
    updateData: (data: BrightnessRepeatData) => void
}

export default function BrightnessRepeatEditor(props: BrightnessRepeatEditorProps): React.JSX.Element {
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

    const setValue = (index: number, value: number): void => {
        const updatedValues = deepClone(data.values);
        updatedValues[index] = value;
        updateData({
            ...data,
            values: updatedValues
        });
    };

    return (
        <VContainer gap={20}>
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
                            onChange={onChangeDescription}
                            style={{ resize: 'none' }}
                        />
                    </VContainer>
                    <Checkbox
                        sideLabel={nls.localize('vuengine/editors/brightnessRepeat/mirror', 'Mirror')}
                        checked={data.mirror}
                        setChecked={onChangeMirror}
                    />
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
                setValue={setValue}
            />
        </VContainer>
    );
}
