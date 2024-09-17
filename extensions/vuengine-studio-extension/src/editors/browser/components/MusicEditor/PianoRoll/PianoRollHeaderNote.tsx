import React from 'react';
import { SongData } from '../MusicEditorTypes';
import { MetaLineNote, MetaLineNoteProps } from './NotePropertiesNote';
import styled from 'styled-components';

interface HeaderNoteProps extends MetaLineNoteProps {
    rangeStart: boolean
    rangeEnd: boolean
    inRange: boolean
}

export const HeaderNote = styled(MetaLineNote) <HeaderNoteProps>`
    ${p => (p.rangeStart || p.rangeEnd || p.inRange) && `
        border-top: 1px solid var(--theia-focusBorder);
    `}
    margin-right: ${p => p.rangeEnd
        ? '2px'
        : '0'
    };
    padding-right: ${p => p.nth
        ? p.rangeEnd
            ? '0'
            : '2px'
        : '1px'
    };  
    
    ${p => p.rangeStart && `
        &::before {
            border-right: 10px solid transparent;
            border-top: 10px solid var(--theia-focusBorder);
            content: "";
            top: 0;
            position: absolute;
            left: 0;
            z-index: 1;
        }
    `}

    ${p => p.rangeEnd && `
        &::after {
            border-left: 10px solid transparent;
            border-top: 10px solid var(--theia-focusBorder);
            content: "";
            top: 0;
            position: absolute;
            right: 0;
            z-index: 1;
        }
    `}
`;

interface PianoRollHeaderNoteProps {
    songData: SongData
    index: number
    currentChannelId: number
    currentPatternId: number
    playRangeStart: number
    setPlayRangeStart: (playRangeStart: number) => void
    playRangeEnd: number
    setPlayRangeEnd: (playRangeEnd: number) => void
}

export default function PianoRollHeaderNote(props: PianoRollHeaderNoteProps): React.JSX.Element {
    const {
        songData,
        index,
        currentChannelId,
        currentPatternId,
        playRangeStart, setPlayRangeStart,
        playRangeEnd, setPlayRangeEnd,
    } = props;

    const channel = songData.channels[currentChannelId];
    const pattern = channel.patterns[currentPatternId];

    const classNames = ['metaLineNote'];
    /*
    if ((index + 1) % songData.bar === 0) {
        classNames.push('nth');
    }
    if (playRangeStart === index) {
        classNames.push('rangeStart');
    } else if (playRangeEnd === index) {
        classNames.push('rangeEnd');
    } else if (index > playRangeStart && index < playRangeEnd) {
        classNames.push('inRange');
    }
    */

    const updatePlayRangeStart = (start: number): void => {
        setPlayRange(start);
    };

    const updatePlayRangeEnd = (end: number): void => {
        setPlayRange(undefined, end);
    };

    const setPlayRange = (start?: number, end?: number): void => {
        if (start === undefined) {
            start = playRangeStart;
        }
        if (end === undefined) {
            end = playRangeEnd;
        }

        // auto set the respective other value if it not yet
        if (start === -1 && end > -1) {
            start = 0;
        }
        if (end === -1 && start > -1) {
            end = pattern.size - 1;
        }

        // handle end < start
        if (end > -1 && start > -1 && end < start) {
            const temp = start;
            start = end + 1;
            end = temp;
        }

        // unset both if same
        if (start === end) {
            start = -1;
            end = -1;
        }

        setPlayRangeStart(start);
        setPlayRangeEnd(end);
    };

    return (
        <HeaderNote
            className={classNames.join(' ')}
            nth={(index + 1) % songData.bar === 0}
            rangeStart={playRangeStart === index}
            rangeEnd={playRangeEnd === index}
            inRange={index > playRangeStart && index < playRangeEnd}
            onClick={() => updatePlayRangeStart(index)}
            onContextMenu={() => updatePlayRangeEnd(index)}
        />
    );
}
