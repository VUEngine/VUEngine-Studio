import { Minus, Plus } from '@phosphor-icons/react';
import { nls } from '@theia/core';
import React, { Dispatch, SetStateAction, useContext } from 'react';
import ReactTextareaAutosize from 'react-textarea-autosize';
import styled from 'styled-components';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import AdvancedSelect from '../../Common/Base/AdvancedSelect';
import Checkbox from '../../Common/Base/Checkbox';
import HContainer from '../../Common/Base/HContainer';
import Input from '../../Common/Base/Input';
import RadioSelect from '../../Common/Base/RadioSelect';
import Range from '../../Common/Base/Range';
import VContainer from '../../Common/Base/VContainer';
import { DataSection } from '../../Common/CommonTypes';
import InfoLabel from '../../Common/InfoLabel';
import SectionSelect from '../../Common/SectionSelect';
import {
    MAX_TICK_DURATION,
    MIN_TICK_DURATION,
    NOTE_RESOLUTION,
    PATTERN_SIZE_MAX,
    PATTERN_SIZE_MIN,
    SequenceMap,
    SOUND_GROUP_LABELS,
    SoundData,
    SoundGroup
} from '../SoundEditorTypes';
import { clamp } from '../../Common/Utils';

export const StyledSizeButton = styled.button`
    font-size: 11px;
    letter-spacing: -1px;
    font-size: 11px;
    gap: 0 !important;
    min-width: 30px !important;
    padding: 0 !important;
    width: 30px;
`;

interface PropertiesProps {
    soundData: SoundData
    beats: number
    bar: number
    updateSoundData: (soundData: SoundData) => void
    setNewNoteDuration: Dispatch<SetStateAction<number>>
    setCurrentPlayerPosition: Dispatch<SetStateAction<number>>
    stepsPerNote: number
    stepsPerBar: number
}

export default function Properties(props: PropertiesProps): React.JSX.Element {
    const { soundData, beats, bar, updateSoundData, setNewNoteDuration, setCurrentPlayerPosition, stepsPerNote, stepsPerBar } = props;
    const { enableCommands, disableCommands } = useContext(EditorsContext) as EditorsContextType;

    const handleOnFocus = () => {
        disableCommands();
    };

    const handleOnBlur = () => {
        enableCommands();
    };

    const setName = (n: string): void => {
        updateSoundData({ ...soundData, name: n });
    };

    const setAuthor = (a: string): void => {
        updateSoundData({ ...soundData, author: a });
    };

    const setComment = (c: string): void => {
        updateSoundData({ ...soundData, comment: c });
    };

    const setLoopPoint = (loopPoint: number): void => {
        updateSoundData({
            ...soundData,
            loopPoint: clamp(loopPoint, 0, soundData.size - 1),
        });
    };

    const increaseLoopPoint = (amount: number) =>
        setLoopPoint(soundData.loopPoint + amount);

    const decreaseLoopPoint = (amount: number) =>
        setLoopPoint(soundData.loopPoint - amount);

    const setSpeed = (s: number): void => {
        if (s <= MAX_TICK_DURATION && s >= MIN_TICK_DURATION) {
            updateSoundData({ ...soundData, speed: { 0: s } });
        }
    };

    const setSection = (section: DataSection): void => {
        updateSoundData({ ...soundData, section });
    };

    const toggleLoop = (): void => {
        updateSoundData({ ...soundData, loop: !soundData.loop });
    };

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

    const setGroup = (group: SoundGroup): void => {
        updateSoundData({ ...soundData, group });
    };

    const setBeats = (b: number): void => {
        updateSoundData({ ...soundData, timeSignature: { 0: `${b}/${bar}` } });
    };

    const setBar = (b: number): void => {
        updateSoundData({ ...soundData, timeSignature: { 0: `${beats}/${b}` } });
        setNewNoteDuration(NOTE_RESOLUTION / b);
    };

    return <VContainer gap={20}>
        <Input
            label={nls.localize('vuengine/editors/sound/name', 'Name')}
            value={soundData.name}
            setValue={setName}
        />
        <Input
            label={nls.localize('vuengine/editors/sound/author', 'Author')}
            value={soundData.author}
            setValue={setAuthor}
        />

        <VContainer>
            <label>
                {nls.localize('vuengine/editors/sound/comment', 'Comment')}
            </label>
            <ReactTextareaAutosize
                className="theia-input"
                value={soundData.comment}
                minRows={1}
                maxRows={4}
                onChange={e => setComment(e.target.value)}
                onFocus={handleOnFocus}
                onBlur={handleOnBlur}
                onKeyDown={e => e.stopPropagation()} // allow to use enter key
                style={{ resize: 'none' }}
            />
        </VContainer>

        <VContainer>
            <label>
                {nls.localize('vuengine/editors/sound/length', 'Length')}
            </label>
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
                    onClick={() => decreaseSize(stepsPerNote)}
                    title={nls.localize('vuengine/editors/sound/decreaseLength', 'Decrease Length')}
                    disabled={soundData.size <= PATTERN_SIZE_MIN}
                >
                    <Minus size={10} />{stepsPerNote}
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
                    onClick={() => increaseSize(stepsPerNote)}
                    title={nls.localize('vuengine/editors/sound/increaseLength', 'Increase Length')}
                    disabled={soundData.size >= PATTERN_SIZE_MAX}
                >
                    <Plus size={10} />{stepsPerNote}
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

        <VContainer>
            <label>
                {nls.localize('vuengine/editors/sound/sixteenthNoteDurationMs', '1/16 note duration (in milliseconds)')}
            </label>
            <Range
                value={soundData.speed[0]}
                max={MAX_TICK_DURATION}
                min={MIN_TICK_DURATION}
                setValue={setSpeed}
            />
        </VContainer>

        <VContainer>
            <label>
                {nls.localize('vuengine/editors/sound/timeSignature', 'Time Signature')}
            </label>
            <HContainer alignItems='center'>
                <Input
                    type='number'
                    value={beats}
                    setValue={setBeats}
                    min={1}
                    max={NOTE_RESOLUTION}
                    width={64}
                />
                /
                <AdvancedSelect
                    defaultValue={`${bar}`}
                    onChange={b => setBar(parseInt(b[0]))}
                    options={[{
                        value: '1',
                        label: '1',
                    }, {
                        value: '2',
                        label: '2',
                    }, {
                        value: '4',
                        label: '4',
                    }, {
                        value: '8',
                        label: '8',
                    }, {
                        value: '16',
                        label: '16',
                    }]}
                    menuPlacement='top'
                    width={64}
                />
            </HContainer>
        </VContainer>
        <HContainer gap={10}>
            <Checkbox
                label={nls.localize('vuengine/editors/sound/loop', 'Loop')}
                checked={soundData.loop}
                setChecked={toggleLoop}
            />
            {soundData.loop &&
                <VContainer gap={10}>
                    <label>
                        {nls.localize('vuengine/editors/sound/loopPoint', 'LoopPoint')}
                    </label>
                    <HContainer>
                        <StyledSizeButton
                            className="theia-button secondary"
                            onClick={() => decreaseLoopPoint(stepsPerBar)}
                            title={nls.localize('vuengine/editors/sound/decreaseLoopPoint', 'Decrease Loop Point')}
                            disabled={soundData.loopPoint <= 0}
                        >
                            <Minus size={10} />{stepsPerBar}
                        </StyledSizeButton>
                        <StyledSizeButton
                            className="theia-button secondary"
                            onClick={() => decreaseLoopPoint(stepsPerNote)}
                            title={nls.localize('vuengine/editors/sound/decreaseLoopPoint', 'Decrease Loop Point')}
                            disabled={soundData.loopPoint <= 0}
                        >
                            <Minus size={10} />{stepsPerNote}
                        </StyledSizeButton>
                        <Input
                            value={soundData.loopPoint}
                            setValue={setLoopPoint}
                            type='number'
                            min={0}
                            max={soundData.size - 1}
                            width={80}
                        />
                        <StyledSizeButton
                            className="theia-button secondary"
                            onClick={() => increaseLoopPoint(stepsPerNote)}
                            title={nls.localize('vuengine/editors/sound/increaseLoopPoint', 'Increase Loop Point')}
                            disabled={soundData.loopPoint >= soundData.size - 1}
                        >
                            <Plus size={10} />{stepsPerNote}
                        </StyledSizeButton>
                        <StyledSizeButton
                            className="theia-button secondary"
                            onClick={() => increaseLoopPoint(stepsPerBar)}
                            title={nls.localize('vuengine/editors/sound/increaseLoopPoint', 'Increase Loop Point')}
                            disabled={soundData.loopPoint >= soundData.size - 1}
                        >
                            <Plus size={10} />{stepsPerBar}
                        </StyledSizeButton>
                    </HContainer>
                </VContainer>
            }
        </HContainer>
        <VContainer>
            <InfoLabel
                label={nls.localize('vuengine/editors/sound/group', 'Group')}
                tooltip={nls.localize(
                    'vuengine/editors/sound/groupDescription',
                    'Sounds can be grouped by type. The maximum volume for each group can be set in the EngineConfig \
to allow for fine-tuning the relative volumes of e.g. background music and sound effects.'
                )}
            />
            <RadioSelect
                defaultValue={soundData.group}
                options={Object.values(SoundGroup).map(g => ({
                    label: SOUND_GROUP_LABELS[g as SoundGroup],
                    value: g,
                }))}
                onChange={options => setGroup(options[0].value as SoundGroup)}
            />
        </VContainer>
        <SectionSelect
            value={soundData.section}
            setValue={setSection}
        />
    </VContainer>;
}
