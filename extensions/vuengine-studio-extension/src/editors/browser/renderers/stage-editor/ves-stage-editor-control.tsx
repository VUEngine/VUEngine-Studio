import { withJsonFormsControlProps } from '@jsonforms/react';
import React from 'react';
import StageEditor from '../../components/StageEditor/StageEditor';
import { StageData } from '../../components/StageEditor/StageEditorTypes';
import { EditorsContext } from '../../ves-editors-types';

interface VesStageEditorControlProps {
    data: StageData;
    handleChange(path: string, value: StageData): void;
    path: string;
}

const VesStageEditorControl = ({ data, handleChange, path }: VesStageEditorControlProps) =>
    <EditorsContext.Consumer>
        {context => <StageEditor
            data={data}
            updateData={(newValue: StageData) => {
                if (!context.isReadonly) {
                    handleChange(path, newValue);
                }
            }}
            context={context}
        />}
    </EditorsContext.Consumer>;

export default withJsonFormsControlProps(VesStageEditorControl);
