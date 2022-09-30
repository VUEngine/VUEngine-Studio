import { withJsonFormsControlProps } from '@jsonforms/react';
import React from 'react';
import MusicEditor from '../../components/MusicEditor/MusicEditor';
import { SongData } from '../../components/MusicEditor/MusicEditorTypes';

interface VesMusicEditorControlProps {
    data: SongData;
    handleChange(path: string, value: SongData): void;
    path: string;
    label: string;
}

const VesMusicEditorControl = ({ data, handleChange, path, label }: VesMusicEditorControlProps) => <MusicEditor
    songData={data}
    updateSongData={(newValue: SongData) => handleChange(path, newValue)}
/>;

export default withJsonFormsControlProps(VesMusicEditorControl);
