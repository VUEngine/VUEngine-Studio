import { withJsonFormsControlProps } from '@jsonforms/react';
import React from 'react';
import WaveFormEditor from '../../components/WaveFormEditor/WaveFormEditor';
import { WaveFormData } from '../../components/WaveFormEditor/WaveFormEditorTypes';
import { EditorsContext } from '../../ves-editors-types';

interface VesWaveFormEditorControlProps {
    data: WaveFormData;
    handleChange(path: string, value: WaveFormData): void;
    path: string;
}

const VesWaveFormEditorControl = ({ data, handleChange, path }: VesWaveFormEditorControlProps) =>
    <EditorsContext.Consumer>
        {context => <WaveFormEditor
            data={data}
            updateData={(newValue: WaveFormData) => handleChange(path, newValue)}
        />}
    </EditorsContext.Consumer>;

export default withJsonFormsControlProps(VesWaveFormEditorControl);
