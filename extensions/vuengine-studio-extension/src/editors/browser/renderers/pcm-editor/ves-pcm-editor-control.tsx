import { withJsonFormsControlProps } from '@jsonforms/react';
import React from 'react';
import PCMEditor from '../../components/PCMEditor/PCMEditor';
import { PCMData } from '../../components/PCMEditor/PCMTypes';
import { EditorsContext } from '../../ves-editors-types';

interface VesPCMEditorControlProps {
    data: PCMData;
    handleChange(path: string, value: PCMData): void;
    path: string;
}

const VesPCMEditorControl = ({ data, handleChange, path }: VesPCMEditorControlProps) =>
    <EditorsContext.Consumer>
        {context => <PCMEditor
            data={data}
            updateData={(newValue: PCMData) => {
                if (!context.isReadonly) {
                    handleChange(path, newValue);
                }
            }}
            context={context}
        />}
    </EditorsContext.Consumer>;

export default withJsonFormsControlProps(VesPCMEditorControl);
