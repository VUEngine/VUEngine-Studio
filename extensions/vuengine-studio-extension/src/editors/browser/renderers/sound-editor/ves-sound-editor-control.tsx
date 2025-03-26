import { withJsonFormsControlProps } from '@jsonforms/react';
import React from 'react';
import SoundEditor from '../../components/SoundEditor/SoundEditor';
import { SoundData } from '../../components/SoundEditor/SoundEditorTypes';
import { EditorsContext } from '../../ves-editors-types';

interface VesSoundEditorControlProps {
    data: SoundData;
    handleChange(path: string, value: SoundData): void;
    path: string;
}

const VesSoundEditorControl = ({ data, handleChange, path }: VesSoundEditorControlProps) =>
    <EditorsContext.Consumer>
        {context => <SoundEditor
            songData={data}
            updateSongData={(newValue: SoundData) => {
                if (!context.isReadonly) {
                    handleChange(path, newValue);
                }
            }}
        />}
    </EditorsContext.Consumer>;

export default withJsonFormsControlProps(VesSoundEditorControl);
