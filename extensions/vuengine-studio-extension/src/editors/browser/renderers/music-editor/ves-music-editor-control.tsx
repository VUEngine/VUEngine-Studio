import { withJsonFormsControlProps } from '@jsonforms/react';
import React from 'react';
import MusicEditor from '../../components/MusicEditor/MusicEditor';
import { SongData } from '../../components/MusicEditor/MusicEditorTypes';

interface VesMusicEditorControlProps {
    data: SongData;
    handleChange(path: string, value: SongData): void;
    path: string;
    config?: any;
}

const VesMusicEditorControl = ({ data, handleChange, path, config }: VesMusicEditorControlProps) => <MusicEditor
    songData={data}
    updateSongData={(newValue: SongData) => handleChange(path, newValue)}
    dock={config.dock}
    services={config.services}
/>;

export default withJsonFormsControlProps(VesMusicEditorControl);
