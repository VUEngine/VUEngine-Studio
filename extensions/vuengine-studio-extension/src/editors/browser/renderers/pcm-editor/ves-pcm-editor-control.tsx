import { withJsonFormsControlProps } from '@jsonforms/react';
import React from 'react';
import PCMEditor from '../../components/PCMEditor/PCMEditor';
import { PCMData } from '../../components/PCMEditor/PCMTypes';

interface VesPCMEditorControlProps {
    data: PCMData;
    handleChange(path: string, value: PCMData): void;
    path: string;
    config?: any;
}

const VesPCMEditorControl = ({ data, handleChange, path, config }: VesPCMEditorControlProps) =>
    <PCMEditor
        data={data}
        updateData={(newValue: PCMData) => handleChange(path, newValue)}
        fileUri={config.fileUri}
        services={config.services}
    />;

export default withJsonFormsControlProps(VesPCMEditorControl);
