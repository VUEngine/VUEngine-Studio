import { withJsonFormsControlProps } from '@jsonforms/react';
import React from 'react';
import SpriteEditor from '../../components/SpriteEditor/SpriteEditor';
import { SpriteData } from '../../components/SpriteEditor/SpriteEditorTypes';
import { EditorsContext } from '../../ves-editors-types';

interface VesSpriteEditorControlProps {
    data: SpriteData;
    handleChange(path: string, value: SpriteData): void;
    path: string;
}

const VesSpriteEditorControl = ({ data, handleChange, path }: VesSpriteEditorControlProps) =>
    <EditorsContext.Consumer>
        {context => <SpriteEditor
            data={data}
            updateData={(newValue: SpriteData) => handleChange(path, newValue)}
        />}
    </EditorsContext.Consumer>;

export default withJsonFormsControlProps(VesSpriteEditorControl);
