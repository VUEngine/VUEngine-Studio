import { withJsonFormsControlProps } from '@jsonforms/react';
import React from 'react';
import CompilerConfigEditor from '../../components/CompilerConfigEditor/CompilerConfigEditor';
import { CompilerConfigData } from '../../components/CompilerConfigEditor/CompilerConfigEditorTypes';
import { EditorsContext } from '../../ves-editors-types';

interface VesCompilerConfigEditorControlProps {
    data: CompilerConfigData;
    handleChange(path: string, value: CompilerConfigData): void;
    path: string;
}

const VesCompilerConfigEditorControl = ({ data, handleChange, path }: VesCompilerConfigEditorControlProps) =>
    <EditorsContext.Consumer>
        {context => <CompilerConfigEditor
            data={data}
            updateData={(newValue: CompilerConfigData) => handleChange(path, newValue)}
        />}
    </EditorsContext.Consumer>;

export default withJsonFormsControlProps(VesCompilerConfigEditorControl);
