import { withJsonFormsControlProps } from '@jsonforms/react';
import React from 'react';
import FontEditor from '../../components/FontEditor/FontEditor';
import { FontData } from '../../components/FontEditor/FontEditorTypes';

interface VesFontEditorControlProps {
    data: FontData;
    handleChange(path: string, value: FontData): void;
    path: string;
    config?: any;
}

const VesFontEditorControl = ({ data, handleChange, path, config }: VesFontEditorControlProps) =>
    <FontEditor
        fontData={data}
        updateFontData={(newValue: FontData) => handleChange(path, newValue)}
        services={config.services}
    />;

export default withJsonFormsControlProps(VesFontEditorControl);
