import { withJsonFormsControlProps } from '@jsonforms/react';
import React from 'react';
import { ImageConfig } from '../../../../images/browser/ves-images-types';
import ImageConvEditor from '../../components/ImageConvEditor/ImageConvEditor';

interface VesImageConvEditorControlProps {
    data: ImageConfig;
    handleChange(path: string, value: ImageConfig): void;
    path: string;
    config?: any;
}

const VesImageConvEditorControl = ({ data, handleChange, path, config }: VesImageConvEditorControlProps) =>
    <ImageConvEditor
        data={data}
        updateData={(newValue: ImageConfig) => handleChange(path, newValue)}
        fileUri={config.fileUri}
        dock={config.dock}
        services={config.services}
    />;

export default withJsonFormsControlProps(VesImageConvEditorControl);
