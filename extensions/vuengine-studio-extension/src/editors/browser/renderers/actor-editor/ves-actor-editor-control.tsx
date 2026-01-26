import { withJsonFormsControlProps } from '@jsonforms/react';
import React from 'react';
import ActorEditor from '../../components/ActorEditor/ActorEditor';
import { ActorData } from '../../components/ActorEditor/ActorEditorTypes';
import { EditorsContext } from '../../ves-editors-types';

interface VesActorEditorControlProps {
    data: ActorData;
    handleChange(path: string, value: ActorData): void;
    path: string;
}

const VesActorEditorControl = ({ data, handleChange, path }: VesActorEditorControlProps) =>
    <EditorsContext.Consumer>
        {context => <ActorEditor
            data={data}
            updateData={(newValue: ActorData) => {
                if (!context.isReadonly) {
                    handleChange(path, newValue);
                }
            }}
        />}
    </EditorsContext.Consumer>;

export default withJsonFormsControlProps(VesActorEditorControl);
