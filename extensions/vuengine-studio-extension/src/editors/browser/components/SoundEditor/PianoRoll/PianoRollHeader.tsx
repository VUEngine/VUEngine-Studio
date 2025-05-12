import React, { Dispatch, SetStateAction } from 'react';
import { SoundData } from '../SoundEditorTypes';
import PianoRollHeaderGrid from './PianoRollHeaderGrid';
import { MetaLine, MetaLineHeader } from './StyledComponents';

interface PianoRollHeaderProps {
    soundData: SoundData
    currentChannelId: number
    currentPatternId: string
    currentPatternNoteOffset: number
    playRangeStart: number
    setPlayRangeStart: (playRangeStart: number) => void
    playRangeEnd: number
    setPlayRangeEnd: (playRangeEnd: number) => void
    setCurrentStep: Dispatch<SetStateAction<number>>
}

export default function PianoRollHeader(props: PianoRollHeaderProps): React.JSX.Element {
    const {
        soundData,
        // currentChannelId,
        // currentPatternId,
        currentPatternNoteOffset,
        // playRangeStart, setPlayRangeStart,
        // playRangeEnd, setPlayRangeEnd,
        setCurrentStep,
    } = props;

    return <MetaLine style={{ top: 0 }}>
        <MetaLineHeader
            style={{ height: 18 }}
        >
        </MetaLineHeader>
        <PianoRollHeaderGrid
            soundData={soundData}
            currentPatternNoteOffset={currentPatternNoteOffset}
            setCurrentStep={setCurrentStep}
        />
    </MetaLine>;
};
