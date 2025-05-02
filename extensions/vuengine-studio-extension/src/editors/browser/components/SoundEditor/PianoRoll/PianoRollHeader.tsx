import React, { Dispatch, SetStateAction, useContext } from 'react';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import { SoundEditorCommands } from '../SoundEditorCommands';
import { BAR_PATTERN_LENGTH_MULT_MAP, NOTE_RESOLUTION, SoundData } from '../SoundEditorTypes';
import PianoRollHeaderNote from './PianoRollHeaderNote';
import { MetaLine, MetaLineHeader, MetaLineHeaderLine, SequencerCollapseButton } from './StyledComponents';

interface PianoRollHeaderProps {
    songData: SoundData
    currentChannelId: number
    currentPatternId: number
    playRangeStart: number
    setPlayRangeStart: (playRangeStart: number) => void
    playRangeEnd: number
    setPlayRangeEnd: (playRangeEnd: number) => void
    sequencerHidden: boolean,
    setSequencerHidden: Dispatch<SetStateAction<boolean>>
}

export default function PianoRollHeader(props: PianoRollHeaderProps): React.JSX.Element {
    const {
        songData,
        currentChannelId,
        currentPatternId,
        playRangeStart, setPlayRangeStart,
        playRangeEnd, setPlayRangeEnd,
        sequencerHidden, setSequencerHidden,
    } = props;
    const { services } = useContext(EditorsContext) as EditorsContextType;

    const channel = songData.channels[currentChannelId];
    const pattern = channel.patterns[currentPatternId];
    const patternSize = BAR_PATTERN_LENGTH_MULT_MAP[pattern.bar] * NOTE_RESOLUTION;

    return <MetaLine style={{ top: 0 }}>
        <MetaLineHeader
            style={{ height: 18 }}
        >
            <MetaLineHeaderLine>
                <SequencerCollapseButton
                    className='theia-button secondary'
                    onClick={() => setSequencerHidden(!sequencerHidden)}
                    title={
                        `${SoundEditorCommands.TOGGLE_SEQUENCER_VISIBILITY.label
                        }${services.vesCommonService.getKeybindingLabel(SoundEditorCommands.TOGGLE_SEQUENCER_VISIBILITY.id, true)}`
                    }
                >
                    <i className={sequencerHidden ? 'fa fa-chevron-down' : 'fa fa-chevron-up'} />
                </SequencerCollapseButton>
            </MetaLineHeaderLine>
        </MetaLineHeader>
        {[...Array(patternSize)].map((x, index) => (
            <PianoRollHeaderNote
                songData={songData}
                key={index}
                index={index}
                currentChannelId={currentChannelId}
                currentPatternId={currentPatternId}
                playRangeStart={playRangeStart}
                setPlayRangeStart={setPlayRangeStart}
                playRangeEnd={playRangeEnd}
                setPlayRangeEnd={setPlayRangeEnd}
            />
        ))
        }
    </MetaLine>;
};
