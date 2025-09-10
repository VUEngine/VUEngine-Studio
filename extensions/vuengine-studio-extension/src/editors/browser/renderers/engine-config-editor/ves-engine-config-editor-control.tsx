import { withJsonFormsControlProps } from '@jsonforms/react';
import React from 'react';
import EngineConfigEditor from '../../components/EngineConfigEditor/EngineConfigEditor';
import { EngineConfigData } from '../../components/EngineConfigEditor/EngineConfigEditorTypes';
import { EditorsContext } from '../../ves-editors-types';

interface VesEngineConfigEditorControlProps {
    data: EngineConfigData;
    handleChange(path: string, value: EngineConfigData): void;
    path: string;
}

const VesEngineConfigEditorControl = ({ data, handleChange, path }: VesEngineConfigEditorControlProps) =>
    <EditorsContext.Consumer>
        {context => <EngineConfigEditor
            data={data}
            updateData={(newValue: EngineConfigData) => {
                if (!context.isReadonly) {
                    handleChange(path, newValue);
                }
            }}
        />}
    </EditorsContext.Consumer>;

export default withJsonFormsControlProps(VesEngineConfigEditorControl);
