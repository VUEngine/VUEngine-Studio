import { withJsonFormsControlProps } from '@jsonforms/react';
import React from 'react';
import { ImageConfig } from '../../../../images/browser/ves-images-types';
import ImageEditor from '../../components/ImageEditor/ImageEditor';
import { EditorsContext } from '../../ves-editors-types';

interface VesImageEditorControlProps {
    data: ImageConfig;
    handleChange(path: string, value: ImageConfig): void;
    path: string;
}

const VesImageEditorControl = ({ data, handleChange, path }: VesImageEditorControlProps) =>
    <EditorsContext.Consumer>
        {context => <ImageEditor
            data={data}
            updateData={(newValue: ImageConfig) => handleChange(path, newValue)}
        />}
    </EditorsContext.Consumer>;

export default withJsonFormsControlProps(VesImageEditorControl);
