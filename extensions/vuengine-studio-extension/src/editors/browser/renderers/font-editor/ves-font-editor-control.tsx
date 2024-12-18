import { withJsonFormsControlProps } from '@jsonforms/react';
import React from 'react';
import FontEditor from '../../components/FontEditor/FontEditor';
import { FontData } from '../../components/FontEditor/FontEditorTypes';
import { EditorsContext } from '../../ves-editors-types';

interface VesFontEditorControlProps {
    data: FontData;
    handleChange(path: string, value: FontData): void;
    path: string;
}

const VesFontEditorControl = ({ data, handleChange, path }: VesFontEditorControlProps) =>
    <EditorsContext.Consumer>
        {context => <FontEditor
            data={data}
            updateData={(newValue: FontData) => {
                if (!context.isReadonly) {
                    handleChange(path, newValue);
                }
            }}
        />}
    </EditorsContext.Consumer>;

export default withJsonFormsControlProps(VesFontEditorControl);
