import React, { Dispatch, SetStateAction } from 'react';
import { MAX_PATTERN_SIZE, NOTE_RESOLUTION, SoundData } from '../SoundEditorTypes';
import PianoRollHeaderNote from './PianoRollHeaderNote';
import { MetaLine, MetaLineHeader, MetaLineHeaderLine } from './StyledComponents';

interface PianoRollHeaderProps {
    songData: SoundData
    currentChannelId: number
    currentPatternId: number
    currentPatternNoteOffset: number
    playRangeStart: number
    setPlayRangeStart: (playRangeStart: number) => void
    playRangeEnd: number
    setPlayRangeEnd: (playRangeEnd: number) => void
    setCurrentStep: Dispatch<SetStateAction<number>>
}

export default function PianoRollHeader(props: PianoRollHeaderProps): React.JSX.Element {
    const {
        songData,
        currentChannelId,
        currentPatternId,
        currentPatternNoteOffset,
        playRangeStart, setPlayRangeStart,
        playRangeEnd, setPlayRangeEnd,
        setCurrentStep,
    } = props;

    return <MetaLine style={{ top: 0 }}>
        <MetaLineHeader
            style={{ height: 18 }}
        >
            <MetaLineHeaderLine>
            </MetaLineHeaderLine>
        </MetaLineHeader>
        {[...Array(MAX_PATTERN_SIZE * NOTE_RESOLUTION)].map((x, index) => (
            <PianoRollHeaderNote
                songData={songData}
                key={index}
                index={index}
                currentChannelId={currentChannelId}
                currentPatternId={currentPatternId}
                currentPatternNoteOffset={currentPatternNoteOffset}
                playRangeStart={playRangeStart}
                setPlayRangeStart={setPlayRangeStart}
                playRangeEnd={playRangeEnd}
                setPlayRangeEnd={setPlayRangeEnd}
                setCurrentStep={setCurrentStep}
            />
        ))
        }
    </MetaLine>;
};
