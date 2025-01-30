import { withJsonFormsControlProps } from '@jsonforms/react';
import React from 'react';
import DebugMacrosEditor from '../../components/DebugMacrosEditor/DebugMacrosEditor';
import { DebugMacrosData } from '../../components/DebugMacrosEditor/DebugMacrosEditorTypes';
import { EditorsContext } from '../../ves-editors-types';

interface VesDebugMacrosEditorControlProps {
    data: DebugMacrosData;
    handleChange(path: string, value: DebugMacrosData): void;
    path: string;
}

const VesDebugMacrosEditorControl = ({ data, handleChange, path }: VesDebugMacrosEditorControlProps) =>
    <EditorsContext.Consumer>
        {context => <DebugMacrosEditor
            data={data}
            updateData={(newValue: DebugMacrosData) => {
                if (!context.isReadonly) {
                    handleChange(path, newValue);
                }
            }}
        />}
    </EditorsContext.Consumer>;

export default withJsonFormsControlProps(VesDebugMacrosEditorControl);
