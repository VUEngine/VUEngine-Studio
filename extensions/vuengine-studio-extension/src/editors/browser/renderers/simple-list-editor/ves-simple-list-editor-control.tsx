import { withJsonFormsControlProps } from '@jsonforms/react';
import React from 'react';
import SimpleListEditor from '../../components/SimpleListEditor/SimpleListEditor';

interface VesSimpleListEditorControlProps {
    data: Record<string, string>;
    handleChange(path: string, value: Record<string, string>): void;
    path: string;
}

const VesSimpleListEditorControl = ({ data, handleChange, path }: VesSimpleListEditorControlProps) =>
    <SimpleListEditor
        data={data}
        updateData={(newValue: Record<string, string>) => handleChange(path, newValue)}
    />;

export default withJsonFormsControlProps(VesSimpleListEditorControl);
