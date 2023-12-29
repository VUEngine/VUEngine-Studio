import { withJsonFormsControlProps } from '@jsonforms/react';
import React from 'react';
import SimpleListEditor from '../../components/SimpleListEditor/SimpleListEditor';

interface VesSimpleListEditorControlProps {
    data: string[];
    handleChange(path: string, value: string[]): void;
    path: string;
}

const VesSimpleListEditorControl = ({ data, handleChange, path }: VesSimpleListEditorControlProps) =>
    <SimpleListEditor
        data={data}
        updateData={(newValue: string[]) => handleChange(path, newValue)}
    />;

export default withJsonFormsControlProps(VesSimpleListEditorControl);
