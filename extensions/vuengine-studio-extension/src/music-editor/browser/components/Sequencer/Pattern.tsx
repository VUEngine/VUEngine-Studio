import React from 'react';
import { PATTERN_HEIGHT_FACTOR, HIGHEST_NOTE, LOWEST_NOTE, PATTERN_NOTE_WIDTH, CurrentPattern } from '../../ves-music-editor-types';

interface PatternProps {
    channel: number
    current: boolean
    height: number
    notes: (number | undefined)[]
    patternId: number
    size: number
    setCurrentPattern: (currentPattern: CurrentPattern) => void
}

export default function Pattern(props: PatternProps): JSX.Element {
    const {
        channel,
        current,
        height,
        notes,
        patternId,
        size,
        setCurrentPattern
    } = props;

    const classNames = ['pattern'];
    if (current) {
        classNames.push('current');
    }

    const boxShadow: string[] = [];
    notes.forEach((note, i) => {
        if (note !== undefined && note >= HIGHEST_NOTE && note <= LOWEST_NOTE) {
            boxShadow.push(
                `${(i + 1) * PATTERN_NOTE_WIDTH}px ${(note - HIGHEST_NOTE) * PATTERN_HEIGHT_FACTOR}px 0 0 #f00`
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
        onClick={() => setCurrentPattern({ channel, id: patternId })}
    >
        <div
            style={{
                boxShadow: boxShadow.join(','),
                height: '1px',
                marginLeft: `-${PATTERN_NOTE_WIDTH}px`,
                width: `${PATTERN_NOTE_WIDTH}px`,
            }}
        />
        {patternId}
    </div>;
}
