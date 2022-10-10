import { withJsonFormsControlProps } from '@jsonforms/react';
import React from 'react';
import BrightnessRepeatEditor from '../../components/BrightnessRepeatEditor/BrightnessRepeatEditor';
import { BrightnessRepeatData } from '../../components/BrightnessRepeatEditor/BrightnessRepeatTypes';

interface VesBrightnessRepeatEditorControlProps {
    data: BrightnessRepeatData;
    handleChange(path: string, value: BrightnessRepeatData): void;
    path: string;
}

const VesBrightnessRepeatEditorControl = ({ data, handleChange, path }: VesBrightnessRepeatEditorControlProps) =>
    <BrightnessRepeatEditor
        data={data}
        updateData={(newValue: BrightnessRepeatData) => handleChange(path, newValue)}
    />;

export default withJsonFormsControlProps(VesBrightnessRepeatEditorControl);
