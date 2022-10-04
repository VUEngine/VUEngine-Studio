import { withJsonFormsControlProps } from '@jsonforms/react';
import { deepmergeCustom } from 'deepmerge-ts';
import React from 'react';
import MusicEditor from '../../components/MusicEditor/MusicEditor';
import { MUSIC_EDITOR_SONG_TEMPLATE, SongData } from '../../components/MusicEditor/MusicEditorTypes';

interface VesMusicEditorControlProps {
    data: SongData;
    handleChange(path: string, value: SongData): void;
    path: string;
    label: string;
}

const VesMusicEditorControl = ({ data, handleChange, path, label }: VesMusicEditorControlProps) => {
    const customDeepmerge = deepmergeCustom({
        mergeArrays: false,
    });
    data = customDeepmerge(MUSIC_EDITOR_SONG_TEMPLATE, data);

    return <MusicEditor
        songData={data}
        updateSongData={(newValue: SongData) => handleChange(path, newValue)}
    />;
};

export default withJsonFormsControlProps(VesMusicEditorControl);
