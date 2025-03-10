import { withJsonFormsControlProps } from '@jsonforms/react';
import React from 'react';
import PixelEditor from '../../components/PixelEditor/PixelEditor';
import { PixelData } from '../../components/PixelEditor/PixelEditorTypes';
import { EditorsContext } from '../../ves-editors-types';

interface VesPixelEditorControlProps {
    data: PixelData;
    handleChange(path: string, value: PixelData): void;
    path: string;
}

const VesPixelEditorControl = ({ data, handleChange, path }: VesPixelEditorControlProps) =>
    <EditorsContext.Consumer>
        {context => <PixelEditor
            data={data}
            updateData={(newValue: PixelData) => {
                if (!context.isReadonly) {
                    handleChange(path, newValue);
                }
            }}
        />}
    </EditorsContext.Consumer>;

export default withJsonFormsControlProps(VesPixelEditorControl);
