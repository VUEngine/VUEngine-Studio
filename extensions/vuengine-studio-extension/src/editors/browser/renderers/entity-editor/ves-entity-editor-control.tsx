import { withJsonFormsControlProps } from '@jsonforms/react';
import React from 'react';
import EntityEditor from '../../components/EntityEditor/EntityEditor';
import { EntityData } from '../../components/EntityEditor/EntityEditorTypes';
import { EditorsContext } from '../../ves-editors-types';

interface VesEntityEditorControlProps {
    data: EntityData;
    handleChange(path: string, value: EntityData): void;
    path: string;
}

const VesEntityEditorControl = ({ data, handleChange, path }: VesEntityEditorControlProps) =>
    <EditorsContext.Consumer>
        {context => <EntityEditor
            data={data}
            updateData={(newValue: EntityData) => handleChange(path, newValue)}
        />}
    </EditorsContext.Consumer>;

export default withJsonFormsControlProps(VesEntityEditorControl);
