import { Minus, Plus } from '@phosphor-icons/react';
import { nls } from '@theia/core';
import React, { Dispatch, SetStateAction } from 'react';
import styled from 'styled-components';
import HContainer from '../../Common/Base/HContainer';
import Range from '../../Common/Base/Range';
import VContainer from '../../Common/Base/VContainer';
import {
    NOTE_RESOLUTION,
    PATTERN_SIZE_MAX,
    PATTERN_SIZE_MIN,
    SequenceMap,
    SoundData
} from '../SoundEditorTypes';
import { getTimeSignatureAt, getTimeSignatureSegments } from './timeSignature';

export const StyledSizeButton = styled.button`
    font-size: 11px;
    letter-spacing: -1px;
    font-size: 11px;
    gap: 0 !important;
    min-width: 30px !important;
    padding: 0 !important;
    width: 30px;
`;

interface SongLengthProps {
    soundData: SoundData
    updateSoundData: (soundData: SoundData) => void
    setCurrentPlayerPosition: Dispatch<SetStateAction<number>>
    // hide the input label
    // e.g. in a dialog, which already says what it is about
    hideLabel?: boolean
}

export default function SongLength(props: SongLengthProps): React.JSX.Element {
    const { soundData, updateSoundData, setCurrentPlayerPosition, hideLabel } = props;
    const { stepsPerBeat, stepsPerBar } = getTimeSignatureAt(getTimeSignatureSegments(soundData), Math.max(0, soundData.size - 1));

    const setSize = (size: number): void => {
        if (size > PATTERN_SIZE_MAX || size < PATTERN_SIZE_MIN) {
            return;
        }

        setCurrentPlayerPosition(-1);
        updateSoundData({
            ...soundData,
            loopPoint: size > soundData.loopPoint ? soundData.loopPoint : 0,
            tracks: [
                ...soundData.tracks.map(t => {
                    const updatedSequence: SequenceMap = {};
                    Object.keys(t.sequence).map(k => {
                        const step = parseInt(k);
                        const patternId = t.sequence[step];
                        const pattern = soundData.patterns[patternId];
                        if (!pattern) {
                            return;
                        }
                        const patternSize = pattern.size / NOTE_RESOLUTION;
                        if (step + patternSize <= size) {
                            updatedSequence[step] = patternId;
                        }
                    });
                    return {
                        ...t,
                        sequence: updatedSequence
                    };
                })
            ],
            size,
        });
    };

    const increaseSize = (amount: number) =>
        setSize(Math.min(PATTERN_SIZE_MAX, soundData.size + amount));

    const decreaseSize = (amount: number) =>
        setSize(Math.max(PATTERN_SIZE_MIN, soundData.size - amount));

    return (
            <VContainer>
                {!hideLabel &&
                    <label>
                        {nls.localize('vuengine/editors/sound/length', 'Length')}
                    </label>
                }
                <HContainer>
                    <StyledSizeButton
                        className="theia-button secondary"
                        onClick={() => decreaseSize(stepsPerBar)}
                        title={nls.localize('vuengine/editors/sound/decreaseLength', 'Decrease Length')}
                        disabled={soundData.size <= PATTERN_SIZE_MIN}
                    >
                        <Minus size={10} />{stepsPerBar}
                    </StyledSizeButton>
                    <StyledSizeButton
                        className="theia-button secondary"
                        onClick={() => decreaseSize(stepsPerBeat)}
                        title={nls.localize('vuengine/editors/sound/decreaseLength', 'Decrease Length')}
                        disabled={soundData.size <= PATTERN_SIZE_MIN}
                    >
                        <Minus size={10} />{stepsPerBeat}
                    </StyledSizeButton>
                    <Range
                        value={soundData.size}
                        max={PATTERN_SIZE_MAX}
                        min={PATTERN_SIZE_MIN}
                        setValue={setSize}
                        containerStyle={{ flexGrow: 1 }}
                    />
                    <StyledSizeButton
                        className="theia-button secondary"
                        onClick={() => increaseSize(stepsPerBeat)}
                        title={nls.localize('vuengine/editors/sound/increaseLength', 'Increase Length')}
                        disabled={soundData.size >= PATTERN_SIZE_MAX}
                    >
                        <Plus size={10} />{stepsPerBeat}
                    </StyledSizeButton>
                    <StyledSizeButton
                        className="theia-button secondary"
                        onClick={() => increaseSize(stepsPerBar)}
                        title={nls.localize('vuengine/editors/sound/increaseLength', 'Increase Length')}
                        disabled={soundData.size >= PATTERN_SIZE_MAX}
                    >
                        <Plus size={10} />{stepsPerBar}
                    </StyledSizeButton>
                </HContainer>
            </VContainer>
    );
}
