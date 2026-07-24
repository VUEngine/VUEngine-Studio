import { withJsonFormsControlProps } from '@jsonforms/react';
import React from 'react';
import PCMEditor from '../../components/PCMEditor/PCMEditor';
import { PCMData } from '../../components/PCMEditor/PCMTypes';
import { EditorsContext } from '../../ves-editors-types';

interface VesPcmEditorControlProps {
    data: PCMData;
    handleChange(path: string, value: PCMData): void;
    path: string;
}

const VesPcmEditorControl = ({ data, handleChange, path }: VesPcmEditorControlProps) =>
    <EditorsContext.Consumer>
        {context => <PCMEditor
            data={data}
            updateData={(newValue: PCMData) => {
                if (!context.isReadonly) {
                    handleChange(path, newValue);
                }
            }}
        />}
    </EditorsContext.Consumer>;

export default withJsonFormsControlProps(VesPcmEditorControl);
