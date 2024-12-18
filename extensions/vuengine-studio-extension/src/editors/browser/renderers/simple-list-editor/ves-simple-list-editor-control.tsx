import { withJsonFormsControlProps } from '@jsonforms/react';
import React from 'react';
import SimpleListEditor from '../../components/SimpleListEditor/SimpleListEditor';
import { EditorsContext } from '../../ves-editors-types';

interface VesSimpleListEditorControlProps {
    data: Record<string, string>;
    handleChange(path: string, value: Record<string, string>): void;
    path: string;
}

const VesSimpleListEditorControl = ({ data, handleChange, path }: VesSimpleListEditorControlProps) =>
    <EditorsContext.Consumer>
        {context => <SimpleListEditor
            data={data}
            updateData={(newValue: Record<string, string>) => {
                if (!context.isReadonly) {
                    handleChange(path, newValue);
                }
            }}
        />}
    </EditorsContext.Consumer>;

export default withJsonFormsControlProps(VesSimpleListEditorControl);
