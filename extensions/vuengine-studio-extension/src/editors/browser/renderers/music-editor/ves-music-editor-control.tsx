import { withJsonFormsControlProps } from '@jsonforms/react';
import React from 'react';
import MusicEditor from '../../components/MusicEditor/MusicEditor';
import { SongData } from '../../components/MusicEditor/MusicEditorTypes';
import { EditorsContext } from '../../ves-editors-types';

interface VesMusicEditorControlProps {
    data: SongData;
    handleChange(path: string, value: SongData): void;
    path: string;
}

const VesMusicEditorControl = ({ data, handleChange, path }: VesMusicEditorControlProps) =>
    <EditorsContext.Consumer>
        {context => <MusicEditor
            songData={data}
            updateSongData={(newValue: SongData) => {
                if (!context.isReadonly) {
                    handleChange(path, newValue);
                }
            }}
        />}
    </EditorsContext.Consumer>;

export default withJsonFormsControlProps(VesMusicEditorControl);
