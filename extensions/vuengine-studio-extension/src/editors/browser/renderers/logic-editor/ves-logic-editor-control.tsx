import { withJsonFormsControlProps } from '@jsonforms/react';
import React from 'react';
import LogicEditor from '../../components/LogicEditor/LogicEditor';
import { EditorsContext } from '../../ves-editors-types';
import { LogicData } from '../../components/LogicEditor/LogicEditorTypes';

interface VesLogicEditorControlProps {
    data: LogicData;
    handleChange(path: string, value: LogicData): void;
    path: string;
}

const VesLogicEditorControl = ({ data, handleChange, path }: VesLogicEditorControlProps) =>
    <EditorsContext.Consumer>
        {context => <LogicEditor
            data={data}
            updateData={(newValue: LogicData) => {
                if (!context.isReadonly) {
                    handleChange(path, newValue);
                }
            }}
            context={context}
        />}
    </EditorsContext.Consumer>;

export default withJsonFormsControlProps(VesLogicEditorControl);
