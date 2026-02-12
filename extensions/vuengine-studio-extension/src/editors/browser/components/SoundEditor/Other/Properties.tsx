import { nls } from '@theia/core';
import React, { Dispatch, SetStateAction, useContext } from 'react';
import ReactTextareaAutosize from 'react-textarea-autosize';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import AdvancedSelect from '../../Common/Base/AdvancedSelect';
import Checkbox from '../../Common/Base/Checkbox';
import HContainer from '../../Common/Base/HContainer';
import Input from '../../Common/Base/Input';
import Range from '../../Common/Base/Range';
import VContainer from '../../Common/Base/VContainer';
import { MAX_TICK_DURATION, MIN_TICK_DURATION, NOTE_RESOLUTION, PATTERN_SIZE_MAX, SOUND_GROUP_LABELS, SoundData, SoundGroup } from '../SoundEditorTypes';
import SectionSelect from '../../Common/SectionSelect';
import { DataSection } from '../../Common/CommonTypes';
import InfoLabel from '../../Common/InfoLabel';
import RadioSelect from '../../Common/Base/RadioSelect';

interface PropertiesProps {
    soundData: SoundData
    beats: number
    bar: number
    updateSoundData: (soundData: SoundData) => void
    setNewNoteDuration: Dispatch<SetStateAction<number>>
}

export default function Properties(props: PropertiesProps): React.JSX.Element {
    const { soundData, beats, bar, updateSoundData, setNewNoteDuration } = props;
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
            loopPoint: Math.min(loopPoint, soundData.size - 1),
        });
    };

    const setSection = (section: DataSection): void => {
        updateSoundData({ ...soundData, section });
    };

    const toggleLoop = (): void => {
        updateSoundData({ ...soundData, loop: !soundData.loop });
    };

    const setSpeed = (s: number): void => {
        if (s <= MAX_TICK_DURATION && s >= MIN_TICK_DURATION) {
            updateSoundData({ ...soundData, speed: { 0: s } });
        }
    };

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

    return <VContainer gap={15}>
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
                {nls.localize('vuengine/editors/sound/sixteenthNoteDurationMs', '1/16 note duration (in milliseconds)')}
            </label>
            <Range
                value={soundData.speed[0]}
                max={MAX_TICK_DURATION}
                min={MIN_TICK_DURATION}
                setValue={setSpeed}
            />
        </VContainer>

        <HContainer gap={20}>
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
            <HContainer>
                <Checkbox
                    label={nls.localize('vuengine/editors/sound/loop', 'Loop')}
                    checked={soundData.loop}
                    setChecked={toggleLoop}
                />
                {soundData.loop &&
                    <Input
                        label={nls.localize('vuengine/editors/sound/loopPoint', 'LoopPoint')}
                        value={soundData.loopPoint}
                        setValue={setLoopPoint}
                        type='number'
                        min={0}
                        max={PATTERN_SIZE_MAX - 1}
                        width={64}
                    />
                }
            </HContainer>
        </HContainer>
        <HContainer gap={20} wrap='wrap'>
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
        </HContainer>
    </VContainer>;
}
