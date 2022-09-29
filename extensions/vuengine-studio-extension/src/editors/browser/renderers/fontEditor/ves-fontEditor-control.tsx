import { withJsonFormsControlProps } from '@jsonforms/react';
import React from 'react';
import FontEditor from './components/FontEditor';
import { FontData } from './types';

interface VesFontEditorControlProps {
    data: FontData;
    handleChange(path: string, value: FontData): void;
    path: string;
    label: string;
}

const VesFontEditorControl = ({ data, handleChange, path, label }: VesFontEditorControlProps) => (
    <FontEditor
        fontData={data}
        updateFontData={(newValue: FontData) => handleChange(path, newValue)}
    />
);

export default withJsonFormsControlProps(VesFontEditorControl);
