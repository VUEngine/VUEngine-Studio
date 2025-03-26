import React from 'react';
import { BAR_PATTERN_LENGTH_MULT_MAP, SoundData } from '../SoundEditorTypes';
import { StyledPianoRollHeaderNote } from './StyledComponents';

interface PianoRollHeaderNoteProps {
    songData: SoundData
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
    const patternSize = BAR_PATTERN_LENGTH_MULT_MAP[pattern.bar] * songData.noteResolution;

    const classNames = [];
    if (playRangeStart === index) {
        classNames.push('rangeStart');
    } else if (playRangeEnd === index) {
        classNames.push('rangeEnd');
    } else if (index > playRangeStart && index < playRangeEnd) {
        classNames.push('inRange');
    }

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
            end = patternSize - 1;
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
        <StyledPianoRollHeaderNote
            className={classNames.join(' ')}
            onClick={() => updatePlayRangeStart(index)}
            onContextMenu={() => updatePlayRangeEnd(index)}
        >
            {(index + 1) % 4 === 0 &&
                index + 1
            }
        </StyledPianoRollHeaderNote>
    );
}
