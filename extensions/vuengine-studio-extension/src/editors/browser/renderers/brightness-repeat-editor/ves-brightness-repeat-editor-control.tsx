import { withJsonFormsControlProps } from '@jsonforms/react';
import React from 'react';
import BrightnessRepeatEditor from '../../components/BrightnessRepeatEditor/BrightnessRepeatEditor';
import { BrightnessRepeatData } from '../../components/BrightnessRepeatEditor/BrightnessRepeatTypes';
import { EditorsContext } from '../../ves-editors-types';

interface VesBrightnessRepeatEditorControlProps {
    data: BrightnessRepeatData;
    handleChange(path: string, value: BrightnessRepeatData): void;
    path: string;
}

const VesBrightnessRepeatEditorControl = ({ data, handleChange, path }: VesBrightnessRepeatEditorControlProps) =>
    <EditorsContext.Consumer>
        {context => <BrightnessRepeatEditor
            data={data}
            updateData={(newValue: BrightnessRepeatData) => {
                if (!context.isReadonly) {
                    handleChange(path, newValue);
                }
            }}
        />}
    </EditorsContext.Consumer>;

export default withJsonFormsControlProps(VesBrightnessRepeatEditorControl);
