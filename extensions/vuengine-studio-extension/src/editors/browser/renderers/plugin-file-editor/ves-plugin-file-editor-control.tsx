import { withJsonFormsControlProps } from '@jsonforms/react';
import React from 'react';
import PluginFileEditor from '../../components/PluginFileEditor/PluginFileEditor';
import { EditorsContext } from '../../ves-editors-types';
import { PluginFileData } from '../../components/PluginFileEditor/PluginFileEditorTypes';

interface VesPluginFileEditorControlProps {
    data: PluginFileData;
    handleChange(path: string, value: PluginFileData): void;
    path: string;
}

const VesPluginFileEditorControl = ({ data, handleChange, path }: VesPluginFileEditorControlProps) =>
    <EditorsContext.Consumer>
        {context => <PluginFileEditor
            data={data}
            updateData={(newValue: PluginFileData) => handleChange(path, newValue)}
            context={context}
        />}
    </EditorsContext.Consumer>;

export default withJsonFormsControlProps(VesPluginFileEditorControl);
