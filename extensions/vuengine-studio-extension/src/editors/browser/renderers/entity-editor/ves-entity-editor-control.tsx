import { withJsonFormsControlProps } from '@jsonforms/react';
import React from 'react';
import EntityEditor from '../../components/EntityEditor/EntityEditor';
import { EntityData } from '../../components/EntityEditor/EntityEditorTypes';

interface VesEntityEditorControlProps {
    data: EntityData;
    handleChange(path: string, value: EntityData): void;
    path: string;
    config?: any;
}

const VesEntityEditorControl = ({ data, handleChange, path, config }: VesEntityEditorControlProps) => <EntityEditor
    entityData={data}
    updateEntityData={(newValue: EntityData) => handleChange(path, newValue)}
    services={config.services}
/>;

export default withJsonFormsControlProps(VesEntityEditorControl);