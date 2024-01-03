import { withJsonFormsControlProps } from '@jsonforms/react';
import React from 'react';
import RumbleEffectEditor from '../../components/RumbleEffectEditor/RumbleEffectEditor';
import { RumbleEffectData } from '../../components/RumbleEffectEditor/RumbleEffectTypes';
import { EditorsContext } from '../../ves-editors-types';

interface VesRumbleEffectEditorControlProps {
    data: RumbleEffectData;
    handleChange(path: string, value: RumbleEffectData): void;
    path: string;
}

const VesRumbleEffectEditorControl = ({ data, handleChange, path }: VesRumbleEffectEditorControlProps) =>
    <EditorsContext.Consumer>
        {context => <RumbleEffectEditor
            data={data}
            updateData={(newValue: RumbleEffectData) => handleChange(path, newValue)}
        />}
    </EditorsContext.Consumer>;

export default withJsonFormsControlProps(VesRumbleEffectEditorControl);
