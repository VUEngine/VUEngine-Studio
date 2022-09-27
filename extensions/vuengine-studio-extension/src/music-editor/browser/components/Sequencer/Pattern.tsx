import { nls } from '@theia/core';
import React from 'react';
import { HIGHEST_NOTE, LOWEST_NOTE, MusicEditorStateApi, PatternConfig, PATTERN_HEIGHT_FACTOR, PATTERN_NOTE_WIDTH } from '../../ves-music-editor-types';

interface PatternProps {
    index: number
    pattern: PatternConfig
    currentChannel: number
    currentPattern: number
    channel: number
    height: number
    patternId: number
    stateApi: MusicEditorStateApi
}

export default function Pattern(props: PatternProps): JSX.Element {
    const {
        index,
        channel,
        height,
        pattern,
        patternId,
        currentChannel,
        currentPattern,
        stateApi
    } = props;

    const classNames = ['pattern'];
    if (currentChannel === channel && currentPattern === patternId) {
        classNames.push('current');
    }

    const boxShadow: string[] = [];
    pattern.notes.forEach((note, i) => {
        if (note !== undefined
            && note >= HIGHEST_NOTE
            && note <= LOWEST_NOTE) {
            boxShadow.push(
                `${(i + 1) * PATTERN_NOTE_WIDTH}px ${(note - HIGHEST_NOTE) * PATTERN_HEIGHT_FACTOR}px 0 0 #f00`
            );
        }
    });

    return <div
        className={classNames.join(' ')}
        style={{
            height: `${height * PATTERN_HEIGHT_FACTOR}px`,
            minWidth: `${(pattern.size * PATTERN_NOTE_WIDTH) - 1}px`,
            width: `${(pattern.size * PATTERN_NOTE_WIDTH) - 1}px`
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
        {patternId + 1}
        <div
            className='remove'
            title={nls.localize('vuengine/musicEditor/removePattern', 'Remove Pattern')}
            onClick={e => {
                stateApi.removeFromSequence(channel, index);
                e.stopPropagation();
            }}
        >
            &times;
        </div>
    </div>;
}
