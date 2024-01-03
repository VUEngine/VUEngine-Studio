import { withJsonFormsControlProps } from '@jsonforms/react';
import React from 'react';
import { ImageConfig } from '../../../../images/browser/ves-images-types';
import ImageConvEditor from '../../components/ImageConvEditor/ImageConvEditor';
import { EditorsContext } from '../../ves-editors-types';

interface VesImageConvEditorControlProps {
    data: ImageConfig;
    handleChange(path: string, value: ImageConfig): void;
    path: string;
}

const VesImageConvEditorControl = ({ data, handleChange, path }: VesImageConvEditorControlProps) =>
    <EditorsContext.Consumer>
        {context => <ImageConvEditor
            data={data}
            updateData={(newValue: ImageConfig) => handleChange(path, newValue)}
        />}
    </EditorsContext.Consumer>;

export default withJsonFormsControlProps(VesImageConvEditorControl);
