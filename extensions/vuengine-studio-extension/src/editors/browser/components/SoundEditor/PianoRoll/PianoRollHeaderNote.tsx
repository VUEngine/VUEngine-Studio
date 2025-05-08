import React, { Dispatch, SetStateAction } from 'react';
import { NOTE_RESOLUTION, SoundData } from '../SoundEditorTypes';
import { StyledPianoRollHeaderTick } from './StyledComponents';

interface PianoRollHeaderNoteProps {
    soundData: SoundData
    index: number
    currentChannelId: number
    currentPatternId: number
    currentPatternNoteOffset: number
    playRangeStart: number
    setPlayRangeStart: (playRangeStart: number) => void
    playRangeEnd: number
    setPlayRangeEnd: (playRangeEnd: number) => void
    setCurrentStep: Dispatch<SetStateAction<number>>
}

export default function PianoRollHeaderNote(props: PianoRollHeaderNoteProps): React.JSX.Element {
    const {
        soundData,
        index,
        currentChannelId,
        currentPatternId,
        currentPatternNoteOffset,
        playRangeStart, setPlayRangeStart,
        playRangeEnd, setPlayRangeEnd,
        setCurrentStep,
    } = props;

    const channel = soundData.channels[currentChannelId];
    const pattern = channel.patterns[currentPatternId];
    const patternSize = pattern.size * NOTE_RESOLUTION;

    const classNames = [];
    if (playRangeStart === index) {
        classNames.push('rangeStart');
    } else if (playRangeEnd === index) {
        classNames.push('rangeEnd');
    } else if (index > playRangeStart && index < playRangeEnd) {
        classNames.push('inRange');
    }

    /*
    const updatePlayRangeStart = (start: number): void => {
        setPlayRange(start);
    };
    */

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
        <StyledPianoRollHeaderTick
            className={classNames.join(' ')}
            onClick={() => setCurrentStep(prev => prev === currentPatternNoteOffset + index
                ? -1
                : currentPatternNoteOffset + index
            )}
            onContextMenu={() => updatePlayRangeEnd(index)}
        >
            {index % 16 === 0
                ? (index / 16) + 1
                : index % 4 === 0
                    ? index % 16 / 4 + 1
                    : undefined
            }
        </StyledPianoRollHeaderTick>
    );
}
