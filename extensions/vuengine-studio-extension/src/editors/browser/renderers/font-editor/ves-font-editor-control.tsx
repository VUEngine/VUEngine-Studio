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
        data={data}
        updateData={(newValue: FontData) => handleChange(path, newValue)}
        fileUri={config.fileUri}
        services={config.services}
    />;

export default withJsonFormsControlProps(VesFontEditorControl);
