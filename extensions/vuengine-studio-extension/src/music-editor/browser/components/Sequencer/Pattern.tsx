import { nls } from '@theia/core';
import React from 'react';
import { HIGHEST_NOTE, LOWEST_NOTE, MusicEditorStateApi, NoteConfig, PATTERN_HEIGHT_FACTOR, PATTERN_NOTE_WIDTH } from '../../ves-music-editor-types';

interface PatternProps {
    index: number
    channel: number
    current: boolean
    height: number
    notes: (NoteConfig | undefined)[]
    patternId: number
    size: number
    stateApi: MusicEditorStateApi
}

export default function Pattern(props: PatternProps): JSX.Element {
    const {
        index,
        channel,
        current,
        height,
        notes,
        patternId,
        size,
        stateApi
    } = props;

    const classNames = ['pattern'];
    if (current) {
        classNames.push('current');
    }

    const boxShadow: string[] = [];
    notes.forEach((noteConfig, i) => {
        if (noteConfig !== undefined
            && noteConfig.note !== undefined
            && noteConfig.note >= HIGHEST_NOTE
            && noteConfig.note <= LOWEST_NOTE) {
            boxShadow.push(
                `${(i + 1) * PATTERN_NOTE_WIDTH}px ${(noteConfig.note - HIGHEST_NOTE) * PATTERN_HEIGHT_FACTOR}px 0 0 #f00`
            );
        }
    });

    return <div
        className={classNames.join(' ')}
        style={{
            height: `${height * PATTERN_HEIGHT_FACTOR}px`,
            minWidth: `${(size * PATTERN_NOTE_WIDTH) - 1}px`,
            width: `${(size * PATTERN_NOTE_WIDTH) - 1}px`
        }}
        onClick={() => stateApi.setCurrentPattern(channel, patternId)}
    >
        <div
            className='notes'
            style={{
                boxShadow: boxShadow.join(','),
                height: '1px',
                marginLeft: `-${PATTERN_NOTE_WIDTH}px`,
                width: `${PATTERN_NOTE_WIDTH}px`,
            }}
        />
        {patternId}
        <div
            className='remove'
            title={nls.localize('vuengine/musicEditor/removePattern', 'Remove Pattern')}
            onClick={e => {
                stateApi.removeChannelPattern(channel, index);
                e.stopPropagation();
            }}
        >
            &times;
        </div>
    </div>;
}
