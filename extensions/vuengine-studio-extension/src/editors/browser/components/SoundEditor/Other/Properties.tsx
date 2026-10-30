import { Minus, Plus } from '@phosphor-icons/react';
import { nls } from '@theia/core';
import React, { Dispatch, SetStateAction, useContext } from 'react';
import ReactTextareaAutosize from 'react-textarea-autosize';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import Checkbox from '../../Common/Base/Checkbox';
import HContainer from '../../Common/Base/HContainer';
import Input from '../../Common/Base/Input';
import RadioSelect from '../../Common/Base/RadioSelect';
import Range from '../../Common/Base/Range';
import SongLength, { StyledSizeButton } from './SongLength';
import { getTimeSignatureAt, getTimeSignatureSegments, parseTimeSignature } from './timeSignature';
import TimeSignatureInput from './TimeSignatureInput';
import VContainer from '../../Common/Base/VContainer';
import { DataSection } from '../../Common/CommonTypes';
import InfoLabel from '../../Common/InfoLabel';
import SectionSelect from '../../Common/SectionSelect';
import {
    MASTER_VOLUME_DEFAULT,
    MASTER_VOLUME_MAX,
    MASTER_VOLUME_MIN,
    MAX_TICK_DURATION,
    MIN_TICK_DURATION,
    NOTE_RESOLUTION,
    SOUND_GROUP_LABELS,
    SoundData,
    SoundGroup
} from '../SoundEditorTypes';
import { clamp } from '../../Common/Utils';

interface PropertiesProps {
    soundData: SoundData
    updateSoundData: (soundData: SoundData) => void
    setNewNoteDuration: Dispatch<SetStateAction<number>>
    setCurrentPlayerPosition: Dispatch<SetStateAction<number>>
}

export default function Properties(props: PropertiesProps): React.JSX.Element {
    const { soundData, updateSoundData, setNewNoteDuration, setCurrentPlayerPosition } = props;
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

    const { stepsPerBeat, stepsPerBar } = getTimeSignatureAt(getTimeSignatureSegments(soundData), soundData.loopPoint);

    const increaseLoopPoint = (amount: number) =>
        setLoopPoint(soundData.loopPoint + amount);

    const decreaseLoopPoint = (amount: number) =>
        setLoopPoint(soundData.loopPoint - amount);

    const setSpeed = (s: number): void => {
        if (s <= MAX_TICK_DURATION && s >= MIN_TICK_DURATION) {
            updateSoundData({ ...soundData, speed: { 0: s } });
        }
    };

    const setMasterVolume = (masterVolume: number): void => {
        updateSoundData({ ...soundData, volume: clamp(masterVolume, MASTER_VOLUME_MIN, MASTER_VOLUME_MAX) });
    };

    const setSection = (section: DataSection): void => {
        updateSoundData({ ...soundData, section });
    };

    const toggleLoop = (): void => {
        updateSoundData({ ...soundData, loop: !soundData.loop });
    };

    const setGroup = (group: SoundGroup): void => {
        updateSoundData({ ...soundData, group });
    };

    const setTimeSignature = (timeSignature: string): void => {
        updateSoundData({ ...soundData, timeSignature: { 0: timeSignature } });
        // new notes default to the length of a beat
        const { beatUnit } = parseTimeSignature(timeSignature);
        if (beatUnit !== parseTimeSignature(soundData.timeSignature[0]).beatUnit) {
            setNewNoteDuration(NOTE_RESOLUTION / beatUnit);
        }
    };

    return <VContainer gap={20}>
        <Input
            label={nls.localize('vuengine/editors/sound/name', 'Name')}
            value={soundData.name}
            setValue={v => setName(v as string)}
        />
        <Input
            label={nls.localize('vuengine/editors/sound/author', 'Author')}
            value={soundData.author}
            setValue={v => setAuthor(v as string)}
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

        <SongLength
            soundData={soundData}
            updateSoundData={updateSoundData}
            setCurrentPlayerPosition={setCurrentPlayerPosition}
        />

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
            <InfoLabel
                label={nls.localize('vuengine/editors/sound/masterVolume', 'Master Volume')}
                tooltip={nls.localize(
                    'vuengine/editors/sound/masterVolumeDescription',
                    "Scales the volume of all tracks, in percent. The result is limited to the soundchip's maximum volume. \
The master volume effect lane can lower it further over time, e.g. for fading out a song."
                )}
            />
            <Range
                value={soundData.volume ?? MASTER_VOLUME_DEFAULT}
                max={MASTER_VOLUME_MAX}
                min={MASTER_VOLUME_MIN}
                setValue={setMasterVolume}
            />
        </VContainer>

        <VContainer>
            <label>
                {nls.localize('vuengine/editors/sound/timeSignature', 'Time Signature')}
            </label>
            <TimeSignatureInput
                value={soundData.timeSignature[0]}
                setValue={setTimeSignature}
                width={64}
            />
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
                            onClick={() => decreaseLoopPoint(stepsPerBeat)}
                            title={nls.localize('vuengine/editors/sound/decreaseLoopPoint', 'Decrease Loop Point')}
                            disabled={soundData.loopPoint <= 0}
                        >
                            <Minus size={10} />{stepsPerBeat}
                        </StyledSizeButton>
                        <Input
                            value={soundData.loopPoint}
                            setValue={v => setLoopPoint(v as number)}
                            type='number'
                            min={0}
                            max={soundData.size - 1}
                            width={80}
                        />
                        <StyledSizeButton
                            className="theia-button secondary"
                            onClick={() => increaseLoopPoint(stepsPerBeat)}
                            title={nls.localize('vuengine/editors/sound/increaseLoopPoint', 'Increase Loop Point')}
                            disabled={soundData.loopPoint >= soundData.size - 1}
                        >
                            <Plus size={10} />{stepsPerBeat}
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
                    'Sounds can be grouped by type. The maximum volume for each group can be set in the Engine Config \
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
